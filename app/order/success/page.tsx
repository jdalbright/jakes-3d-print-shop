import type { Metadata } from "next";
import Link from "next/link";
import type Stripe from "stripe";
import { getStripe } from "../../lib/stripe";
import { PICKUP_AREA } from "../../lib/store-config";
import { PurchasedCartCleanup } from "./PurchasedCartCleanup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Order confirmation",
  description: "Review the status and fulfillment details for your order.",
  alternates: { canonical: "/order/success" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Order confirmation",
    description: "Review the status and fulfillment details for your order.",
    url: "/order/success",
    images: [],
  },
};

type Props = { searchParams: Promise<{ session_id?: string | string[] }> };
const checkoutSessionIdPattern = /^cs_(?:test|live)_[A-Za-z0-9]{16,240}$/;

function money(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id: sessionIdValue } = await searchParams;
  const sessionId = typeof sessionIdValue === "string" ? sessionIdValue : null;
  const stripe = getStripe();

  if (!stripe || !sessionId || !checkoutSessionIdPattern.test(sessionId)) {
    return (
      <section className="confirmation-page invalid">
        <p className="eyebrow">Order lookup</p>
        <h1>We couldn’t verify that order.</h1>
        <p>Return to the shop or check the receipt sent by Stripe.</p>
        <Link className="primary-button" href="/">Back to the shop</Link>
      </section>
    );
  }

  let session: Stripe.Checkout.Session | null = null;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    // The generic verification state below avoids leaking Stripe details.
  }

  if (!session) {
    return (
      <section className="confirmation-page invalid">
        <p className="eyebrow">Order lookup</p>
        <h1>We couldn’t verify that order.</h1>
        <p>The link may have expired. Your Stripe receipt remains the source of truth.</p>
        <Link className="primary-button" href="/">Back to the shop</Link>
      </section>
    );
  }

  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  const pickup = session.metadata?.fulfillment_method === "pickup";
  const officeCheckout = session.metadata?.sales_channel === "office_nfc";
  const officeFulfillment = session.metadata?.office_fulfillment;
  const pickupNoteReceived = Boolean(session.metadata?.pickup_note);
  const checkoutFromCart = session.metadata?.checkout_origin === "cart";
  const purchasedCartItems = Object.entries(session.metadata ?? {}).flatMap(([key, value]) => {
    if (!/^item_\d+$/.test(key)) return [];
    const [priceId, , color] = value.split("|");
    return priceId?.startsWith("price_") && color ? [{ priceId, color }] : [];
  });

  if (!paid) {
    return (
      <section className="confirmation-page invalid">
        <p className="eyebrow">Payment pending</p>
        <h1>Your payment isn’t confirmed yet.</h1>
        <p>Stripe is still processing this payment. Check your email before trying again.</p>
        <Link className="primary-button" href={checkoutFromCart || !officeCheckout ? "/cart" : "/office"}>{checkoutFromCart || !officeCheckout ? "Return to cart" : "Return to office page"}</Link>
      </section>
    );
  }

  const fulfillmentLabel = officeCheckout
    ? officeFulfillment === "take_now"
      ? "Office rack"
      : "Delivery at work"
    : pickup
      ? `${PICKUP_AREA} pickup`
      : "U.S. shipping";
  const nextMessage = officeCheckout
    ? officeFulfillment === "take_now"
      ? "Payment confirmed—take one available keychain from the rack. You do not need to show anyone this screen."
      : "Jake will deliver your made-to-order item at work when it is ready."
    : pickup
      ? pickupNoteReceived
        ? "Jake received your pickup note and will email you to confirm the handoff."
        : `Jake will email you to coordinate a private pickup handoff in ${PICKUP_AREA}.`
      : "You’ll receive a receipt now and an update when your prints are ready to ship.";

  return (
    <section className="confirmation-page">
      <PurchasedCartCleanup items={purchasedCartItems} />
      <p className="confirmation-status">Payment / confirmed</p>
      <h1>Order confirmed.</h1>
      <p className="confirmation-deck">
        Thanks{session.customer_details?.name ? `, ${session.customer_details.name.split(" ")[0]}` : ""}. Your order is paid and Jake has the details.
      </p>
      <div className="confirmation-card">
        <div><span>Order</span><b>{session.id.slice(-8).toUpperCase()}</b></div>
        <div><span>Total</span><b>{money(session.amount_total, session.currency)}</b></div>
        <div><span>Fulfillment</span><b>{fulfillmentLabel}</b></div>
      </div>
      <div className="next-step">
        <span>Next</span>
        <p>{nextMessage}</p>
      </div>
      <Link className="text-link" href={checkoutFromCart ? "/cart" : officeCheckout ? "/office" : "/"}>{checkoutFromCart ? "Continue with the rest of your cart" : officeCheckout ? "Back to the office page" : "Keep browsing"} <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
