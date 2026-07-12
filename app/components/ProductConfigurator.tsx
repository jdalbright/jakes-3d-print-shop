"use client";

import { useState } from "react";
import type { StoreProduct } from "../lib/types";
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

  function addToCart() {
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
      pickup: product.pickup,
      ship: product.ship,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="configurator">
      <div className="product-price-row">
        <strong>{money(variant.unitAmount)}</strong>
        <span>{product.stockStatus === "made_to_order" ? "Made to order · 3–5 days" : soldOut ? "Currently sold out" : "Small batch · ready soon"}</span>
      </div>

      <fieldset>
        <legend>Size</legend>
        <div className="option-row">
          {product.variants.map((item, index) => (
            <button
              className={variantIndex === index ? "selected" : ""}
              key={item.priceId}
              onClick={() => setVariantIndex(index)}
              type="button"
              aria-pressed={variantIndex === index}
            >
              <span>{item.sizeLabel}</span><b>{money(item.unitAmount)}</b>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Color <span>{color}</span></legend>
        <div className="color-row">
          {product.colors.map((item, index) => (
            <button
              className={color === item ? "selected" : ""}
              key={item}
              onClick={() => setColor(item)}
              type="button"
              aria-label={`Choose ${item}`}
              aria-pressed={color === item}
              style={{ "--swatch-index": index } as React.CSSProperties}
            ><i aria-hidden="true" /></button>
          ))}
        </div>
      </fieldset>

      <div className="buy-row">
        <label>
          <span>Quantity</span>
          <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
            {[1, 2, 3, 4, 5].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="primary-button" disabled={soldOut} onClick={addToCart} type="button">
          {soldOut ? "Sold out" : added ? "Added to cart" : "Add to cart"}
        </button>
      </div>
      <div className="fulfillment-chips">
        {product.ship ? <span>U.S. shipping</span> : null}
        {product.pickup ? <span>Free local pickup</span> : null}
        <span>Stripe checkout</span>
      </div>
    </div>
  );
}
