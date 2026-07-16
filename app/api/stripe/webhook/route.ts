import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimit, readTextBody } from "../../../lib/request-security";
import { getStripe, hasValidStripeWebhookSecret } from "../../../lib/stripe";

export const dynamic = "force-dynamic";

type CheckoutEventState = "payment_confirmed" | "payment_pending" | "payment_failed";
const webhookBodyLimit = 256 * 1_024;
const fulfillmentValues = new Set(["shipping", "pickup"]);
const salesChannelValues = new Set(["storefront", "office_nfc"]);
const officeFulfillmentValues = new Set(["take_now", "work_delivery"]);

function webhookJson(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      ...headers,
    },
  });
}

function redactedStripeReference(value: unknown, expectedPrefix: string): string {
  if (typeof value !== "string" || !value.startsWith(expectedPrefix) || value.length < expectedPrefix.length + 6) {
    return "unknown";
  }
  return `${expectedPrefix}…${value.slice(-6)}`;
}

function safeMetadataValue(value: string | undefined, allowed: ReadonlySet<string>, fallback: string) {
  return value && allowed.has(value) ? value : fallback;
}

function verificationErrorType(error: unknown): string {
  if (typeof error !== "object" || error === null) return "unknown";
  const candidate = error as { name?: unknown; type?: unknown };
  const value = typeof candidate.type === "string" ? candidate.type : candidate.name;
  return typeof value === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(value) ? value : "unknown";
}

function checkoutEventState(event: Stripe.Event, session: Stripe.Checkout.Session): CheckoutEventState | null {
  if (event.type === "checkout.session.async_payment_failed") return "payment_failed";
  if (event.type === "checkout.session.async_payment_succeeded") return "payment_confirmed";
  if (event.type === "checkout.session.completed") {
    return session.payment_status === "paid" || session.payment_status === "no_payment_required"
      ? "payment_confirmed"
      : "payment_pending";
  }
  return null;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, { scope: "stripe-webhook", limit: 300, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return webhookJson({ error: "Too many webhook requests." }, 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !endpointSecret || !hasValidStripeWebhookSecret(endpointSecret)) {
    return webhookJson({ error: "Stripe webhook is not configured." }, 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature || signature.length > 4_096 || /[\r\n]/.test(signature)) {
    return webhookJson({ error: "Missing or invalid Stripe signature." }, 400);
  }

  // This is the bounded, raw-body equivalent of request.text(); JSON parsing here would break signature verification.
  const rawBody = await readTextBody(request, webhookBodyLimit);
  if (!rawBody.ok) {
    return rawBody.reason === "too_large"
      ? webhookJson({ error: "Webhook payload is too large." }, 413)
      : webhookJson({ error: "Invalid webhook payload." }, 400);
  }
  const payload = rawBody.value;
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      endpointSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    const errorType = verificationErrorType(error);
    if (errorType === "StripeSignatureVerificationError" || errorType === "SyntaxError") {
      return webhookJson({ error: "Invalid Stripe signature." }, 400);
    }
    console.error("stripe_webhook_verification_failed", { type: errorType });
    return webhookJson({ error: "Stripe webhook is temporarily unavailable." }, 503);
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const state = checkoutEventState(event, session);

  if (state) {
    console.info("stripe_checkout_event", {
      eventRef: redactedStripeReference(event.id, "evt_"),
      eventType: event.type,
      sessionRef: redactedStripeReference(session.id, "cs_"),
      state,
      fulfillment: safeMetadataValue(
        session.metadata?.fulfillment_method,
        fulfillmentValues,
        "unknown",
      ),
      salesChannel: safeMetadataValue(
        session.metadata?.sales_channel,
        salesChannelValues,
        "unknown",
      ),
      officeFulfillment: safeMetadataValue(
        session.metadata?.office_fulfillment,
        officeFulfillmentValues,
        "not_applicable",
      ),
    });
  }

  return webhookJson({ received: true });
}
