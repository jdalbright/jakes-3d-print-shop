import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isLiveLaunchEnabled } from "../../lib/stripe";
import { PICKUP_AREA, STANDARD_US_SHIPPING_CENTS } from "../../lib/store-config";
import type { Fulfillment } from "../../lib/types";

type CheckoutItem = { priceId: string; quantity: number; color: string };
type CheckoutBody = {
  items?: CheckoutItem[];
  fulfillment?: Fulfillment;
  salesChannel?: "office_nfc";
};

const safeIdempotencyKey = /^[a-zA-Z0-9_-]{8,255}$/;

function metadataBool(value: string | undefined, fallback = true) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function quantityBound(value: string | undefined) {
  if (!value) return null;
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error("invalid_price");
  return quantity;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe test checkout is not configured yet." }, { status: 503 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    return NextResponse.json({ error: "Your cart must contain between 1 and 20 items." }, { status: 400 });
  }
  if (body.fulfillment !== "shipping" && body.fulfillment !== "pickup") {
    return NextResponse.json({ error: "Choose shipping or Raleigh pickup." }, { status: 400 });
  }
  if (body.salesChannel !== undefined && body.salesChannel !== "office_nfc") {
    return NextResponse.json({ error: "Invalid sales channel." }, { status: 400 });
  }

  const isOfficeCheckout = body.salesChannel === "office_nfc";
  if (isOfficeCheckout && (body.fulfillment !== "pickup" || body.items.length !== 1)) {
    return NextResponse.json({ error: "Office checkout supports one pickup item at a time." }, { status: 400 });
  }

  const normalizedItems = body.items.map((item) => ({
    priceId: typeof item.priceId === "string" ? item.priceId : "",
    quantity: Number(item.quantity),
    color: typeof item.color === "string" ? item.color.trim() : "",
  }));

  if (normalizedItems.some((item) => !item.priceId.startsWith("price_") || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10 || !item.color || item.color.length > 80)) {
    return NextResponse.json({ error: "One or more cart selections are invalid." }, { status: 400 });
  }

  try {
    const prices = await Promise.all(
      normalizedItems.map((item) => stripe.prices.retrieve(item.priceId, { expand: ["product"] })),
    );
    let subtotal = 0;
    const metadata: Record<string, string> = {
      fulfillment_method: body.fulfillment,
      sales_channel: isOfficeCheckout ? "office_nfc" : "storefront",
    };
    let officeFulfillment: "take_now" | "work_delivery" | null = null;

    prices.forEach((price, index) => {
      const product = price.product as Stripe.Product;
      const item = normalizedItems[index];
      if (!price.active || price.type !== "one_time" || price.currency !== "usd" || typeof price.unit_amount !== "number" || !product || product.deleted || !product.active || product.metadata.storefront !== "true") {
        throw new Error("invalid_price");
      }
      const visibility = product.metadata.visibility === "office" ? "office" : "public";
      if (isOfficeCheckout ? visibility !== "office" : visibility === "office") {
        throw new Error("invalid_channel");
      }
      const colors = (product.metadata.colors || "As shown").split(/[|,]/).map((color) => color.trim().toLowerCase());
      if (!colors.includes(item.color.toLowerCase())) throw new Error("invalid_color");
      if (product.metadata.stock_status === "sold_out") throw new Error("sold_out");
      const minQuantity = quantityBound(price.metadata.min_quantity);
      const maxQuantity = quantityBound(price.metadata.max_quantity);
      if ((minQuantity !== null && item.quantity < minQuantity) || (maxQuantity !== null && item.quantity > maxQuantity)) {
        throw new Error("invalid_quantity_tier");
      }
      if (minQuantity !== null && maxQuantity !== null && minQuantity > maxQuantity) throw new Error("invalid_price");
      const licenseStatus = product.metadata.license_status;
      if (isLiveLaunchEnabled() && licenseStatus !== "active" && licenseStatus !== "not_required") {
        throw new Error("license_unavailable");
      }
      if (isOfficeCheckout) {
        const trustedOfficeFulfillment = product.metadata.office_fulfillment;
        if (trustedOfficeFulfillment !== "take_now" && trustedOfficeFulfillment !== "work_delivery") {
          throw new Error("invalid_channel");
        }
        if (isLiveLaunchEnabled() && product.metadata.photo_status !== "ready") {
          throw new Error("photo_unavailable");
        }
        officeFulfillment = trustedOfficeFulfillment;
      }
      if (body.fulfillment === "shipping" && !metadataBool(product.metadata.ship)) throw new Error("shipping_unavailable");
      if (body.fulfillment === "pickup" && !metadataBool(product.metadata.pickup)) throw new Error("pickup_unavailable");
      subtotal += price.unit_amount * item.quantity;
      metadata[`item_${index + 1}`] = `${price.id}|${item.quantity}|${item.color}`.slice(0, 500);
    });

    const configuredSiteUrl = process.env.SITE_URL?.replace(/\/$/, "");
    const siteUrl = configuredSiteUrl || new URL(request.url).origin;
    const shippingAmount = STANDARD_US_SHIPPING_CENTS;
    metadata.order_subtotal = String(subtotal);
    metadata.shipping_amount = body.fulfillment === "shipping" ? String(shippingAmount) : "0";
    if (officeFulfillment) metadata.office_fulfillment = officeFulfillment;
    const cancelPath = isOfficeCheckout ? "/office?checkout=canceled" : "/cart?checkout=canceled";
    const officeSubmitMessage = officeFulfillment === "take_now"
      ? "After payment, take one physically available keychain from the rack. You do not need to show anyone the confirmation."
      : "Jake will bring your made-to-order item to work when it is ready, usually within 3–5 business days.";
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: normalizedItems.map((item) => ({ price: item.priceId, quantity: item.quantity })),
        success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}${cancelPath}`,
        customer_creation: "always",
        automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
        metadata,
        payment_intent_data: { metadata },
        ...(isOfficeCheckout
          ? {}
          : {
              phone_number_collection: { enabled: true },
              billing_address_collection: "auto" as const,
            }),
        ...(body.fulfillment === "shipping"
          ? {
              shipping_address_collection: { allowed_countries: ["US" as const] },
              shipping_options: [
                {
                  shipping_rate_data: {
                    type: "fixed_amount" as const,
                    fixed_amount: { amount: shippingAmount, currency: "usd" },
                    display_name: "Flat-rate U.S. shipping",
                    delivery_estimate: {
                      minimum: { unit: "business_day" as const, value: 3 },
                      maximum: { unit: "business_day" as const, value: 7 },
                    },
                    tax_behavior: "exclusive" as const,
                    tax_code: "txcd_92010001",
                  },
                },
              ],
            }
          : isOfficeCheckout
            ? {
                custom_text: {
                  submit: { message: officeSubmitMessage },
                },
              }
            : {
              custom_text: {
                submit: { message: `${PICKUP_AREA} pickup: Jake will email you after payment to coordinate the private handoff location.` },
              },
            }),
      },
      {
        idempotencyKey: safeIdempotencyKey.test(request.headers.get("Idempotency-Key") || "")
          ? request.headers.get("Idempotency-Key") || undefined
          : undefined,
      },
    );

    if (!session.url) throw new Error("missing_url");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const userMessage = message === "sold_out"
      ? "An item in your cart just sold out."
      : message === "license_unavailable"
        ? "This product is not available for live checkout yet."
      : message === "photo_unavailable"
        ? "Original product photos are required before this listing can accept live payments."
      : message === "invalid_channel"
        ? "This item is not available through that checkout page."
      : message === "invalid_quantity_tier"
        ? "That quantity does not match the selected price. Refresh the page and try again."
      : message.includes("unavailable")
        ? "An item is not available for the selected fulfillment method."
        : message === "invalid_color" || message === "invalid_price"
          ? "A product option changed. Refresh the shop and try again."
          : "Stripe checkout could not be started. Please try again.";
    return NextResponse.json({ error: userMessage }, { status: 400 });
  }
}
