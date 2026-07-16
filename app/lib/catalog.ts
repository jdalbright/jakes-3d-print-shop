import "server-only";
import { cache } from "react";
import type Stripe from "stripe";
import { buildColorHexes, normalizeProductImages, parseColorwaysMetadata, splitMetadata, textMetadata } from "./catalog-metadata";
import { catalogPreviewProducts } from "./catalog-preview-products";
import { checkLiveCatalogReadiness } from "./catalog-readiness";
import { demoProducts, officeDemoProducts } from "./demo-catalog";
import {
  sabreDesignAcornContainerImages,
  sabreDesignJapandiTrayImages,
  sabreDesignJunoTrayImages,
  sabreDesignMushroomContainerImages,
  sabreDesignPaperTowelHolderImages,
  sabreDesignPhoneStandImages,
} from "./sabredesign-media";
import { getStripe, getStripeRuntimeConfiguration } from "./stripe";
import type { CatalogResult, CatalogVisibility, OfficeFulfillment, ProductColorway, ProductLicenseStatus, StoreProduct } from "./types";

const accents = ["clay", "ocean", "graphite", "moss", "rose", "yellow"];
const localProductImages: Record<string, string[]> = {
  "office-keychain-rack": [
    "/products/office-keychain-assortment-illustration-v1.png",
  ],
  "japandi-paper-towel-holder": [
    ...sabreDesignPaperTowelHolderImages,
  ],
  "japandi-tray": [
    ...sabreDesignJapandiTrayImages,
  ],
  "acorn-container": [
    ...sabreDesignAcornContainerImages,
  ],
  "japandi-mushroom-container": [
    ...sabreDesignMushroomContainerImages,
  ],
  "juno-display-tray": [
    ...sabreDesignJunoTrayImages,
  ],
  "sculptural-phone-stand": [
    ...sabreDesignPhoneStandImages,
  ],
};

function withCatalogPreviews(products: StoreProduct[], visibility: CatalogVisibility) {
  if (visibility !== "public") return products;
  const existingSlugs = new Set(products.map((product) => product.slug));
  return [...products, ...catalogPreviewProducts.filter((product) => !existingSlugs.has(product.slug))];
}

function boolMetadata(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function quantityMetadata(value: string | undefined) {
  if (!value) return undefined;
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 10 ? quantity : undefined;
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
      minQuantity: quantityMetadata(price.metadata.min_quantity),
      maxQuantity: quantityMetadata(price.metadata.max_quantity),
    }))
    .sort((a, b) => (a.minQuantity ?? 1) - (b.minQuantity ?? 1) || a.unitAmount - b.unitAmount);

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
  const parsedColorways = parseColorwaysMetadata(product.metadata.colorways);
  const colorways = colors
    .map((color) => parsedColorways.find((item) => item.label.toLowerCase() === color.toLowerCase()))
    .filter((item): item is ProductColorway => Boolean(item));
  const fallbackImages = localProductImages[slug] || [];
  const stripeImages = normalizeProductImages(product.images, null);
  const images = fallbackImages.length ? fallbackImages : stripeImages;
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
    colorways: colorways.length === colors.length ? colorways : undefined,
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
    requiresCommercialLicense: Boolean(product.metadata.license_provider),
    licenseStatus,
    previewOnly: product.metadata.preview_only === "true",
    pricingPending: product.metadata.pricing_pending === "true",
    previewMessage: product.metadata.preview_message?.trim() || undefined,
    variants,
    demo: isDemo,
  };
}

const loadCatalog = cache(async (visibility: CatalogVisibility): Promise<CatalogResult> => {
  const stripeConfiguration = getStripeRuntimeConfiguration();
  const stripe = getStripe();
  if (!stripe) {
    if (stripeConfiguration.liveModeRequested) {
      console.error("live_catalog_unavailable", { reason: "stripe_configuration" });
      return { products: [], source: "stripe", checkoutEnabled: false };
    }
    return {
      products: withCatalogPreviews(visibility === "office" ? officeDemoProducts : demoProducts, visibility),
      source: "demo",
      checkoutEnabled: false,
    };
  }

  try {
    const [productsResult, pricesResult] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
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

    if (stripeConfiguration.liveLaunchEnabled) {
      const readiness = checkLiveCatalogReadiness({
        products: productsResult.data,
        prices: pricesResult.data,
        productsTruncated: productsResult.has_more,
        pricesTruncated: pricesResult.has_more,
      });
      if (!readiness.ready) {
        console.error("live_catalog_unavailable", { reason: "catalog_incomplete", issues: readiness.issues });
        return { products: [], source: "stripe", checkoutEnabled: false };
      }
      return { products, source: "stripe", checkoutEnabled: true };
    }

    if (visibility === "office") {
      return { products, source: "stripe", checkoutEnabled: true };
    }

    const productsWithPreviews = withCatalogPreviews(products, visibility);
    return productsWithPreviews.length
      ? { products: productsWithPreviews, source: "stripe", checkoutEnabled: true }
      : { products: withCatalogPreviews(demoProducts, visibility), source: "demo", checkoutEnabled: false };
  } catch {
    if (stripeConfiguration.liveModeRequested) {
      console.error("live_catalog_unavailable", { reason: "stripe_request" });
      return { products: [], source: "stripe", checkoutEnabled: false };
    }
    return {
      products: withCatalogPreviews(visibility === "office" ? [] : demoProducts, visibility),
      source: "demo",
      checkoutEnabled: false,
    };
  }
});

export async function getCatalog(visibility: CatalogVisibility = "public"): Promise<CatalogResult> {
  return loadCatalog(visibility);
}

export async function getCatalogProduct(slug: string) {
  const catalog = await getCatalog();
  return {
    product: catalog.products.find((item) => item.slug === slug) ?? null,
    ...catalog,
  };
}
