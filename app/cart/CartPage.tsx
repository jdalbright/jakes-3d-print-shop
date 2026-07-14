"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Fulfillment } from "../lib/types";
import { PICKUP_AREA, STANDARD_US_SHIPPING_CENTS } from "../lib/store-config";
import { trackStorefrontEvent } from "../lib/storefront-events";
import { ProductVisual } from "../components/ProductVisual";
import { useStore } from "../components/StoreShell";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

export function CartPage() {
  const { items, updateQuantity, removeItem, checkoutEnabled } = useStore();
  const searchParams = useSearchParams();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("shipping");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableItems = useMemo(
    () => items.filter((item) => fulfillment === "shipping" ? item.ship : item.pickup),
    [fulfillment, items],
  );
  const subtotal = availableItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const shipping = fulfillment === "shipping" ? STANDARD_US_SHIPPING_CENTS : 0;
  const excludedCount = items.length - availableItems.length;

  async function checkout() {
    if (!checkoutEnabled) {
      setError("Checkout is waiting for a Stripe test key and test products.");
      return;
    }
    setLoading(true);
    setError(null);
    const itemCount = availableItems.reduce((sum, item) => sum + item.quantity, 0);
    trackStorefrontEvent("checkout_start", { fulfillment, itemCount });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          items: availableItems.map(({ priceId, quantity, color }) => ({ priceId, quantity, color })),
          fulfillment,
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not start.");
      trackStorefrontEvent("checkout_redirect", { fulfillment, itemCount });
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not start.");
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <section className="empty-cart">
        <p className="eyebrow">Your cart</p>
        <h1>Your cart is empty.</h1>
        <p>Your cart is empty. Take a look around the print shelf and find something useful.</p>
        <Link className="primary-button" href="/#shop">Browse the prints</Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-heading">
        <div><p className="eyebrow">Order details</p><h1>Your cart</h1></div>
        <p>{items.reduce((sum, item) => sum + item.quantity, 0)} item{items.length === 1 ? "" : "s"} saved on this device</p>
      </div>
      {searchParams.get("checkout") === "canceled" ? <div className="notice">Checkout was canceled. Your cart is still here.</div> : null}
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const product = {
              id: item.productId, slug: item.slug, name: item.name, description: "", category: "",
              colors: [item.color], featured: false, pickup: item.pickup, ship: item.ship,
              stockStatus: "in_stock" as const, image: item.image, accent: item.accent, variants: [],
            };
            const unavailable = fulfillment === "shipping" ? !item.ship : !item.pickup;
            return (
              <article className={`cart-item ${unavailable ? "unavailable" : ""}`} key={`${item.priceId}-${item.color}`}>
                <Link href={`/products/${item.slug}`}><ProductVisual product={product} /></Link>
                <div className="cart-item-copy">
                  <div><p className="eyebrow">{item.sizeLabel}</p><h2>{item.name}</h2><p>{item.color}</p></div>
                  {unavailable ? <span className="item-warning">Not available for {fulfillment}</span> : null}
                  <div className="cart-item-actions">
                    <label>Qty
                      <select value={item.quantity} onChange={(event) => updateQuantity(item.priceId, item.color, Number(event.target.value))}>
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((qty) => <option key={qty}>{qty}</option>)}
                      </select>
                    </label>
                    <button type="button" onClick={() => removeItem(item.priceId, item.color)}>Remove</button>
                  </div>
                </div>
                <strong>{money(item.unitAmount * item.quantity)}</strong>
              </article>
            );
          })}
        </div>

        <aside className="order-card">
          <p className="eyebrow">How should it get to you?</p>
          <div className="fulfillment-options">
            <button className={fulfillment === "shipping" ? "selected" : ""} onClick={() => setFulfillment("shipping")} type="button">
              <span><b>Ship it</b><small>Flat rate anywhere in the U.S.</small></span><i>{money(STANDARD_US_SHIPPING_CENTS)}</i>
            </button>
            <button className={fulfillment === "pickup" ? "selected" : ""} onClick={() => setFulfillment("pickup")} type="button">
              <span><b>{PICKUP_AREA} pickup</b><small>Private location coordinated after payment</small></span><i>Free</i>
            </button>
          </div>
          {excludedCount ? <p className="order-warning">{excludedCount} item{excludedCount === 1 ? " is" : "s are"} unavailable for this fulfillment method and won’t be checked out.</p> : null}
          <dl className="order-totals">
            <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div><dt>{fulfillment === "shipping" ? "Shipping" : "Pickup"}</dt><dd>{shipping ? money(shipping) : "Free"}</dd></div>
            <div className="total"><dt>Estimated total</dt><dd>{money(subtotal + shipping)}</dd></div>
          </dl>
          {fulfillment === "shipping" ? <p className="shipping-progress">One flat shipping charge applies to the full order.</p> : null}
          {!checkoutEnabled ? <div className="test-callout"><b>Checkout is safely paused.</b><span>Add a Stripe test key and test catalog to enable test payments.</span></div> : null}
          {error ? <p className="checkout-error" role="alert">{error}</p> : null}
          <button className="primary-button checkout-button" disabled={loading || !availableItems.length} onClick={checkout} type="button">
            {loading ? "Opening Stripe…" : "Continue to secure checkout"}
          </button>
          <p className="secure-note">Payment details are collected securely on Stripe.</p>
        </aside>
      </div>
    </section>
  );
}
