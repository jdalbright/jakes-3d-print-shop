import "server-only";
import type Stripe from "stripe";
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

function splitMetadata(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  return value
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

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

  return {
    id: product.id,
    slug,
    name: product.name,
    description: product.description || "A small-batch 3D print made with care in Jake's studio.",
    category: product.metadata.category || "Prints",
    colors: splitMetadata(product.metadata.colors, ["As shown"]),
    featured: boolMetadata(product.metadata.featured),
    pickup: boolMetadata(product.metadata.pickup, true),
    ship: boolMetadata(product.metadata.ship, true),
    stockStatus,
    image: product.images[0] || (isDemo ? demoImages[slug] : null) || null,
    accent: product.metadata.accent || accents[index % accents.length],
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
