import "server-only";
import type Stripe from "stripe";
import { buildColorHexes, normalizeProductImages, splitMetadata, textMetadata } from "./catalog-metadata";
import { demoProducts, officeDemoProducts } from "./demo-catalog";
import { getStripe } from "./stripe";
import type { CatalogResult, CatalogVisibility, OfficeFulfillment, ProductLicenseStatus, StoreProduct } from "./types";

const accents = ["clay", "ocean", "graphite", "moss", "rose", "yellow"];
const localProductImages: Record<string, string[]> = {
  "onami-2-headphone-stand": [
    "/products/onami-2-headphone-stand-hero-v3.png",
    "/products/onami-2-headphone-stand-rear-v3.png",
    "/products/onami-2-headphone-stand-detail-v3.png",
  ],
  "japandi-paper-towel-holder": [
    "/products/japandi-paper-towel-holder-hero-v1.png",
    "/products/japandi-paper-towel-holder-empty-v1.png",
    "/products/japandi-paper-towel-holder-detail-v1.png",
  ],
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
      sku: price.metadata.variant_key || price.lookup_key || price.id,
      dimensions: price.metadata.dimensions?.trim() || undefined,
    }))
    .sort((a, b) => a.unitAmount - b.unitAmount);

  if (!variants.length) return null;

  const stock = product.metadata.stock_status;
  const stockStatus =
    stock === "sold_out" || stock === "made_to_order" || stock === "in_stock"
      ? stock
      : "made_to_order";

  const visibility: CatalogVisibility = product.metadata.visibility === "office" ? "office" : "public";
  const officeFulfillment: OfficeFulfillment | undefined =
    product.metadata.office_fulfillment === "take_now" || product.metadata.office_fulfillment === "work_delivery"
      ? product.metadata.office_fulfillment
      : undefined;

  const slug = product.metadata.shop_slug || product.id;
  const isDemo = boolMetadata(product.metadata.demo);
  const metadataLicenseStatus = product.metadata.license_status;
  const licenseStatus: ProductLicenseStatus =
    metadataLicenseStatus === "active" ||
    metadataLicenseStatus === "expired" ||
    metadataLicenseStatus === "not_required"
      ? metadataLicenseStatus
      : "pending";
  const accent = product.metadata.accent || accents[index % accents.length];
  const colors = splitMetadata(product.metadata.colors, ["As shown"]);
  const fallbackImages = localProductImages[slug] || [];
  const stripeImages = normalizeProductImages(product.images, null);
  const images = stripeImages.length ? stripeImages : fallbackImages;
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
    visibility,
    officeFulfillment,
    photoReady: product.metadata.photo_status === "ready",
    image: images[0] || null,
    images,
    accent,
    colorHexes: buildColorHexes(colors, product.metadata.color_hexes, accent),
    detailCopy: textMetadata(product.metadata.detail_copy, description),
    highlights: splitMetadata(product.metadata.highlights, []),
    fitNote: product.metadata.fit_note?.trim() || undefined,
    material: textMetadata(product.metadata.material, "PLA"),
    finish: textMetadata(product.metadata.finish, "Visible print layers, finished and checked by hand"),
    care: textMetadata(product.metadata.care, "Wipe clean with a soft, damp cloth and keep away from high heat"),
    leadTime: textMetadata(product.metadata.lead_time, defaultLeadTime),
    designerName: product.metadata.designer_name?.trim() || undefined,
    designerUrl: product.metadata.designer_url?.trim() || undefined,
    sourceModelUrl: product.metadata.source_model_url?.trim() || undefined,
    licenseStatus,
    variants,
    demo: isDemo,
  };
}

export async function getCatalog(visibility: CatalogVisibility = "public"): Promise<CatalogResult> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      products: visibility === "office" ? officeDemoProducts : demoProducts,
      source: "demo",
      checkoutEnabled: false,
    };
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
      .filter((product): product is StoreProduct => product !== null)
      .filter((product) => product.visibility === visibility);

    if (visibility === "office") {
      return { products, source: "stripe", checkoutEnabled: true };
    }

    return products.length
      ? { products, source: "stripe", checkoutEnabled: true }
      : { products: demoProducts, source: "demo", checkoutEnabled: false };
  } catch {
    return {
      products: visibility === "office" ? [] : demoProducts,
      source: "demo",
      checkoutEnabled: false,
    };
  }
}

export async function getCatalogProduct(slug: string) {
  const catalog = await getCatalog();
  return {
    product: catalog.products.find((item) => item.slug === slug) ?? null,
    ...catalog,
  };
}
