import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "../../../lib/stripe";

export const dynamic = "force-dynamic";

type CheckoutEventState = "payment_confirmed" | "payment_pending" | "payment_failed";

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
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !endpointSecret?.startsWith("whsec_")) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      endpointSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const state = checkoutEventState(event, session);

  if (state) {
    console.info("stripe_checkout_event", {
      eventId: event.id,
      eventType: event.type,
      sessionId: session.id,
      state,
      fulfillment: session.metadata?.fulfillment_method ?? "unknown",
    });
  }

  return NextResponse.json({ received: true });
}
