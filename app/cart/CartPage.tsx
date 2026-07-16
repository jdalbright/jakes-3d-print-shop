"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Fulfillment } from "../lib/types";
import { PICKUP_AREA, STANDARD_US_SHIPPING_CENTS } from "../lib/store-config";
import { trackStorefrontEvent } from "../lib/storefront-events";
import { ProductVisual } from "../components/ProductVisual";
import { useStore } from "../components/StoreShell";

type CheckoutGroup = "office" | "storefront";
type CheckoutPayload = {
  items: Array<{ priceId: string; quantity: number; color: string }>;
  fulfillment: Fulfillment;
  pickupNote?: string;
  salesChannel?: "office_nfc";
  checkoutOrigin?: "cart";
};

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

export function CartPage() {
  const { items, updateQuantity, removeItem, checkoutEnabled } = useStore();
  const searchParams = useSearchParams();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("shipping");
  const [pickupNote, setPickupNote] = useState("");
  const [loadingGroup, setLoadingGroup] = useState<CheckoutGroup | null>(null);
  const [error, setError] = useState<{ group: CheckoutGroup; message: string } | null>(null);

  const officeItems = useMemo(
    () => items.filter((item) => item.salesChannel === "office_nfc"),
    [items],
  );
  const storefrontItems = useMemo(
    () => items.filter((item) => item.salesChannel !== "office_nfc"),
    [items],
  );
  const availableItems = useMemo(
    () => storefrontItems.filter((item) => fulfillment === "shipping" ? item.ship : item.pickup),
    [fulfillment, storefrontItems],
  );
  const subtotal = availableItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const officeSubtotal = officeItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
  const shipping = fulfillment === "shipping" && availableItems.length ? STANDARD_US_SHIPPING_CENTS : 0;
  const excludedCount = storefrontItems.length - availableItems.length;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  async function beginCheckout(
    group: CheckoutGroup,
    payload: CheckoutPayload,
    checkoutItemCount: number,
  ) {
    if (!checkoutEnabled) {
      setError({ group, message: "Checkout is waiting for a Stripe test key and test products." });
      return;
    }
    setLoadingGroup(group);
    setError(null);
    const salesChannel = group === "office" ? "office_nfc" as const : undefined;
    trackStorefrontEvent("checkout_start", {
      fulfillment: payload.fulfillment,
      itemCount: checkoutItemCount,
      ...(salesChannel ? { salesChannel } : {}),
    });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not start.");
      trackStorefrontEvent("checkout_redirect", {
        fulfillment: payload.fulfillment,
        itemCount: checkoutItemCount,
        ...(salesChannel ? { salesChannel } : {}),
      });
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError({
        group,
        message: checkoutError instanceof Error ? checkoutError.message : "Checkout could not start.",
      });
      setLoadingGroup(null);
    }
  }

  function checkoutStorefront() {
    const checkoutItems = availableItems.map(({ priceId, quantity, color }) => ({
      priceId,
      quantity,
      color,
    }));
    const checkoutItemCount = availableItems.reduce((sum, item) => sum + item.quantity, 0);
    void beginCheckout(
      "storefront",
      {
        items: checkoutItems,
        fulfillment,
        ...(fulfillment === "pickup" && pickupNote.trim() ? { pickupNote: pickupNote.trim() } : {}),
        ...(officeItems.length ? { checkoutOrigin: "cart" as const } : {}),
      },
      checkoutItemCount,
    );
  }

  function checkoutOffice() {
    const officeItem = officeItems[0];
    if (!officeItem || officeItems.length !== 1) {
      setError({
        group: "office",
        message: "The rack checkout needs one keychain selection. Remove the extra rack item and try again.",
      });
      return;
    }
    void beginCheckout(
      "office",
      {
        items: [{
          priceId: officeItem.priceId,
          quantity: officeItem.quantity,
          color: officeItem.color,
        }],
        fulfillment: "pickup",
        salesChannel: "office_nfc",
        ...(storefrontItems.length ? { checkoutOrigin: "cart" as const } : {}),
      },
      officeItem.quantity,
    );
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
        <p>{itemCount} item{itemCount === 1 ? "" : "s"} saved on this device</p>
      </div>
      {searchParams.get("checkout") === "canceled" ? <div className="notice">Checkout was canceled. Your cart is still here.</div> : null}
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const isOfficeItem = item.salesChannel === "office_nfc";
            const product = {
              id: item.productId, slug: item.slug, name: item.name, description: "", category: "",
              colors: [item.color], featured: false, pickup: item.pickup, ship: item.ship,
              stockStatus: "in_stock" as const, image: item.image, accent: item.accent, variants: [],
            };
            const unavailable = !isOfficeItem && (fulfillment === "shipping" ? !item.ship : !item.pickup);
            const minQuantity = Math.max(1, item.minQuantity ?? 1);
            const maxQuantity = Math.max(minQuantity, Math.min(10, item.maxQuantity ?? 10));
            return (
              <article className={`cart-item ${unavailable ? "unavailable" : ""}`} key={`${item.priceId}-${item.color}`}>
                <Link href={isOfficeItem ? "/office" : `/products/${item.slug}`}><ProductVisual product={product} /></Link>
                <div className="cart-item-copy">
                  <div>
                    <p className="eyebrow">{isOfficeItem ? "Office rack pickup" : item.sizeLabel}</p>
                    <h2>{item.name}</h2>
                    <p className="cart-color-label">{item.color}</p>
                    {item.colorDetail ? <p className="cart-color-detail">{item.colorDetail}</p> : null}
                  </div>
                  {unavailable ? <span className="item-warning">Not available for {fulfillment}</span> : null}
                  <div className="cart-item-actions">
                    <label>Qty
                      <select value={item.quantity} onChange={(event) => updateQuantity(item.priceId, item.color, Number(event.target.value))}>
                        {Array.from({ length: maxQuantity - minQuantity + 1 }, (_, index) => minQuantity + index).map((qty) => <option key={qty}>{qty}</option>)}
                      </select>
                    </label>
                    {isOfficeItem ? <Link href="/office">Change selection</Link> : null}
                    <button type="button" onClick={() => removeItem(item.priceId, item.color)}>Remove</button>
                  </div>
                </div>
                <strong>{money(item.unitAmount * item.quantity)}</strong>
              </article>
            );
          })}
        </div>

        <aside className="order-card">
          {officeItems.length ? (
            <section className="cart-checkout-group office-cart-checkout">
              <p className="eyebrow">Office rack pickup</p>
              <h2>Pay for the keychain when you’re ready.</h2>
              <p className="cart-checkout-copy">It stays saved here while you browse. The rack item uses its own pickup checkout, separate from made-to-order shop items.</p>
              <dl className="order-totals">
                <div><dt>Rack item</dt><dd>{money(officeSubtotal)}</dd></div>
                <div><dt>Pickup</dt><dd>Free</dd></div>
                <div className="total"><dt>Keychain total</dt><dd>{money(officeSubtotal)}</dd></div>
              </dl>
              {error?.group === "office" ? <p className="checkout-error" role="alert">{error.message}</p> : null}
              <button className="primary-button checkout-button" disabled={loadingGroup !== null || officeItems.length !== 1} onClick={checkoutOffice} type="button">
                {loadingGroup === "office" ? "Opening Stripe…" : "Checkout keychain separately"}
              </button>
              <Link className="cart-continue-link" href="/products">Add another object</Link>
            </section>
          ) : null}

          {officeItems.length && storefrontItems.length ? (
            <div className="cart-checkout-divider"><span>Second secure checkout</span></div>
          ) : null}

          {storefrontItems.length ? (
            <section className="cart-checkout-group storefront-cart-checkout">
              <p className="eyebrow">{officeItems.length ? "Other shop items" : "How should it get to you?"}</p>
              {officeItems.length ? (
                <>
                  <h2>Choose delivery for everything else.</h2>
                  <p className="cart-checkout-copy">These items stay together in the regular shop checkout.</p>
                </>
              ) : null}
              <div className="fulfillment-options">
                <button className={fulfillment === "shipping" ? "selected" : ""} onClick={() => setFulfillment("shipping")} type="button">
                  <span><b>Ship it</b><small>Flat rate anywhere in the U.S.</small></span><i>{money(STANDARD_US_SHIPPING_CENTS)}</i>
                </button>
                <button className={fulfillment === "pickup" ? "selected" : ""} onClick={() => setFulfillment("pickup")} type="button">
                  <span><b>{PICKUP_AREA} pickup</b><small>Work with Jake? Add a work-pickup note below.</small></span><i>Free</i>
                </button>
              </div>
              {fulfillment === "pickup" ? (
                <label className="pickup-note-field">
                  <span>Pickup note <small>Optional</small></span>
                  <textarea
                    maxLength={160}
                    onChange={(event) => setPickupNote(event.target.value)}
                    placeholder="Example: I work with Jake — work pickup, please."
                    rows={3}
                    value={pickupNote}
                  />
                  <small>Just write “work pickup”—don’t include an employer name or workplace address.</small>
                </label>
              ) : null}
              {excludedCount ? <p className="order-warning">{excludedCount} item{excludedCount === 1 ? " is" : "s are"} unavailable for this fulfillment method and won’t be checked out.</p> : null}
              <dl className="order-totals">
                <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
                <div><dt>{fulfillment === "shipping" ? "Shipping" : "Pickup"}</dt><dd>{shipping ? money(shipping) : "Free"}</dd></div>
                <div className="total"><dt>Estimated total</dt><dd>{money(subtotal + shipping)}</dd></div>
              </dl>
              {fulfillment === "shipping" ? <p className="shipping-progress">One flat shipping charge applies to these shop items.</p> : null}
              {error?.group === "storefront" ? <p className="checkout-error" role="alert">{error.message}</p> : null}
              <button className="primary-button checkout-button" disabled={loadingGroup !== null || !availableItems.length} onClick={checkoutStorefront} type="button">
                {loadingGroup === "storefront" ? "Opening Stripe…" : officeItems.length ? "Checkout other items" : "Continue to secure checkout"}
              </button>
            </section>
          ) : null}

          {!checkoutEnabled ? <div className="test-callout"><b>Checkout is safely paused.</b><span>Add a Stripe test key and test catalog to enable test payments.</span></div> : null}
          <p className="secure-note">{officeItems.length && storefrontItems.length ? "Rack and shop items use two separate secure Stripe payments." : "Payment details are collected securely on Stripe."}</p>
        </aside>
      </div>
    </section>
  );
}
