import type { StoreProduct } from "../lib/types";

type VisualProduct = Pick<StoreProduct, "name" | "image" | "accent">;

type ImageDimensions = { width: number; height: number };

const exactImageDimensions: Record<string, ImageDimensions> = {
  "/products/office-keychain-assortment-illustration-v1.png": { width: 972, height: 1619 },
  "/products/japandi-paper-towel-holder-detail-v1.png": { width: 1448, height: 1086 },
  "/products/japandi-paper-towel-holder-empty-v1.png": { width: 1448, height: 1086 },
  "/products/japandi-paper-towel-holder-hero-v1.png": { width: 1448, height: 1086 },
  "/products/onami-2-headphone-stand-detail-v3.png": { width: 1451, height: 1084 },
  "/products/onami-2-headphone-stand-hero-v3.png": { width: 1451, height: 1084 },
  "/products/onami-2-headphone-stand-rear-v3.png": { width: 1451, height: 1084 },
  "/products/sabredesign/acorn-container-02.webp": { width: 1000, height: 1333 },
  "/products/sabredesign/japandi-mushroom-container-02.webp": { width: 981, height: 1309 },
  "/products/sabredesign/japandi-paper-towel-holder-07.webp": { width: 1000, height: 1333 },
  "/products/sabredesign/juno-display-tray-01.webp": { width: 1000, height: 749 },
  "/products/sabredesign/juno-display-tray-04.webp": { width: 1000, height: 749 },
};

export function productImageDimensions(source: string): ImageDimensions {
  let pathname = source.split("?")[0];
  try {
    pathname = new URL(source, "https://storefront.local").pathname;
  } catch {
    // The query-free source remains a safe lookup key for unusual catalog URLs.
  }

  if (exactImageDimensions[pathname]) return exactImageDimensions[pathname];
  if (pathname.startsWith("/products/sabredesign/")) return { width: 1000, height: 750 };
  return { width: 1200, height: 900 };
}

export function ProductVisual({
  product,
  detail = false,
  imageAlt,
  priority = false,
}: {
  product: VisualProduct;
  detail?: boolean;
  imageAlt?: string;
  priority?: boolean;
}) {
  if (product.image) {
    const { width, height } = productImageDimensions(product.image);
    return (
      <div className={`product-visual image-visual accent-${product.accent} ${detail ? "detail" : ""}`}>
        {/* Stripe product images are merchant-controlled catalog content. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={imageAlt || product.name}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
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
