import Stripe from "stripe";
import {
  catalog,
  retiredSeedKeys,
  stripeCatalogVersion,
  stripeProductTaxCode,
} from "./stripe-catalog-manifest.mjs";

export const stripeApiVersion = "2026-02-25.clover";

const stripeSecretKeyPattern = /^sk_(test|live)_[A-Za-z0-9]{16,}$/;

export function stripeKeyMode(secretKey) {
  const match = secretKey?.trim().match(stripeSecretKeyPattern);
  return match?.[1] === "test" || match?.[1] === "live" ? match[1] : null;
}

export function requireStripeKey(expectedMode) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const actualMode = stripeKeyMode(secretKey);
  if (actualMode !== expectedMode || !secretKey) {
    throw new Error(
      expectedMode === "live"
        ? "A valid sk_live_ Stripe secret key is required. No Stripe resources were changed."
        : "A valid sk_test_ Stripe secret key is required. No live Stripe resources were changed.",
    );
  }
  return secretKey;
}

export function requireHttpsSiteUrl(value = process.env.SITE_URL) {
  let url;
  try {
    url = new URL(value ?? "");
  } catch {
    throw new Error("SITE_URL must be the deployed storefront's absolute HTTPS origin.");
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error("SITE_URL must be the deployed storefront's absolute HTTPS origin.");
  }
  return url.origin;
}

export function createStripeCatalogClient(secretKey) {
  return new Stripe(secretKey, {
    apiVersion: stripeApiVersion,
    appInfo: { name: "Jake's 3D Print Shop catalog sync", version: "1.0.0" },
  });
}

function productIdForPrice(price) {
  return typeof price.product === "string" ? price.product : price.product.id;
}

function defaultPriceId(product) {
  if (!product.default_price) return null;
  return typeof product.default_price === "string"
    ? product.default_price
    : product.default_price.id;
}

function lookupKeyForSku(sku) {
  return `jakes_demo_${String(sku).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function syncIdempotencyKey(resourceType, stableKey) {
  const normalized = `${resourceType}_${stripeCatalogVersion}_${stableKey}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
  return `jakes_catalog_${normalized}`.slice(0, 255);
}

function productPayload(item, siteUrl) {
  const metadata = {
    ...item.metadata,
    storefront: "true",
    demo: "false",
    retired: "false",
    seed_key: item.seedKey,
    catalog_version: stripeCatalogVersion,
    preview_only: item.metadata.preview_only ?? "false",
    pricing_pending: item.metadata.pricing_pending ?? "false",
    preview_message: item.metadata.preview_message ?? "",
  };
  return {
    active: true,
    name: item.name,
    description: item.description,
    shippable: item.metadata.ship === "true",
    tax_code: stripeProductTaxCode,
    metadata,
    ...(item.images
      ? { images: item.images.map((imagePath) => new URL(imagePath, siteUrl).href) }
      : {}),
  };
}

function pricePayload(variant) {
  const [sizeLabel, unitAmount, sku, dimensions, minQuantity, maxQuantity] = variant;
  return {
    sizeLabel,
    unitAmount,
    sku,
    lookupKey: lookupKeyForSku(sku),
    taxBehavior: "exclusive",
    metadata: {
      size_label: sizeLabel,
      variant_key: sku,
      dimensions: dimensions || "",
      min_quantity: minQuantity ? String(minQuantity) : "",
      max_quantity: maxQuantity ? String(maxQuantity) : "",
      catalog_version: stripeCatalogVersion,
    },
  };
}

function metadataMatches(actual, expected) {
  return Object.entries(expected).every(
    ([key, value]) => (actual[key] ?? "") === value,
  );
}

function arraysMatch(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function productMatches(product, payload) {
  return product.active === true &&
    product.name === payload.name &&
    product.description === payload.description &&
    product.shippable === payload.shippable &&
    product.tax_code === payload.tax_code &&
    metadataMatches(product.metadata, payload.metadata) &&
    (payload.images === undefined || arraysMatch(product.images, payload.images));
}

function priceMatches(price, productId, payload) {
  return price.active &&
    productIdForPrice(price) === productId &&
    price.type === "one_time" &&
    price.currency === "usd" &&
    price.unit_amount === payload.unitAmount &&
    price.lookup_key === payload.lookupKey &&
    price.tax_behavior === payload.taxBehavior &&
    price.nickname === payload.sizeLabel &&
    metadataMatches(price.metadata, payload.metadata);
}

async function findSeededProduct(stripe, seedKey) {
  const result = await stripe.products.search({
    query: `metadata['seed_key']:'${seedKey}'`,
    limit: 100,
  });
  if (result.data.length > 1) {
    throw new Error(`Duplicate Stripe products use seed key ${seedKey}. Resolve them before syncing.`);
  }
  return result.data[0] ?? null;
}

async function findLookupPrice(stripe, lookupKey) {
  const result = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 100 });
  if (result.data.length > 1) {
    throw new Error(`Duplicate active Stripe prices use lookup key ${lookupKey}. Resolve them before syncing.`);
  }
  return result.data[0] ?? null;
}

async function listActivePricesForProduct(stripe, productId) {
  const prices = [];
  let startingAfter;
  do {
    const page = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    prices.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return prices;
}

async function listActiveProducts(stripe) {
  const products = [];
  let startingAfter;
  do {
    const page = await stripe.products.list({
      active: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    products.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return products;
}

async function verifyAccountMode(stripe, expectedMode) {
  const account = await stripe.accounts.retrieve();
  if (account.object !== "account") {
    throw new Error("Stripe account verification failed. No Stripe resources were changed.");
  }
  if (stripeKeyMode(process.env.STRIPE_SECRET_KEY) !== expectedMode) {
    throw new Error("The Stripe key mode changed during catalog verification. No Stripe resources were changed.");
  }
}

async function preflightCatalog(stripe, { strictStorefront }) {
  for (const item of catalog) {
    await findSeededProduct(stripe, item.seedKey);
    for (const variant of item.variants) {
      await findLookupPrice(stripe, lookupKeyForSku(variant[2]));
    }
  }

  if (!strictStorefront) return;
  const expectedSeedKeys = new Set(catalog.map((item) => item.seedKey));
  const activeProducts = await listActiveProducts(stripe);
  const unexpected = activeProducts.filter(
    (product) => product.metadata.storefront === "true" &&
      !expectedSeedKeys.has(product.metadata.seed_key),
  );
  if (unexpected.length) {
    throw new Error(
      `The live account has ${unexpected.length} unexpected active storefront product(s). Add their seed keys to the manifest or retire them before syncing.`,
    );
  }
}

export async function auditStripeCatalog(stripe, { siteUrl, strictStorefront }) {
  const issues = [];
  const expectedSeedKeys = new Set(catalog.map((item) => item.seedKey));

  for (const item of catalog) {
    const product = await findSeededProduct(stripe, item.seedKey);
    const desiredProduct = productPayload(item, siteUrl);
    if (!product) {
      issues.push(`${item.metadata.shop_slug}: product missing`);
      continue;
    }
    if (!productMatches(product, desiredProduct)) {
      issues.push(`${item.metadata.shop_slug}: product fields or metadata differ`);
    }

    const expectedPriceIds = [];
    for (const variant of item.variants) {
      const desiredPrice = pricePayload(variant);
      const price = await findLookupPrice(stripe, desiredPrice.lookupKey);
      if (!price) {
        issues.push(`${item.metadata.shop_slug}/${desiredPrice.sku}: price missing`);
        continue;
      }
      expectedPriceIds.push(price.id);
      if (!priceMatches(price, product.id, desiredPrice)) {
        issues.push(`${item.metadata.shop_slug}/${desiredPrice.sku}: price differs`);
      }
    }

    const activePrices = await listActivePricesForProduct(stripe, product.id);
    if (activePrices.some((price) => !expectedPriceIds.includes(price.id))) {
      issues.push(`${item.metadata.shop_slug}: unexpected active price`);
    }
    if (expectedPriceIds[0] && defaultPriceId(product) !== expectedPriceIds[0]) {
      issues.push(`${item.metadata.shop_slug}: default price differs`);
    }
  }

  for (const seedKey of retiredSeedKeys) {
    const product = await findSeededProduct(stripe, seedKey);
    if (product && (product.active || product.metadata.storefront !== "false" || product.metadata.retired !== "true")) {
      issues.push(`${seedKey}: retired product remains available`);
    }
  }

  if (strictStorefront) {
    const activeProducts = await listActiveProducts(stripe);
    const unexpectedCount = activeProducts.filter(
      (product) => product.metadata.storefront === "true" &&
        !expectedSeedKeys.has(product.metadata.seed_key),
    ).length;
    if (unexpectedCount) issues.push(`${unexpectedCount} unexpected active storefront product(s)`);
  }

  return { ready: issues.length === 0, issues };
}

export async function syncStripeCatalog(stripe, { siteUrl, expectedMode, strictStorefront }) {
  await verifyAccountMode(stripe, expectedMode);
  await preflightCatalog(stripe, { strictStorefront });

  const summary = {
    productsCreated: 0,
    productsUpdated: 0,
    productsArchived: 0,
    pricesCreated: 0,
    pricesUpdated: 0,
    pricesReused: 0,
    pricesArchived: 0,
  };

  for (const item of catalog) {
    const desiredProduct = productPayload(item, siteUrl);
    let product = await findSeededProduct(stripe, item.seedKey);

    if (product) {
      if (!productMatches(product, desiredProduct)) {
        product = await stripe.products.update(product.id, desiredProduct);
        summary.productsUpdated += 1;
      }
    } else {
      product = await stripe.products.create(desiredProduct, {
        idempotencyKey: syncIdempotencyKey("product", item.seedKey),
      });
      summary.productsCreated += 1;
    }

    const expectedPriceIds = [];
    for (const variant of item.variants) {
      const desiredPrice = pricePayload(variant);
      let price = await findLookupPrice(stripe, desiredPrice.lookupKey);

      if (
        price &&
        (productIdForPrice(price) !== product.id ||
          price.unit_amount !== desiredPrice.unitAmount ||
          price.currency !== "usd" ||
          price.type !== "one_time" ||
          price.tax_behavior !== desiredPrice.taxBehavior)
      ) {
        price = await stripe.prices.create(
          {
            product: product.id,
            currency: "usd",
            unit_amount: desiredPrice.unitAmount,
            lookup_key: desiredPrice.lookupKey,
            transfer_lookup_key: true,
            tax_behavior: desiredPrice.taxBehavior,
            nickname: desiredPrice.sizeLabel,
            metadata: desiredPrice.metadata,
          },
          { idempotencyKey: syncIdempotencyKey("replacement_price", desiredPrice.sku) },
        );
        summary.pricesCreated += 1;
      } else if (price) {
        if (!priceMatches(price, product.id, desiredPrice)) {
          price = await stripe.prices.update(price.id, {
            nickname: desiredPrice.sizeLabel,
            metadata: desiredPrice.metadata,
          });
          summary.pricesUpdated += 1;
        } else {
          summary.pricesReused += 1;
        }
      } else {
        price = await stripe.prices.create(
          {
            product: product.id,
            currency: "usd",
            unit_amount: desiredPrice.unitAmount,
            lookup_key: desiredPrice.lookupKey,
            tax_behavior: desiredPrice.taxBehavior,
            nickname: desiredPrice.sizeLabel,
            metadata: desiredPrice.metadata,
          },
          { idempotencyKey: syncIdempotencyKey("price", desiredPrice.sku) },
        );
        summary.pricesCreated += 1;
      }
      expectedPriceIds.push(price.id);
    }

    if (expectedPriceIds[0] && defaultPriceId(product) !== expectedPriceIds[0]) {
      product = await stripe.products.update(product.id, { default_price: expectedPriceIds[0] });
      summary.productsUpdated += 1;
    }

    const activePrices = await listActivePricesForProduct(stripe, product.id);
    for (const price of activePrices) {
      if (!expectedPriceIds.includes(price.id)) {
        await stripe.prices.update(price.id, { active: false });
        summary.pricesArchived += 1;
      }
    }
  }

  for (const seedKey of retiredSeedKeys) {
    const product = await findSeededProduct(stripe, seedKey);
    if (!product) continue;
    if (product.active || product.metadata.storefront !== "false" || product.metadata.retired !== "true") {
      await stripe.products.update(product.id, {
        active: false,
        metadata: { storefront: "false", retired: "true" },
      });
      summary.productsArchived += 1;
    }
  }

  return summary;
}

export function formatSyncSummary(label, summary) {
  return `${label}: ${summary.productsCreated} products created, ${summary.productsUpdated} product updates, ${summary.productsArchived} products archived, ${summary.pricesCreated} prices created, ${summary.pricesUpdated} prices updated, ${summary.pricesReused} reused, ${summary.pricesArchived} prices archived.`;
}
