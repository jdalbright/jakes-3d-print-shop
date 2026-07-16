import type Stripe from "stripe";

export const stripeCatalogVersion = "2026-07-16.1";
export const stripeProductTaxCode = "txcd_99999999";

type ExpectedVariant = {
  sku: string;
  unitAmount: number;
  minQuantity?: number;
  maxQuantity?: number;
};

type ExpectedProduct = {
  seedKey: string;
  slug: string;
  visibility: "public" | "office";
  variants: ExpectedVariant[];
};

export const expectedStripeCatalog: readonly ExpectedProduct[] = [
  {
    seedKey: "jakes-v1-japandi-paper-towel-holder",
    slug: "japandi-paper-towel-holder",
    visibility: "public",
    variants: [
      { sku: "JPT-STANDARD", unitAmount: 3900 },
      { sku: "JPT-XL", unitAmount: 5200 },
    ],
  },
  {
    seedKey: "jakes-v1-japandi-tray",
    slug: "japandi-tray",
    visibility: "public",
    variants: [{ sku: "JTR-STANDARD", unitAmount: 2000 }],
  },
  {
    seedKey: "jakes-v1-acorn-container",
    slug: "acorn-container",
    visibility: "public",
    variants: [{ sku: "ACN-STANDING", unitAmount: 2500 }],
  },
  {
    seedKey: "jakes-v1-japandi-mushroom-container",
    slug: "japandi-mushroom-container",
    visibility: "public",
    variants: [{ sku: "JMC-STANDARD", unitAmount: 2000 }],
  },
  {
    seedKey: "jakes-v1-juno-display-tray",
    slug: "juno-display-tray",
    visibility: "public",
    variants: [{ sku: "JUNO-SOLID", unitAmount: 4200 }],
  },
  {
    seedKey: "jakes-v1-sculptural-phone-stand",
    slug: "sculptural-phone-stand",
    visibility: "public",
    variants: [{ sku: "SPS-STANDARD", unitAmount: 2400 }],
  },
  {
    seedKey: "jakes-office-keychain-rack",
    slug: "office-keychain-rack",
    visibility: "office",
    variants: [
      { sku: "OFFICE-KEYCHAIN", unitAmount: 500, minQuantity: 1, maxQuantity: 1 },
      { sku: "OFFICE-KEYCHAIN-MULTI", unitAmount: 400, minQuantity: 2, maxQuantity: 10 },
    ],
  },
] as const;

export type LiveCatalogReadiness = {
  ready: boolean;
  issues: string[];
};

function priceProductId(price: Stripe.Price) {
  return typeof price.product === "string" ? price.product : price.product.id;
}

function defaultPriceId(product: Stripe.Product) {
  if (!product.default_price) return null;
  return typeof product.default_price === "string"
    ? product.default_price
    : product.default_price.id;
}

function quantityMetadataMatches(value: string | undefined, expected: number | undefined) {
  return (value ?? "") === (expected === undefined ? "" : String(expected));
}

function lookupKey(sku: string) {
  return `jakes_demo_${sku.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

export function checkLiveCatalogReadiness({
  products,
  prices,
  productsTruncated = false,
  pricesTruncated = false,
}: {
  products: Stripe.Product[];
  prices: Stripe.Price[];
  productsTruncated?: boolean;
  pricesTruncated?: boolean;
}): LiveCatalogReadiness {
  const issues = new Set<string>();
  if (productsTruncated) issues.add("products_truncated");
  if (pricesTruncated) issues.add("prices_truncated");

  const storefrontProducts = products.filter(
    (product) => product.active && product.metadata.storefront === "true",
  );
  const expectedSeedKeys = new Set(expectedStripeCatalog.map((item) => item.seedKey));

  if (storefrontProducts.length !== expectedStripeCatalog.length) {
    issues.add("storefront_product_count");
  }
  if (storefrontProducts.some((product) => !expectedSeedKeys.has(product.metadata.seed_key))) {
    issues.add("unexpected_storefront_product");
  }

  for (const expected of expectedStripeCatalog) {
    const matches = storefrontProducts.filter(
      (product) => product.metadata.seed_key === expected.seedKey,
    );
    if (matches.length !== 1) {
      issues.add(`${expected.slug}:product_missing_or_duplicate`);
      continue;
    }

    const product = matches[0];
    const expectedLicense = expected.visibility === "office" ? "not_required" : "active";
    const expectedPhotoStatus = expected.visibility === "office" ? "missing" : "ready";
    const expectedStockStatus = expected.visibility === "office" ? "in_stock" : "made_to_order";
    const expectedShip = expected.visibility === "public";
    const metadataReady =
      product.metadata.shop_slug === expected.slug &&
      product.metadata.visibility === expected.visibility &&
      product.metadata.catalog_version === stripeCatalogVersion &&
      product.metadata.demo === "false" &&
      product.metadata.retired === "false" &&
      product.metadata.preview_only === "false" &&
      product.metadata.pricing_pending === "false" &&
      product.metadata.license_status === expectedLicense &&
      product.metadata.photo_status === expectedPhotoStatus &&
      product.metadata.stock_status === expectedStockStatus &&
      product.metadata.pickup === "true" &&
      product.metadata.ship === String(expectedShip) &&
      product.shippable === expectedShip &&
      product.tax_code === stripeProductTaxCode &&
      (expected.visibility === "public" || product.metadata.office_fulfillment === "take_now");
    if (!metadataReady) issues.add(`${expected.slug}:product_metadata`);

    const productPrices = prices.filter(
      (price) => price.active && priceProductId(price) === product.id,
    );
    if (productPrices.length !== expected.variants.length) {
      issues.add(`${expected.slug}:active_price_count`);
    }

    const expectedPriceIds: string[] = [];
    for (const variant of expected.variants) {
      const variantPrices = productPrices.filter(
        (price) => price.metadata.variant_key === variant.sku,
      );
      if (variantPrices.length !== 1) {
        issues.add(`${expected.slug}:${variant.sku}:price_missing_or_duplicate`);
        continue;
      }

      const price = variantPrices[0];
      expectedPriceIds.push(price.id);
      if (
        price.type !== "one_time" ||
        price.currency !== "usd" ||
        price.unit_amount !== variant.unitAmount ||
        price.lookup_key !== lookupKey(variant.sku) ||
        price.tax_behavior !== "exclusive" ||
        price.metadata.catalog_version !== stripeCatalogVersion ||
        !quantityMetadataMatches(price.metadata.min_quantity, variant.minQuantity) ||
        !quantityMetadataMatches(price.metadata.max_quantity, variant.maxQuantity)
      ) {
        issues.add(`${expected.slug}:${variant.sku}:price_configuration`);
      }
    }

    if (expectedPriceIds[0] && defaultPriceId(product) !== expectedPriceIds[0]) {
      issues.add(`${expected.slug}:default_price`);
    }
  }

  return { ready: issues.size === 0, issues: [...issues].sort() };
}
