"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StoreProduct } from "../lib/types";
import { ProductVisual } from "./ProductVisual";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

export function CatalogGrid({ products }: { products: StoreProduct[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const [category, setCategory] = useState("All");
  const visible = category === "All" ? products : products.filter((product) => product.category === category);

  return (
    <>
      <div className="filter-row" aria-label="Filter products by category">
        {categories.map((item) => (
          <button
            className={category === item ? "selected" : ""}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
            aria-pressed={category === item}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="product-grid">
        {visible.map((product) => {
          const price = Math.min(...product.variants.map((variant) => variant.unitAmount));
          return (
            <article className="product-card" key={product.id}>
              <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
                <ProductVisual product={product} />
              </Link>
              <div className="product-card-copy">
                <div>
                  <p className="eyebrow">{product.category}</p>
                  <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                </div>
                <p className="price">{product.variants.length > 1 ? "From " : ""}{money(price)}</p>
              </div>
              <div className="product-meta">
                <span>{product.stockStatus === "made_to_order" ? "Made to order" : product.stockStatus === "sold_out" ? "Sold out" : "Ready soon"}</span>
                <span>{product.colors.length} color{product.colors.length === 1 ? "" : "s"}</span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
