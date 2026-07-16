import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { parseColorwaysMetadata } from "../../lib/catalog-metadata";
import { checkLiveCatalogReadiness } from "../../lib/catalog-readiness";
import { commercialMetadataOrderReady } from "../../lib/commercial-license";
import {
  checkRateLimit,
  hasOnlyKeys,
  hasTrustedBrowserOrigin,
  isStrictObject,
  readJsonBody,
} from "../../lib/request-security";
import { getStripe, getValidatedSiteOrigin, isLiveLaunchEnabled } from "../../lib/stripe";
import { PICKUP_AREA, STANDARD_US_SHIPPING_CENTS } from "../../lib/store-config";
import type { Fulfillment } from "../../lib/types";

type CheckoutItem = { priceId: string; quantity: number; color: string };
type CheckoutBody = {
  items: CheckoutItem[];
  fulfillment: Fulfillment;
  pickupNote?: string;
  salesChannel?: "office_nfc";
  checkoutOrigin?: "cart";
};

const safeIdempotencyKey = /^[a-zA-Z0-9_-]{8,255}$/;
const safePriceId = /^price_[a-zA-Z0-9]{8,240}$/;
const checkoutKeys = new Set(["items", "fulfillment", "pickupNote", "salesChannel", "checkoutOrigin"]);
const checkoutItemKeys = new Set(["priceId", "quantity", "color"]);
const checkoutBodyLimit = 16 * 1_024;
const unsafeControlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

type CheckoutConflictCode =
  | "invalid_channel"
  | "invalid_color"
  | "invalid_price"
  | "invalid_quantity_tier"
  | "license_unavailable"
  | "photo_unavailable"
  | "pickup_unavailable"
  | "preview_only"
  | "shipping_unavailable"
  | "sold_out";

class CheckoutConflict extends Error {
  constructor(readonly code: CheckoutConflictCode) {
    super(code);
    this.name = "CheckoutConflict";
  }
}

function checkoutJson(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        ...headers,
      },
    },
  );
}

function parseCheckoutBody(value: unknown): CheckoutBody | null {
  if (!isStrictObject(value) || !hasOnlyKeys(value, checkoutKeys)) return null;
  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 20) return null;
  if (value.fulfillment !== "shipping" && value.fulfillment !== "pickup") return null;
  if (value.salesChannel !== undefined && value.salesChannel !== "office_nfc") return null;
  if (value.checkoutOrigin !== undefined && value.checkoutOrigin !== "cart") return null;
  if (
    value.pickupNote !== undefined
    && (typeof value.pickupNote !== "string" || unsafeControlCharacters.test(value.pickupNote))
  ) {
    return null;
  }

  const items: CheckoutItem[] = [];
  for (const candidate of value.items) {
    if (!isStrictObject(candidate) || !hasOnlyKeys(candidate, checkoutItemKeys)) return null;
    if (typeof candidate.priceId !== "string" || !safePriceId.test(candidate.priceId)) return null;
    if (
      typeof candidate.quantity !== "number"
      || !Number.isInteger(candidate.quantity)
      || candidate.quantity < 1
      || candidate.quantity > 10
    ) {
      return null;
    }
    if (typeof candidate.color !== "string") return null;
    const color = candidate.color.trim();
    if (!color || color.length > 80 || unsafeControlCharacters.test(color)) return null;
    items.push({ priceId: candidate.priceId, quantity: candidate.quantity, color });
  }

  return {
    items,
    fulfillment: value.fulfillment,
    ...(value.pickupNote !== undefined ? { pickupNote: value.pickupNote } : {}),
    ...(value.salesChannel !== undefined ? { salesChannel: value.salesChannel } : {}),
    ...(value.checkoutOrigin !== undefined ? { checkoutOrigin: value.checkoutOrigin } : {}),
  };
}

function checkoutConflictMessage(code: CheckoutConflictCode): string {
  if (code === "sold_out") return "An item in your cart just sold out.";
  if (code === "license_unavailable") return "This product is not available for live checkout yet.";
  if (code === "photo_unavailable") return "Original product photos are required before this listing can accept live payments.";
  if (code === "preview_only") return "This made-to-order product is not available to order yet.";
  if (code === "invalid_channel") return "This item is not available through that checkout page.";
  if (code === "invalid_quantity_tier") return "That quantity does not match the selected price. Refresh the page and try again.";
  if (code === "shipping_unavailable" || code === "pickup_unavailable") {
    return "An item is not available for the selected fulfillment method.";
  }
  return "A product option changed. Refresh the shop and try again.";
}

function isMissingStripeResource(error: unknown): boolean {
  if (!isStrictObject(error)) return false;
  return error.type === "StripeInvalidRequestError" && error.code === "resource_missing";
}

function operationalErrorDetails(error: unknown) {
  if (!isStrictObject(error)) return { type: "unknown" };
  const type = typeof error.type === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(error.type)
    ? error.type
    : "unknown";
  const code = typeof error.code === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(error.code)
    ? error.code
    : undefined;
  const status = typeof error.statusCode === "number" ? error.statusCode : undefined;
  return { type, ...(code ? { code } : {}), ...(status ? { status } : {}) };
}

function configuredCheckoutSiteUrl(request: Request): string {
  const configuredOrigin = getValidatedSiteOrigin(isLiveLaunchEnabled());
  if (configuredOrigin) return configuredOrigin;
  if (process.env.SITE_URL || isLiveLaunchEnabled()) throw new Error("invalid_site_url");
  return new URL(request.url).origin;
}

function metadataBool(value: string | undefined, fallback = true) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function quantityBound(value: string | undefined) {
  if (!value) return null;
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new CheckoutConflict("invalid_price");
  return quantity;
}

export async function POST(request: Request) {
  if (!hasTrustedBrowserOrigin(request)) {
    return checkoutJson("Invalid checkout origin.", 403);
  }

  const rateLimit = checkRateLimit(request, { scope: "checkout", limit: 12, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return checkoutJson("Too many checkout attempts. Please wait and try again.", 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  const parsedBody = await readJsonBody(request, checkoutBodyLimit);
  if (!parsedBody.ok) {
    return parsedBody.reason === "too_large"
      ? checkoutJson("Checkout payload is too large.", 413)
      : checkoutJson("Invalid checkout request.", 400);
  }

  const body = parseCheckoutBody(parsedBody.value);
  if (!body) {
    return checkoutJson("Invalid checkout request.", 400);
  }

  const isOfficeCheckout = body.salesChannel === "office_nfc";
  if (isOfficeCheckout && (body.fulfillment !== "pickup" || body.items.length !== 1)) {
    return checkoutJson("Office checkout supports one pickup item at a time.", 400);
  }
  if (body.pickupNote !== undefined && (typeof body.pickupNote !== "string" || body.pickupNote.length > 160)) {
    return checkoutJson("Pickup notes must be 160 characters or fewer.", 400);
  }
  const pickupNote = typeof body.pickupNote === "string"
    ? body.pickupNote.replace(/\s+/g, " ").trim()
    : "";
  if (pickupNote && (body.fulfillment !== "pickup" || isOfficeCheckout)) {
    return checkoutJson("Pickup notes are available for storefront pickup orders only.", 400);
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey !== null && !safeIdempotencyKey.test(idempotencyKey)) {
    return checkoutJson("Invalid checkout request.", 400);
  }

  if (process.env.STORE_LIVE_MODE === "true" && !isLiveLaunchEnabled()) {
    return checkoutJson("Checkout is temporarily unavailable.", 503);
  }
  if (isLiveLaunchEnabled() && process.env.STRIPE_AUTOMATIC_TAX !== "true") {
    return checkoutJson("Checkout is temporarily unavailable.", 503);
  }
  if (isLiveLaunchEnabled() && !getValidatedSiteOrigin(true)) {
    return checkoutJson("Checkout is temporarily unavailable.", 503);
  }

  const stripe = getStripe();
  if (!stripe) {
    return checkoutJson("Checkout is temporarily unavailable.", 503);
  }

  const normalizedItems = body.items;

  try {
    if (isLiveLaunchEnabled()) {
      const [productsResult, pricesResult] = await Promise.all([
        stripe.products.list({ active: true, limit: 100 }),
        stripe.prices.list({ active: true, limit: 100 }),
      ]);
      const readiness = checkLiveCatalogReadiness({
        products: productsResult.data,
        prices: pricesResult.data,
        productsTruncated: productsResult.has_more,
        pricesTruncated: pricesResult.has_more,
      });
      if (!readiness.ready) {
        console.error("checkout_catalog_unavailable", { issues: readiness.issues });
        return checkoutJson("Checkout is temporarily unavailable.", 503);
      }
    }

    const prices = await Promise.all(
      normalizedItems.map((item) => stripe.prices.retrieve(item.priceId, { expand: ["product"] })),
    );
    let subtotal = 0;
    const metadata: Record<string, string> = {
      fulfillment_method: body.fulfillment,
      sales_channel: isOfficeCheckout ? "office_nfc" : "storefront",
    };
    if (body.checkoutOrigin === "cart") metadata.checkout_origin = "cart";
    let officeFulfillment: "take_now" | "work_delivery" | null = null;

    prices.forEach((price, index) => {
      const item = normalizedItems[index];
      const expandedProduct = price.product;
      if (
        !price.active
        || price.type !== "one_time"
        || price.currency !== "usd"
        || typeof price.unit_amount !== "number"
        || typeof expandedProduct !== "object"
        || expandedProduct === null
        || ("deleted" in expandedProduct && expandedProduct.deleted)
      ) {
        throw new CheckoutConflict("invalid_price");
      }
      const product = expandedProduct as Stripe.Product;
      if (!product.active || product.metadata.storefront !== "true") throw new CheckoutConflict("invalid_price");
      const visibility = product.metadata.visibility === "office" ? "office" : "public";
      if (isOfficeCheckout ? visibility !== "office" : visibility === "office") {
        throw new CheckoutConflict("invalid_channel");
      }
      const colors = (product.metadata.colors || "As shown").split(/[|,]/).map((color) => color.trim().toLowerCase());
      if (!colors.includes(item.color.toLowerCase())) throw new CheckoutConflict("invalid_color");
      const colorways = parseColorwaysMetadata(product.metadata.colorways);
      const selectedColorway = colorways.find((colorway) => colorway.label.toLowerCase() === item.color.toLowerCase());
      if (product.metadata.colorways && !selectedColorway) throw new CheckoutConflict("invalid_color");
      if (product.metadata.stock_status === "sold_out") throw new CheckoutConflict("sold_out");
      const minQuantity = quantityBound(price.metadata.min_quantity);
      const maxQuantity = quantityBound(price.metadata.max_quantity);
      if ((minQuantity !== null && item.quantity < minQuantity) || (maxQuantity !== null && item.quantity > maxQuantity)) {
        throw new CheckoutConflict("invalid_quantity_tier");
      }
      if (minQuantity !== null && maxQuantity !== null && minQuantity > maxQuantity) {
        throw new CheckoutConflict("invalid_price");
      }
      const licenseStatus = product.metadata.license_status;
      const hasActiveLicense = licenseStatus === "active" || licenseStatus === "not_required";
      if (!commercialMetadataOrderReady(product.metadata)) {
        throw new CheckoutConflict("preview_only");
      }
      if (isLiveLaunchEnabled() && !hasActiveLicense) {
        throw new CheckoutConflict("license_unavailable");
      }
      if (isOfficeCheckout) {
        const trustedOfficeFulfillment = product.metadata.office_fulfillment;
        if (trustedOfficeFulfillment !== "take_now" && trustedOfficeFulfillment !== "work_delivery") {
          throw new CheckoutConflict("invalid_channel");
        }
        officeFulfillment = trustedOfficeFulfillment;
      }
      if (body.fulfillment === "shipping" && !metadataBool(product.metadata.ship)) {
        throw new CheckoutConflict("shipping_unavailable");
      }
      if (body.fulfillment === "pickup" && !metadataBool(product.metadata.pickup)) {
        throw new CheckoutConflict("pickup_unavailable");
      }
      subtotal += price.unit_amount * item.quantity;
      if (!Number.isSafeInteger(subtotal)) throw new CheckoutConflict("invalid_price");
      const selectedColor = selectedColorway
        ? `${item.color}|Base: ${selectedColorway.baseColor}; Cap: ${selectedColorway.capColor}`
        : item.color;
      metadata[`item_${index + 1}`] = `${price.id}|${item.quantity}|${selectedColor}`.slice(0, 500);
    });

    const siteUrl = configuredCheckoutSiteUrl(request);
    const shippingAmount = STANDARD_US_SHIPPING_CENTS;
    metadata.order_subtotal = String(subtotal);
    metadata.shipping_amount = body.fulfillment === "shipping" ? String(shippingAmount) : "0";
    if (pickupNote) metadata.pickup_note = pickupNote;
    if (officeFulfillment) metadata.office_fulfillment = officeFulfillment;
    const cancelPath = isOfficeCheckout && body.checkoutOrigin !== "cart"
      ? "/office?checkout=canceled"
      : "/cart?checkout=canceled";
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
                submit: {
                  message: pickupNote
                    ? "Jake will use your pickup note and email after payment to confirm the handoff."
                    : `${PICKUP_AREA} pickup: Jake will email you after payment to coordinate the private handoff location.`,
                },
              },
            }),
      },
      {
        idempotencyKey: idempotencyKey || undefined,
      },
    );

    if (!session.url) throw new Error("missing_checkout_url");
    return NextResponse.json(
      { url: session.url },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof CheckoutConflict) {
      return checkoutJson(checkoutConflictMessage(error.code), 409);
    }
    if (isMissingStripeResource(error)) {
      return checkoutJson(checkoutConflictMessage("invalid_price"), 409);
    }

    console.error("checkout_start_failed", operationalErrorDetails(error));
    return checkoutJson("Checkout is temporarily unavailable. Please try again.", 503);
  }
}
