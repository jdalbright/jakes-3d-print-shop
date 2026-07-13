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
    description: "A wave-inspired headphone stand designed by Meyui, printed and finished in Jake's studio with a broad curved cradle for steady everyday support.",
    metadata: { shop_slug: "onami-2-headphone-stand", category: "Desk", colors: "Deep Ocean|Graphite|Warm Sand", color_hexes: "#1f5681|#414844|#cdbb97", featured: "true", pickup: "true", ship: "true", stock_status: "made_to_order", accent: "ocean", detail_copy: "Designed by Meyui. This private test listing will only be enabled for public sales under an active commercial license. Onami 2 pairs a layered, ocean-wave silhouette with a wider rounded top that distributes pressure across a headphone headband more evenly.", highlights: "Broad rounded headband support|Layered wave-inspired silhouette|Stable desktop footprint|Optional silicone feet", material: "Matte PLA selected for a clean, durable desk finish", finish: "Fine visible print layers with hand-checked support surfaces", care: "Wipe clean with a soft, damp cloth. Keep away from high heat and direct sunlight for extended periods.", lead_time: "Printed to order in 3–5 business days", designer_name: "Meyui", designer_url: "https://makerworld.com/en/@Meyui", source_model_url: "https://makerworld.com/en/models/2979027-onami-2-headphone-stand#profileId-3342100", license_status: "pending_confirmation" },
    variants: [["Standard", 3400, "ONAMI2-STD"]],
  },
  {
    seedKey: "jakes-v1-wave-planter",
    name: "Wave Planter",
    description: "A softly ribbed desktop planter with a watertight liner and a layered finish that catches the light.",
    metadata: { shop_slug: "wave-planter", category: "Home", colors: "Terracotta|Sage|Sand", color_hexes: "#b76649|#879b76|#cdbb97", featured: "true", pickup: "true", ship: "true", stock_status: "made_to_order", accent: "clay", detail_copy: "The rounded ribs soften the planter's silhouette while giving the print a steady grip. A removable liner protects the outer shell and makes watering less fussy.", highlights: "Removable watertight liner|Light-catching ribbed surface|Sized for desks and narrow shelves", material: "Plant-based PLA with a separate watertight liner", finish: "Soft matte surface with visible horizontal layer texture", care: "Remove the liner to water. Wipe the outer shell clean and keep away from high heat.", lead_time: "Printed to order in 3–5 business days" },
    variants: [["Small · 4 in", 1800, "WAVE-S", "4 in diameter × 4 in high"], ["Large · 6 in", 2600, "WAVE-L", "6 in diameter × 6 in high"]],
  },
  {
    seedKey: "jakes-v1-articulated-dragon",
    name: "Articulated Dragon",
    description: "A satisfyingly flexible display piece with print-in-place joints and expressive scale details.",
    metadata: { shop_slug: "articulated-dragon", category: "Play", colors: "Copper|Ocean|Galaxy", color_hexes: "#a86642|#3e7484|#524b73", featured: "true", pickup: "true", ship: "true", stock_status: "in_stock", accent: "ocean", detail_copy: "Every joint prints already connected, so the dragon moves straight off the print bed. The segmented body coils easily without loose pins or assembly hardware.", highlights: "Print-in-place moving joints|No assembly or loose hardware|Flexible display and fidget piece", material: "Durable PLA selected for clean joint movement", finish: "Detailed scales with hand-checked articulation", care: "Move joints gently at first. Keep away from high heat and children under three.", lead_time: "Usually ready in 1–3 business days" },
    variants: [["Mini · 8 in", 1600, "DRGN-MINI", "About 8 × 2.25 × 1.5 in"], ["Full · 16 in", 2800, "DRGN-FULL", "About 16 × 4.5 × 3 in"]],
  },
  {
    seedKey: "jakes-v1-controller-dock",
    name: "Controller Dock",
    description: "A balanced display stand that keeps your controller upright, easy to grab, and off the desk.",
    metadata: { shop_slug: "controller-dock", category: "Desk", colors: "Graphite|Bone|Safety Orange", color_hexes: "#4f5652|#d8d0bf|#df642c", featured: "true", pickup: "true", ship: "true", stock_status: "made_to_order", accent: "graphite", detail_copy: "The angled cradle supports a controller at its strongest points and keeps the charging port clear. A broad footprint resists tipping without taking over the desk.", highlights: "Stable weighted stance|Charging-port clearance|Soft contact points protect the controller", material: "PLA body with non-marking contact pads", finish: "Low-sheen body with clean support surfaces", care: "Wipe clean with a damp cloth. Keep away from direct heat and open flame.", lead_time: "Printed to order in 3–5 business days" },
    variants: [["Standard", 2200, "DOCK-STD", "4.5 × 3.75 × 5.5 in"]],
  },
  {
    seedKey: "jakes-v1-hex-catchall-tray",
    name: "Hex Catchall Tray",
    description: "A modular tray for keys, coins, earbuds, and the small things that otherwise wander across your desk.",
    metadata: { shop_slug: "hex-catchall-tray", category: "Desk", colors: "Moss|Charcoal|Cream", color_hexes: "#748660|#414844|#ded6be", featured: "false", pickup: "true", ship: "true", stock_status: "in_stock", accent: "moss", detail_copy: "The shallow hex profile corrals pocket items without hiding them. Flat sides let several trays sit together in a tidy honeycomb when your setup grows.", highlights: "Modular flat-sided shape|Shallow easy-reach rim|Works alone or in grouped layouts", material: "Plant-based PLA", finish: "Matte base with a fine visible layer pattern", care: "Wipe clean with a soft, damp cloth. Not intended for food contact or high heat.", lead_time: "Usually ready in 1–3 business days" },
    variants: [["Single", 1400, "HEX-1", "6 × 5.25 × 0.75 in"], ["Pair", 2400, "HEX-2", "Two trays, each 6 × 5.25 × 0.75 in"]],
  },
  {
    seedKey: "jakes-v1-book-nook-markers",
    name: "Book Nook Markers",
    description: "A set of sculptural page markers designed to peek over your shelf without bending a favorite book.",
    metadata: { shop_slug: "book-nook-marker-set", category: "Gifts", colors: "Rose|Lavender|Cobalt", color_hexes: "#b96e70|#9b8bb2|#355d9d", featured: "false", pickup: "true", ship: "true", stock_status: "made_to_order", accent: "rose", detail_copy: "Each marker rests lightly between pages while its small sculpted top stays visible above the book. The thin profile marks your place without folding a corner.", highlights: "Slim page-safe profile|Three markers per set|Sculpted tops stay easy to spot", material: "Lightweight PLA", finish: "Smooth face with a crisp sculpted top", care: "Slide out before closing or stacking books tightly. Keep away from high heat.", lead_time: "Printed to order in 3–5 business days" },
    variants: [["Set of 3", 1200, "MARK-3", "About 2.5 × 1.25 in each"]],
  },
  {
    seedKey: "jakes-v1-cable-combs",
    name: "Cable Comb Set",
    description: "Low-profile clips that turn a tangle of charging cables into a clean, repeatable desk setup.",
    metadata: { shop_slug: "cable-comb-set", category: "Desk", colors: "Graphite|Mint|Signal Yellow", color_hexes: "#4f5652|#89b7a6|#d5aa2f", featured: "false", pickup: "true", ship: "true", stock_status: "sold_out", accent: "yellow", detail_copy: "The low-profile channels hold everyday charging cables in parallel so they stay separated and return to the same place after use.", highlights: "Six clips per set|Low-profile desk footprint|Flexible channels for common charging cables", material: "PLA with flex-tuned cable channels", finish: "Smooth top face with rounded cable entries", care: "Press cables in from above rather than pulling them through. Keep away from high heat.", lead_time: "Currently unavailable" },
    variants: [["Set of 6", 1000, "CABLE-6", "About 1.5 × 0.65 × 0.3 in each"]],
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
        throw new Error(`Existing lookup key ${lookupKey} does not match the demo catalog. Archive it or choose a new key.`);
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

console.log(`Stripe test catalog ready: ${productsCreated} products created, ${productsUpdated} updated, ${pricesCreated} prices created, ${pricesReused} reused.`);
