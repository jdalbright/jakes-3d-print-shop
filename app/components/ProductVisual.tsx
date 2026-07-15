import type { StoreProduct } from "../lib/types";

type VisualProduct = Pick<StoreProduct, "name" | "image" | "accent">;

export function ProductVisual({
  product,
  detail = false,
  imageAlt,
}: {
  product: VisualProduct;
  detail?: boolean;
  imageAlt?: string;
}) {
  if (product.image) {
    return (
      <div className={`product-visual image-visual accent-${product.accent} ${detail ? "detail" : ""}`}>
        {/* Stripe product images are merchant-controlled catalog content. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={imageAlt || product.name} />
      </div>
    );
  }

  const initials = product.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (
    <div
      className={`product-visual generated-visual accent-${product.accent} ${detail ? "detail" : ""}`}
      role="img"
      aria-label={imageAlt || `${product.name} product photo placeholder`}
    >
      <span className="visual-grid" aria-hidden="true" />
      <span className="visual-object" aria-hidden="true">
        <i /><i /><i /><b>{initials}</b>
      </span>
      <span className="visual-caption">Photo coming soon</span>
    </div>
  );
}
