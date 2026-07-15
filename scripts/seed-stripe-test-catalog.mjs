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
      detail_copy: "The Onami 2 turns a functional desktop stand into a calm, wave-like form. Its widened top spreads pressure across the headband, while the open base keeps the footprint visually light.",
      highlights: "Wide rounded support for over-ear headbands|Continuous wave channels from base to cradle|Compact cantilevered footprint|Optional silicone feet for added grip",
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
  {
    seedKey: "jakes-v1-japandi-paper-towel-holder",
    name: "Japandi Paper Towel Holder",
    description: "A sculptural countertop holder that keeps a paper towel roll contained while leaving the next sheet easy to reach.",
    metadata: {
      shop_slug: "japandi-paper-towel-holder",
      category: "Home",
      colors: "Warm Sand|Cocoa|Matte White",
      color_hexes: "#cbb89d|#705546|#ece8df",
      featured: "true",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      accent: "clay",
      detail_copy: "The Japandi holder turns an everyday kitchen roll into a calmer countertop object. Its ribbed outer sleeve adds grip and texture, while the open front keeps the working edge visible and accessible.",
      highlights: "Open front keeps the next sheet within reach|Ribbed sleeve gives the roll a finished silhouette|Standard and jumbo options for different roll sizes|Optional foam feet can add countertop grip",
      fit_note: "Measure your unopened roll at its widest point. Standard Roll fits up to 4.4 in (113 mm); Jumbo / Warehouse Roll fits up to 5.9 in (150 mm).",
      material: "Matte PLA",
      finish: "Fine vertical ribbing with hand-checked edges and surfaces",
      care: "Wipe with a soft, damp cloth. Do not place in a dishwasher or near sustained heat.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "SabreDesign",
      designer_url: "https://makerworld.com/en/@SabreDesign",
      source_model_url: "https://makerworld.com/en/models/1455387-paper-towel-holder-stand-japandi#profileId-1516726",
      license_status: "pending_confirmation",
    },
    variants: [
      ["Standard Roll", 3900, "JPT-STANDARD", "Fits rolls up to 4.4 in (113 mm) diameter · 7 in tall"],
      ["Jumbo / Warehouse Roll", 5200, "JPT-XL", "Fits rolls up to 5.9 in (150 mm) diameter · 7.6 in tall"],
    ],
  },
  {
    seedKey: "jakes-office-keychain-rack",
    name: "Keychain from the Rack",
    description: "Pay online, then take any one keychain that is physically available on the office rack.",
    metadata: {
      shop_slug: "office-keychain-rack",
      category: "Office rack",
      colors: "Any available",
      color_hexes: "#e5bd4d",
      featured: "false",
      pickup: "true",
      ship: "false",
      stock_status: "in_stock",
      visibility: "office",
      office_fulfillment: "take_now",
      photo_status: "missing",
      accent: "yellow",
      detail_copy: "Choose from what is physically available, pay online, and take it with you. No confirmation screen needs to be shown.",
      highlights: "Any physically available rack design|Immediate honor-system pickup|Designed and printed by Jake",
      material: "PLA",
      finish: "Small-batch print, checked before it reaches the rack",
      care: "Keep away from sustained heat.",
      lead_time: "Available immediately while rack stock lasts",
      license_status: "not_required",
    },
    variants: [
      ["One keychain", 500, "OFFICE-KEYCHAIN", null, 1, 1],
      ["Two or more keychains", 400, "OFFICE-KEYCHAIN-MULTI", null, 2, 10],
    ],
  },
  {
    seedKey: "jakes-office-modular-desk-organizer",
    name: "Modular Desk Organizer Set",
    description: "A coordinated four-piece system with a phone stand, pen holder, storage cup, and base tray.",
    metadata: {
      shop_slug: "modular-desk-organizer-set",
      category: "Desk",
      colors: "Matte Bone White|Matte Charcoal|Matte Dark Green",
      color_hexes: "#cbc6b8|#000000|#68724d",
      featured: "false",
      pickup: "true",
      ship: "false",
      stock_status: "made_to_order",
      visibility: "office",
      office_fulfillment: "work_delivery",
      photo_status: "missing",
      accent: "moss",
      detail_copy: "Four calm, functional pieces can be arranged to fit a compact desk while keeping a phone, pens, and small essentials within reach.",
      highlights: "Classic phone stand|Dedicated pen holder|Storage cup for small essentials|Base tray keeps the set together",
      material: "Bambu PLA Matte",
      finish: "Matte surface with hand-checked edges and fit",
      care: "Wipe with a soft, damp cloth. Keep away from sustained heat and direct sunlight.",
      lead_time: "Printed to order and delivered at work in 3–5 business days",
      designer_name: "Meyui",
      designer_url: "https://makerworld.com/en/@Meyui",
      source_model_url: "https://makerworld.com/en/models/2087519-modular-desk-organizer-system-iphone-stand-module#profileId-2256937",
      license_status: "pending",
    },
    variants: [["Complete four-piece set", 3000, "OFFICE-MEYUI-DESK-SET"]],
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
let pricesArchived = 0;

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
      shippable: item.metadata.ship === "true",
      metadata: productMetadata,
    });
    productsUpdated += 1;
  } else {
    product = await stripe.products.create({
      name: item.name,
      description: item.description,
      shippable: item.metadata.ship === "true",
      metadata: productMetadata,
    });
    productsCreated += 1;
  }

  let firstPriceId = null;
  const pricesToArchive = [];
  for (const [sizeLabel, unitAmount, sku, dimensions, minQuantity, maxQuantity] of item.variants) {
    const lookupKey = `jakes_demo_${String(sku).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    let price = existing.data[0];
    const priceMetadata = {
      size_label: sizeLabel,
      variant_key: sku,
      ...(dimensions ? { dimensions } : {}),
      ...(minQuantity ? { min_quantity: String(minQuantity) } : {}),
      ...(maxQuantity ? { max_quantity: String(maxQuantity) } : {}),
    };

    if (price) {
      if (price.product !== product.id || price.unit_amount !== unitAmount || price.currency !== "usd" || price.type !== "one_time") {
        const previousPrice = price;
        price = await stripe.prices.create({
          product: product.id,
          currency: "usd",
          unit_amount: unitAmount,
          lookup_key: lookupKey,
          transfer_lookup_key: true,
          nickname: sizeLabel,
          metadata: priceMetadata,
        });
        pricesToArchive.push(previousPrice.id);
        pricesCreated += 1;
      } else {
        await stripe.prices.update(price.id, {
          nickname: sizeLabel,
          metadata: priceMetadata,
        });
        pricesReused += 1;
      }
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
  for (const priceId of pricesToArchive) {
    await stripe.prices.update(priceId, { active: false });
    pricesArchived += 1;
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
  `Stripe test catalog ready: ${productsCreated} products created, ${productsUpdated} updated, ${productsArchived} products archived, ${pricesCreated} prices created, ${pricesReused} reused, ${pricesArchived} prices archived.`,
);
