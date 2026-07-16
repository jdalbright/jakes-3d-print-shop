"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CatalogGrid } from "../components/CatalogGrid";
import { ProductVisual } from "../components/ProductVisual";
import { useStore } from "../components/StoreShell";
import { trackStorefrontEvent } from "../lib/storefront-events";
import type { ProductVariant, StoreProduct } from "../lib/types";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

function variantForQuantity(product: StoreProduct, quantity: number): ProductVariant | undefined {
  return product.variants
    .filter((variant) => quantity >= (variant.minQuantity ?? 1) && quantity <= (variant.maxQuantity ?? 10))
    .sort((a, b) => (b.minQuantity ?? 1) - (a.minQuantity ?? 1))[0];
}

type Props = {
  checkoutEnabled: boolean;
  keychain?: StoreProduct;
  recommendations: StoreProduct[];
};

export function OfficePilot({ checkoutEnabled, keychain, recommendations }: Props) {
  const { addItem } = useStore();
  const searchParams = useSearchParams();
  const [keychainQuantity, setKeychainQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<{ slug: string; message: string } | null>(null);

  useEffect(() => {
    trackStorefrontEvent("office_page_view", { salesChannel: "office_nfc" });
  }, []);

  function addKeychainToCart(product: StoreProduct, quantity: number, color: string) {
    const variant = variantForQuantity(product, quantity);
    if (!variant) {
      setError({
        slug: product.slug,
        message: "That quantity is not available right now. Refresh the page and try again.",
      });
      return;
    }
    setError(null);
    addItem({
      priceId: variant.priceId,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color,
      sizeLabel: variant.sizeLabel,
      quantity,
      unitAmount: variant.unitAmount,
      image: product.image,
      accent: product.accent,
      pickup: true,
      ship: false,
      minQuantity: variant.minQuantity,
      maxQuantity: variant.maxQuantity,
      salesChannel: "office_nfc",
      officeFulfillment: product.officeFulfillment ?? "take_now",
    });
    trackStorefrontEvent("office_product_select", {
      productSlug: product.slug,
      variantSku: variant.sku,
      itemCount: quantity,
      salesChannel: "office_nfc",
    });
    trackStorefrontEvent("add_to_cart", {
      productSlug: product.slug,
      variantSku: variant.sku,
      itemCount: quantity,
      salesChannel: "office_nfc",
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  const keychainBaseVariant = keychain ? variantForQuantity(keychain, 1) : undefined;
  const keychainDealVariant = keychain?.variants.find((variant) => (variant.minQuantity ?? 1) >= 2);
  const keychainVariant = keychain ? variantForQuantity(keychain, keychainQuantity) : undefined;
  const keychainSoldOut = keychain?.stockStatus === "sold_out";

  return (
    <section className="office-page">
      <div className="office-hero">
        <div>
          <p className="eyebrow">Office keychain rack / private pilot</p>
          <h1>{keychainBaseVariant ? `Pay ${money(keychainBaseVariant.unitAmount).replace(".00", "")}. Take one.` : "Pay. Take one."}</h1>
        </div>
        <p>Check the rack first, then pay securely and take any available design. The public shop is being refreshed for the first launch.</p>
      </div>

      {searchParams.get("checkout") === "canceled" ? (
        <div className="notice office-notice">Checkout was canceled. Nothing was charged, and this page is still ready.</div>
      ) : null}

      {!keychain ? (
        <div className="office-empty">
          <p className="eyebrow">Catalog setup</p>
          <h2>The office rack is being prepared.</h2>
          <p>The private page is ready, but its Stripe test keychain product has not been added yet.</p>
        </div>
      ) : null}

      <div className="office-offers">
        {keychain && keychainBaseVariant ? (
          <article className="office-offer office-offer--rack">
            <div className="office-offer-visual">
              <ProductVisual
                product={keychain}
                imageAlt="Hand-drawn illustration of assorted keychains; actual designs on the rack vary."
              />
              <span className="office-visual-note">Illustrated assortment · Actual rack designs vary</span>
              <span className="office-price-tag">
                <b>{money(keychainBaseVariant.unitAmount)}</b>
                {keychainDealVariant ? <small>2+ · {money(keychainDealVariant.unitAmount)} each</small> : null}
              </span>
            </div>
            <div className="office-offer-copy">
              <div>
                <p className="eyebrow">On the rack now</p>
                <h2>{keychain.name}</h2>
                <p>{keychain.description}</p>
              </div>
              {keychainDealVariant ? (
                <div className="office-deal-note">
                  <b>One for {money(keychainBaseVariant.unitAmount)}</b>
                  <span>Taking two or more? They’re {money(keychainDealVariant.unitAmount)} each.</span>
                </div>
              ) : null}
              <div className="office-buy-row">
                <label>
                  <span>Quantity</span>
                  <select
                    value={keychainQuantity}
                    onChange={(event) => {
                      setKeychainQuantity(Number(event.target.value));
                      setAdded(false);
                      setError(null);
                    }}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => <option key={quantity}>{quantity}</option>)}
                  </select>
                </label>
                <button
                  className="primary-button"
                  disabled={keychainSoldOut || !keychainVariant}
                  onClick={() => addKeychainToCart(keychain, keychainQuantity, keychain.colors[0])}
                  type="button"
                >
                  {keychainSoldOut
                    ? "Rack sold out"
                    : added
                      ? "Added to cart"
                      : keychainVariant
                        ? `Add ${keychainQuantity} to cart · ${money(keychainVariant.unitAmount * keychainQuantity)}`
                        : "Price unavailable"}
                </button>
              </div>
              {added ? <Link className="added-link office-added-link" href="/cart">View cart and checkout</Link> : null}
              {error?.slug === keychain.slug ? (
                <p className="checkout-error office-inline-error" role="alert" aria-live="polite">{error.message}</p>
              ) : null}
              <p className="office-fine-print">Saved while you browse · Rack payment stays separate from made-to-order items · Stripe receipt by email</p>
              <details className="office-rack-details">
                <summary>How the honor system works</summary>
                <ol className="office-steps">
                  <li><span>1</span>Make sure a keychain is physically available.</li>
                  <li><span>2</span>Add it to your cart, then choose anything else you want.</li>
                  <li><span>3</span>Pay for the rack item at checkout, then take it. No confirmation needs to be shown.</li>
                </ol>
              </details>
            </div>
          </article>
        ) : null}
      </div>

      {!checkoutEnabled ? (
        <div className="test-callout office-checkout-paused">
          <b>Checkout is safely paused.</b>
          <span>Add the office products to the Stripe test catalog to test the rack payment flow without making a real charge.</span>
        </div>
      ) : null}

      {recommendations.length ? (
        <section className="office-recommendations" aria-labelledby="office-recommendations-heading">
          <div className="office-recommendations-heading">
            <div>
              <p className="eyebrow">Recommended with your keychain</p>
              <h2 id="office-recommendations-heading">A couple of useful upgrades.</h2>
            </div>
            <p>Order through the full shop. If you work with Jake, choose pickup and add “work pickup” in the optional note—no workplace address needed.</p>
          </div>
          <CatalogGrid products={recommendations} showFilters={false} />
        </section>
      ) : null}

      <div className="office-browse">
        <div>
          <p className="eyebrow">More from the workbench</p>
          <h2>See the rest of the shop.</h2>
        </div>
        <p>The rack is the quick stop. The full storefront carries made-to-order home and desk pieces.</p>
        <Link className="primary-button" href="/products">Browse the full shop</Link>
      </div>
    </section>
  );
}
