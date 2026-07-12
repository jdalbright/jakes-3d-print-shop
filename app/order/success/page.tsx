import type { Metadata } from "next";
import Link from "next/link";
import type Stripe from "stripe";
import { getStripe } from "../../lib/stripe";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ session_id?: string }> };

function money(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const stripe = getStripe();

  if (!stripe || !sessionId || !sessionId.startsWith("cs_")) {
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

  if (!paid) {
    return (
      <section className="confirmation-page invalid">
        <p className="eyebrow">Payment pending</p>
        <h1>Your payment isn’t confirmed yet.</h1>
        <p>Stripe is still processing this payment. Check your email before trying again.</p>
        <Link className="primary-button" href="/cart">Return to cart</Link>
      </section>
    );
  }

  return (
    <section className="confirmation-page">
      <div className="confirmation-mark" aria-hidden="true"><span>✓</span></div>
      <p className="eyebrow">Payment confirmed</p>
      <h1>It’s in the <em>queue.</em></h1>
      <p className="confirmation-deck">
        Thanks{session.customer_details?.name ? `, ${session.customer_details.name.split(" ")[0]}` : ""}. Your order is paid and Jake has the details.
      </p>
      <div className="confirmation-card">
        <div><span>Order</span><b>{session.id.slice(-8).toUpperCase()}</b></div>
        <div><span>Total</span><b>{money(session.amount_total, session.currency)}</b></div>
        <div><span>Fulfillment</span><b>{pickup ? "Local pickup" : "U.S. shipping"}</b></div>
      </div>
      <div className="next-step">
        <span>Next</span>
        <p>{pickup ? "Jake will email you to coordinate a private pickup handoff." : "You’ll receive a receipt now and an update when your prints are ready to ship."}</p>
      </div>
      <Link className="text-link" href="/">Keep browsing <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
