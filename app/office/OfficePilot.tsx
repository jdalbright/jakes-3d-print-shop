"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductVisual } from "../components/ProductVisual";
import { trackStorefrontEvent } from "../lib/storefront-events";
import type { StoreProduct } from "../lib/types";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

type Props = {
  checkoutEnabled: boolean;
  keychain?: StoreProduct;
  organizer?: StoreProduct;
};

export function OfficePilot({ checkoutEnabled, keychain, organizer }: Props) {
  const searchParams = useSearchParams();
  const [keychainQuantity, setKeychainQuantity] = useState(1);
  const [organizerColor, setOrganizerColor] = useState(organizer?.colors[0] || "");
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackStorefrontEvent("office_page_view", { salesChannel: "office_nfc" });
  }, []);

  async function checkout(product: StoreProduct, quantity: number, color: string) {
    if (!checkoutEnabled) {
      setError("This private preview is ready for a Stripe test catalog before checkout can open.");
      return;
    }

    const variant = product.variants[0];
    setLoadingSlug(product.slug);
    setError(null);
    trackStorefrontEvent("office_product_select", {
      productSlug: product.slug,
      variantSku: variant.sku,
      itemCount: quantity,
      salesChannel: "office_nfc",
    });
    trackStorefrontEvent("checkout_start", {
      fulfillment: "pickup",
      itemCount: quantity,
      salesChannel: "office_nfc",
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          items: [{ priceId: variant.priceId, quantity, color }],
          fulfillment: "pickup",
          salesChannel: "office_nfc",
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not start.");
      trackStorefrontEvent("checkout_redirect", {
        fulfillment: "pickup",
        itemCount: quantity,
        salesChannel: "office_nfc",
      });
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not start.");
      setLoadingSlug(null);
    }
  }

  const keychainVariant = keychain?.variants[0];
  const organizerVariant = organizer?.variants[0];
  const keychainSoldOut = keychain?.stockStatus === "sold_out";
  const organizerSoldOut = organizer?.stockStatus === "sold_out";

  return (
    <section className="office-page">
      <div className="office-hero">
        <div>
          <p className="eyebrow">Office rack / private pilot</p>
          <h1>Tap. Pay. Take one.</h1>
        </div>
        <p>Buy from the rack in a few taps, then take a look at one useful desk upgrade being tested with the office first.</p>
      </div>

      {searchParams.get("checkout") === "canceled" ? (
        <div className="notice office-notice">Checkout was canceled. Nothing was charged, and this page is still ready.</div>
      ) : null}

      {!keychain && !organizer ? (
        <div className="office-empty">
          <p className="eyebrow">Catalog setup</p>
          <h2>The office shelf is being prepared.</h2>
          <p>The private page is ready, but its Stripe test products have not been added yet.</p>
        </div>
      ) : null}

      <div className="office-offers">
        {keychain && keychainVariant ? (
          <article className="office-offer office-offer--rack">
            <div className="office-offer-visual">
              <ProductVisual product={keychain} />
              <span className="office-visual-note">Illustrated assortment · Actual rack designs vary</span>
              <span className="office-price-tag">{money(keychainVariant.unitAmount)}</span>
            </div>
            <div className="office-offer-copy">
              <div>
                <p className="eyebrow">01 / On the rack now</p>
                <h2>{keychain.name}</h2>
                <p>{keychain.description}</p>
              </div>
              <ol className="office-steps">
                <li><span>1</span>Make sure a keychain is physically available.</li>
                <li><span>2</span>Pay here with Stripe.</li>
                <li><span>3</span>Take any one from the rack. No confirmation needs to be shown.</li>
              </ol>
              <div className="office-buy-row">
                <label>
                  <span>Quantity</span>
                  <select value={keychainQuantity} onChange={(event) => setKeychainQuantity(Number(event.target.value))}>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => <option key={quantity}>{quantity}</option>)}
                  </select>
                </label>
                <button
                  className="primary-button"
                  disabled={keychainSoldOut || loadingSlug !== null}
                  onClick={() => checkout(keychain, keychainQuantity, keychain.colors[0])}
                  type="button"
                >
                  {keychainSoldOut ? "Rack sold out" : loadingSlug === keychain.slug ? "Opening Stripe…" : `Pay ${money(keychainVariant.unitAmount * keychainQuantity)} & take ${keychainQuantity}`}
                </button>
              </div>
              <p className="office-fine-print">Honor-system pickup · Choose only from current rack stock · Secure Stripe receipt by email</p>
            </div>
          </article>
        ) : null}

        {organizer && organizerVariant ? (
          <aside className="office-organizer-hint" aria-labelledby="office-organizer-title">
            <div className="office-organizer-hint-visual">
              <ProductVisual product={organizer} />
            </div>
            <div className="office-organizer-hint-copy">
              <p className="eyebrow">Also available, if useful</p>
              <h2 id="office-organizer-title">{organizer.name}</h2>
              <p>I’m also testing a made-to-order four-piece organizer for anyone who could use a calmer desk. No pitch—details are here if you’re curious.</p>
              <details className="office-organizer-details">
                <summary>
                  <span>See colors and what’s included</span>
                  <b>{money(organizerVariant.unitAmount)}</b>
                </summary>
                <div className="office-organizer-details-body">
                  <p>{organizer.description}</p>
                  <ul className="office-includes">
                    {organizer.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                  </ul>
                  <fieldset className="office-colors">
                    <legend>Choose a matte color <span>{organizerColor}</span></legend>
                    <div className="color-row">
                      {organizer.colors.map((color, index) => (
                        <button
                          className={organizerColor === color ? "selected" : ""}
                          key={color}
                          onClick={() => setOrganizerColor(color)}
                          type="button"
                          aria-label={`Choose ${color}`}
                          aria-pressed={organizerColor === color}
                        >
                          <i aria-hidden="true" style={{ backgroundColor: organizer.colorHexes[index] }} />
                          <span>{color.replace("Matte ", "")}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    className="office-order-button"
                    disabled={organizerSoldOut || loadingSlug !== null || !organizerColor}
                    onClick={() => checkout(organizer, 1, organizerColor)}
                    type="button"
                  >
                    {organizerSoldOut ? "Currently unavailable" : loadingSlug === organizer.slug ? "Opening Stripe…" : `Choose this set · ${money(organizerVariant.unitAmount)}`}
                  </button>
                  <p className="office-fine-print">Made to order · Delivered at work in 3–5 business days · No delivery fee</p>
                  {!organizer.photoReady || organizer.licenseStatus !== "active" ? (
                    <div className="test-callout office-launch-gate">
                      <b>Private test listing</b>
                      <span>Original photos and an active Meyui commercial license are required before real payments are enabled.</span>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          </aside>
        ) : null}
      </div>

      {!checkoutEnabled ? (
        <div className="test-callout office-checkout-paused">
          <b>Checkout is safely paused.</b>
          <span>Add the two office products to the Stripe test catalog to test payment without making a real charge.</span>
        </div>
      ) : null}
      {error ? <p className="checkout-error office-error" role="alert" aria-live="polite">{error}</p> : null}

      <div className="office-browse">
        <div>
          <p className="eyebrow">More from the workbench</p>
          <h2>See the rest of the shop.</h2>
        </div>
        <p>The rack is the quick stop. The full storefront has larger desk and home objects printed in Jake’s Raleigh studio.</p>
        <Link className="primary-button" href="/products">Browse the full shop</Link>
      </div>
    </section>
  );
}
