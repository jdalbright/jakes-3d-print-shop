import Stripe from "stripe";

const apiVersion = "2026-02-25.clover";
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Add STRIPE_SECRET_KEY to .env.local before seeding the test catalog.");
}

if (!secretKey.startsWith("sk_test_")) {
  throw new Error("Catalog seeding is restricted to Stripe test-mode keys. No live resources were changed.");
}

const stripe = new Stripe(secretKey, {
  apiVersion,
  appInfo: { name: "Jake's 3D Print Shop catalog seeder", version: "1.0.0" },
});

const catalog = [
  {
    seedKey: "jakes-v1-onami-2-headphone-stand",
    name: "Onami 2 Headphone Stand",
    description: "A sculptural, wave-inspired stand with a broad curved cradle that keeps over-ear headphones supported and easy to reach.",
    metadata: {
      shop_slug: "onami-2-headphone-stand",
      category: "Desk",
      colors: "Slate Blue|Graphite|Warm Sand",
      color_hexes: "#71839a|#414844|#cdbb97",
      featured: "true",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      accent: "ocean",
      detail_copy: "The Onami 2 turns a functional desktop stand into a calm, wave-like form. Its widened top spreads pressure across the headband, while the open base keeps the footprint light and stable.",
      highlights: "Wide rounded support for over-ear headbands|Continuous wave channels from base to cradle|Stable cantilevered footprint|Optional silicone feet for added grip",
      material: "Matte PLA",
      finish: "Fine visible print layers with hand-checked support surfaces",
      care: "Wipe with a soft, damp cloth. Keep away from sustained heat and direct sunlight.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "Meyui",
      designer_url: "https://makerworld.com/en/@Meyui",
      source_model_url: "https://makerworld.com/en/models/2979027-onami-2-headphone-stand#profileId-3342100",
      license_status: "pending_confirmation",
    },
    variants: [["Standard", 3400, "ONAMI2-STD"]],
  },
];

const retiredSeedKeys = [
  "jakes-v1-wave-planter",
  "jakes-v1-articulated-dragon",
  "jakes-v1-controller-dock",
  "jakes-v1-hex-catchall-tray",
  "jakes-v1-book-nook-markers",
  "jakes-v1-cable-combs",
];

let productsCreated = 0;
let productsUpdated = 0;
let productsArchived = 0;
let pricesCreated = 0;
let pricesReused = 0;

for (const item of catalog) {
  const search = await stripe.products.search({
    query: `metadata['seed_key']:'${item.seedKey}'`,
    limit: 1,
  });
  let product = search.data[0];
  const productMetadata = {
    ...item.metadata,
    storefront: "true",
    demo: "false",
    retired: "false",
    seed_key: item.seedKey,
  };

  if (product) {
    product = await stripe.products.update(product.id, {
      active: true,
      name: item.name,
      description: item.description,
      shippable: true,
      metadata: productMetadata,
    });
    productsUpdated += 1;
  } else {
    product = await stripe.products.create({
      name: item.name,
      description: item.description,
      shippable: true,
      metadata: productMetadata,
    });
    productsCreated += 1;
  }

  let firstPriceId = null;
  for (const [sizeLabel, unitAmount, sku, dimensions] of item.variants) {
    const lookupKey = `jakes_demo_${String(sku).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    let price = existing.data[0];
    const priceMetadata = {
      size_label: sizeLabel,
      variant_key: sku,
      ...(dimensions ? { dimensions } : {}),
    };

    if (price) {
      if (price.product !== product.id || price.unit_amount !== unitAmount || price.currency !== "usd" || price.type !== "one_time") {
        throw new Error(`Existing lookup key ${lookupKey} does not match the catalog. Archive it or choose a new key.`);
      }
      await stripe.prices.update(price.id, {
        nickname: sizeLabel,
        metadata: priceMetadata,
      });
      pricesReused += 1;
    } else {
      price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: unitAmount,
        lookup_key: lookupKey,
        nickname: sizeLabel,
        metadata: priceMetadata,
      });
      pricesCreated += 1;
    }
    firstPriceId ??= price.id;
  }

  if (firstPriceId && product.default_price !== firstPriceId) {
    await stripe.products.update(product.id, { default_price: firstPriceId });
  }
}

for (const seedKey of retiredSeedKeys) {
  const search = await stripe.products.search({
    query: `metadata['seed_key']:'${seedKey}'`,
    limit: 1,
  });
  const product = search.data[0];
  if (!product) continue;

  if (product.active || product.metadata.storefront !== "false" || product.metadata.retired !== "true") {
    await stripe.products.update(product.id, {
      active: false,
      metadata: { storefront: "false", retired: "true" },
    });
    productsArchived += 1;
  }
}

console.log(
  `Stripe test catalog ready: ${productsCreated} products created, ${productsUpdated} updated, ${productsArchived} archived, ${pricesCreated} prices created, ${pricesReused} reused.`,
);
