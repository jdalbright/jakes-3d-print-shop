"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { commercialPrintOrderReady, commercialPrintPreviewMessage } from "../lib/commercial-license";
import type { StoreProduct } from "../lib/types";
import { trackStorefrontEvent } from "../lib/storefront-events";
import { useStore } from "./StoreShell";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

export function ProductConfigurator({ product }: { product: StoreProduct }) {
  const { addItem } = useStore();
  const [variantIndex, setVariantIndex] = useState(0);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = product.variants[variantIndex];
  const soldOut = product.stockStatus === "sold_out";
  const previewOnly = !commercialPrintOrderReady(product);
  const previewMessage = commercialPrintPreviewMessage(product);
  const pricingInFinalTesting = Boolean(product.pricingPending);
  const colorways = product.colorways?.length === product.colors.length ? product.colorways : undefined;
  const selectedColorway = colorways?.find((item) => item.label === color);
  const minQuantity = variant.minQuantity ?? 1;
  const maxQuantity = variant.maxQuantity ?? 10;
  const quantities = Array.from({ length: maxQuantity - minQuantity + 1 }, (_, index) => minQuantity + index);

  useEffect(() => {
    trackStorefrontEvent("product_view", { productSlug: product.slug });
  }, [product.slug]);

  function addToCart() {
    if (soldOut || previewOnly || quantity < minQuantity || quantity > maxQuantity) return;
    addItem({
      priceId: variant.priceId,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color,
      colorDetail: selectedColorway
        ? `Base: ${selectedColorway.baseColor} · Cap: ${selectedColorway.capColor}`
        : undefined,
      sizeLabel: variant.sizeLabel,
      quantity,
      unitAmount: variant.unitAmount,
      image: product.image,
      accent: product.accent,
      pickup: product.pickup,
      ship: product.ship,
      minQuantity,
      maxQuantity,
    });
    trackStorefrontEvent("add_to_cart", {
      productSlug: product.slug,
      variantSku: variant.sku,
      itemCount: quantity,
    });
    setAdded(true);
  }

  return (
    <div className="configurator">
      <div className="product-price-row">
        <strong>{pricingInFinalTesting ? "Pricing in final testing" : money(variant.unitAmount)}</strong>
        <span>{previewOnly ? pricingInFinalTesting ? "Local draft · ordering is not open" : "Preview · ordering is not open yet" : product.stockStatus === "made_to_order" ? "Made to order · 3–5 days" : soldOut ? "Currently sold out" : "Small batch · ready soon"}</span>
      </div>

      <fieldset>
        <legend>Size</legend>
        <div className="option-row">
          {product.variants.map((item, index) => (
            <button
              className={variantIndex === index ? "selected" : ""}
              key={item.priceId}
              onClick={() => {
                setVariantIndex(index);
                setAdded(false);
              }}
              type="button"
              aria-pressed={variantIndex === index}
            >
              <span>{item.sizeLabel}</span><b>{pricingInFinalTesting ? "Price pending" : money(item.unitAmount)}</b>
            </button>
          ))}
        </div>
      </fieldset>

      {colorways ? (
        <fieldset>
          <legend>Colorway <span>{color}</span></legend>
          <div className="colorway-row">
            {colorways.map((item) => (
              <button
                className={`colorway-option ${color === item.label ? "selected" : ""}`}
                key={item.label}
                onClick={() => {
                  setColor(item.label);
                  setAdded(false);
                }}
                type="button"
                aria-label={`Choose ${item.label}. Base: ${item.baseColor}. Cap: ${item.capColor}.`}
                aria-pressed={color === item.label}
              >
                <span className="colorway-swatches" aria-hidden="true">
                  <i style={{ backgroundColor: item.baseHex }} />
                  <i style={{ backgroundColor: item.capHex }} />
                </span>
                <span className="colorway-copy">
                  <b className="colorway-name">{item.label}</b>
                  <small className="colorway-detail">Base: {item.baseColor}</small>
                  <small className="colorway-detail">Cap: {item.capColor}</small>
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <fieldset>
          <legend>Color <span>{color}</span></legend>
          <div className="color-row">
            {product.colors.map((item, index) => (
              <button
                className={color === item ? "selected" : ""}
                key={item}
                onClick={() => {
                  setColor(item);
                  setAdded(false);
                }}
                type="button"
                aria-label={`Choose ${item}`}
                aria-pressed={color === item}
              >
                <i aria-hidden="true" style={{ backgroundColor: product.colorHexes[index] || "#7c827d" }} />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <dl className="variant-specs" aria-live="polite">
        <div><dt>SKU</dt><dd>{variant.sku}</dd></div>
        <div><dt>Dimensions</dt><dd>{variant.dimensions || "One size"}</dd></div>
      </dl>
      {product.fitNote ? <p className="fit-note">{product.fitNote}</p> : null}

      <div className="buy-row">
        <label>
          <span>Quantity</span>
          <select
            value={quantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              setAdded(false);
            }}
          >
            {quantities.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="primary-button" data-added={added || undefined} disabled={soldOut || previewOnly} onClick={addToCart} type="button">
          {soldOut ? "Sold out" : previewOnly ? "Preview only" : added ? "Added — add another" : "Add to cart"}
        </button>
      </div>
      {previewMessage ? <p className="product-preview-note" role="status">{previewMessage}</p> : null}
      <div className="fulfillment-chips">
        {product.ship ? <span>U.S. shipping</span> : null}
        {product.pickup ? <span>Free off-site Raleigh handoff</span> : null}
        <span>{previewOnly ? "Ordering opens after approval" : "Secure Stripe checkout"}</span>
      </div>
      {added ? <Link className="added-link" href="/cart">View cart</Link> : null}

      <div className="mobile-buy-bar">
        <span><small>{variant.sizeLabel}</small><strong>{pricingInFinalTesting ? "Price pending" : money(variant.unitAmount)}</strong></span>
        <button className="primary-button" data-added={added || undefined} disabled={soldOut || previewOnly} onClick={addToCart} type="button">
          {soldOut ? "Sold out" : previewOnly ? "Preview only" : added ? "Add another" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
