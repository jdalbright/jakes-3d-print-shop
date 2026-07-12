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
    seedKey: "jakes-v1-wave-planter",
    name: "Wave Planter",
    description: "A softly ribbed desktop planter with a watertight liner and a layered finish that catches the light.",
    metadata: { shop_slug: "wave-planter", category: "Home", colors: "Terracotta|Sage|Sand", featured: "true", pickup: "true", ship: "true", stock_status: "made_to_order", accent: "clay" },
    variants: [["Small · 4 in", 1800, "WAVE-S"], ["Large · 6 in", 2600, "WAVE-L"]],
  },
  {
    seedKey: "jakes-v1-articulated-dragon",
    name: "Articulated Dragon",
    description: "A satisfyingly flexible display piece with print-in-place joints and expressive scale details.",
    metadata: { shop_slug: "articulated-dragon", category: "Play", colors: "Copper|Ocean|Galaxy", featured: "true", pickup: "true", ship: "true", stock_status: "in_stock", accent: "ocean" },
    variants: [["Mini · 8 in", 1600, "DRGN-MINI"], ["Full · 16 in", 2800, "DRGN-FULL"]],
  },
  {
    seedKey: "jakes-v1-controller-dock",
    name: "Controller Dock",
    description: "A balanced display stand that keeps your controller upright, easy to grab, and off the desk.",
    metadata: { shop_slug: "controller-dock", category: "Desk", colors: "Graphite|Bone|Safety Orange", featured: "true", pickup: "true", ship: "true", stock_status: "made_to_order", accent: "graphite" },
    variants: [["Standard", 2200, "DOCK-STD"]],
  },
  {
    seedKey: "jakes-v1-hex-catchall-tray",
    name: "Hex Catchall Tray",
    description: "A modular tray for keys, coins, earbuds, and the small things that otherwise wander across your desk.",
    metadata: { shop_slug: "hex-catchall-tray", category: "Desk", colors: "Moss|Charcoal|Cream", featured: "false", pickup: "true", ship: "true", stock_status: "in_stock", accent: "moss" },
    variants: [["Single", 1400, "HEX-1"], ["Pair", 2400, "HEX-2"]],
  },
  {
    seedKey: "jakes-v1-book-nook-markers",
    name: "Book Nook Markers",
    description: "A set of sculptural page markers designed to peek over your shelf without bending a favorite book.",
    metadata: { shop_slug: "book-nook-marker-set", category: "Gifts", colors: "Rose|Lavender|Cobalt", featured: "false", pickup: "true", ship: "true", stock_status: "made_to_order", accent: "rose" },
    variants: [["Set of 3", 1200, "MARK-3"]],
  },
  {
    seedKey: "jakes-v1-cable-combs",
    name: "Cable Comb Set",
    description: "Low-profile clips that turn a tangle of charging cables into a clean, repeatable desk setup.",
    metadata: { shop_slug: "cable-comb-set", category: "Desk", colors: "Graphite|Mint|Signal Yellow", featured: "false", pickup: "true", ship: "true", stock_status: "sold_out", accent: "yellow" },
    variants: [["Set of 6", 1000, "CABLE-6"]],
  },
];

let productsCreated = 0;
let productsUpdated = 0;
let pricesCreated = 0;
let pricesReused = 0;

for (const item of catalog) {
  const search = await stripe.products.search({
    query: `metadata['seed_key']:'${item.seedKey}'`,
    limit: 1,
  });
  let product = search.data[0];
  const productMetadata = { ...item.metadata, storefront: "true", demo: "true", seed_key: item.seedKey };

  if (product) {
    product = await stripe.products.update(product.id, {
      active: true,
      name: item.name,
      description: item.description,
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
  for (const [sizeLabel, unitAmount, sku] of item.variants) {
    const lookupKey = `jakes_demo_${String(sku).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    let price = existing.data[0];

    if (price) {
      if (price.product !== product.id || price.unit_amount !== unitAmount || price.currency !== "usd" || price.type !== "one_time") {
        throw new Error(`Existing lookup key ${lookupKey} does not match the demo catalog. Archive it or choose a new key.`);
      }
      pricesReused += 1;
    } else {
      price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: unitAmount,
        lookup_key: lookupKey,
        nickname: sizeLabel,
        metadata: { size_label: sizeLabel, variant_key: sku },
      });
      pricesCreated += 1;
    }
    firstPriceId ??= price.id;
  }

  if (firstPriceId && product.default_price !== firstPriceId) {
    await stripe.products.update(product.id, { default_price: firstPriceId });
  }
}

console.log(`Stripe test catalog ready: ${productsCreated} products created, ${productsUpdated} updated, ${pricesCreated} prices created, ${pricesReused} reused.`);
