import "server-only";
import type Stripe from "stripe";
import { buildColorHexes, normalizeProductImages, splitMetadata, textMetadata } from "./catalog-metadata";
import { demoProducts } from "./demo-catalog";
import { getStripe } from "./stripe";
import type { CatalogResult, StoreProduct } from "./types";

const accents = ["clay", "ocean", "graphite", "moss", "rose", "yellow"];
const demoImages: Record<string, string> = {
  "wave-planter": "/products/wave-planter-demo.png",
  "articulated-dragon": "/products/articulated-dragon-demo.png",
  "controller-dock": "/products/controller-dock-demo.png",
  "hex-catchall-tray": "/products/hex-catchall-tray-demo.png",
  "book-nook-marker-set": "/products/book-nook-markers-demo.png",
  "cable-comb-set": "/products/cable-comb-set-demo.png",
};

function boolMetadata(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function productFromStripe(
  product: Stripe.Product,
  prices: Stripe.Price[],
  index: number,
): StoreProduct | null {
  const variants = prices
    .filter(
      (price) =>
        price.active &&
        price.type === "one_time" &&
        price.currency === "usd" &&
        typeof price.unit_amount === "number",
    )
    .map((price, priceIndex) => ({
      priceId: price.id,
      sizeLabel: price.metadata.size_label || price.nickname || (prices.length === 1 ? "Standard" : `Option ${priceIndex + 1}`),
      unitAmount: price.unit_amount ?? 0,
      currency: "usd" as const,
      sku: price.lookup_key || price.metadata.variant_key || price.id,
      dimensions: price.metadata.dimensions?.trim() || undefined,
    }))
    .sort((a, b) => a.unitAmount - b.unitAmount);

  if (!variants.length) return null;

  const stock = product.metadata.stock_status;
  const stockStatus =
    stock === "sold_out" || stock === "made_to_order" || stock === "in_stock"
      ? stock
      : "made_to_order";

  const slug = product.metadata.shop_slug || product.id;
  const isDemo = boolMetadata(product.metadata.demo);
  const accent = product.metadata.accent || accents[index % accents.length];
  const colors = splitMetadata(product.metadata.colors, ["As shown"]);
  const fallbackImage = isDemo ? demoImages[slug] : null;
  const images = normalizeProductImages(product.images, fallbackImage);
  const description = product.description || "A small-batch 3D print made with care in Jake's studio.";
  const defaultLeadTime = stockStatus === "sold_out"
    ? "Currently unavailable"
    : stockStatus === "in_stock"
      ? "Usually ready in 1–3 business days"
      : "Usually ready in 3–5 business days";

  return {
    id: product.id,
    slug,
    name: product.name,
    description,
    category: product.metadata.category || "Prints",
    colors,
    featured: boolMetadata(product.metadata.featured),
    pickup: boolMetadata(product.metadata.pickup, true),
    ship: boolMetadata(product.metadata.ship, true),
    stockStatus,
    image: images[0] || null,
    images,
    accent,
    colorHexes: buildColorHexes(colors, product.metadata.color_hexes, accent),
    detailCopy: textMetadata(product.metadata.detail_copy, description),
    highlights: splitMetadata(product.metadata.highlights, []),
    material: textMetadata(product.metadata.material, "PLA"),
    finish: textMetadata(product.metadata.finish, "Visible print layers, finished and checked by hand"),
    care: textMetadata(product.metadata.care, "Wipe clean with a soft, damp cloth and keep away from high heat"),
    leadTime: textMetadata(product.metadata.lead_time, defaultLeadTime),
    variants,
    demo: isDemo,
  };
}

export async function getCatalog(): Promise<CatalogResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { products: demoProducts, source: "demo", checkoutEnabled: false };
  }

  try {
    const [productsResult, pricesResult] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, currency: "usd", type: "one_time", limit: 100 }),
    ]);

    const visibleProducts = productsResult.data.filter(
      (product) => product.metadata.storefront === "true",
    );
    const products = visibleProducts
      .map((product, index) =>
        productFromStripe(
          product,
          pricesResult.data.filter((price) =>
            typeof price.product === "string"
              ? price.product === product.id
              : price.product.id === product.id,
          ),
          index,
        ),
      )
      .filter((product): product is StoreProduct => product !== null);

    return products.length
      ? { products, source: "stripe", checkoutEnabled: true }
      : { products: demoProducts, source: "demo", checkoutEnabled: false };
  } catch {
    return { products: demoProducts, source: "demo", checkoutEnabled: false };
  }
}

export async function getCatalogProduct(slug: string) {
  const catalog = await getCatalog();
  return {
    product: catalog.products.find((item) => item.slug === slug) ?? null,
    ...catalog,
  };
}
