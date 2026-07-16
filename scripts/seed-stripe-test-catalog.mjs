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

const sabreDesignPaperTowelHolderImages = [
  "https://makerworld.bblmw.com/makerworld/model/US146adb5b110ef3/design/2025-05-26_70b54048ecf5d.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/US146adb5b110ef3/design/2025-05-26_7f74df85e92d58.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/US146adb5b110ef3/design/2025-07-28_e6001ebef9dd08.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/US146adb5b110ef3/design/2025-07-28_585eb229e7527.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/US146adb5b110ef3/design/2025-05-26_cd78a4106e1168.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/US146adb5b110ef3/design/2025-05-26_b774400af0c55.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/US146adb5b110ef3/design/2025-05-26_db990bd39a9d68.jpg?x-oss-process=image/resize,w_1000/format,webp",
];

const sabreDesignJapandiTrayImages = [
  "https://makerworld.bblmw.com/makerworld/model/USb800abee08578/design/5f0b2aecabdde816.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USb800abee08578/design/0d9c299f571bf36d.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USb800abee08578/design/f24b4344aee013f2.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USb800abee08578/design/3b39b9454a7007ee.jpeg?x-oss-process=image/resize,w_1000/format,webp",
];

const sabreDesignAcornContainerImages = [
  "https://makerworld.bblmw.com/makerworld/model/USf35f084eff6688/design/2025-08-15_55711c8d6c09c8.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USf35f084eff6688/design/2025-08-15_70d11b45e085d.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USf35f084eff6688/design/2025-08-15_2ef6a54331dfe.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USf35f084eff6688/design/2025-08-15_0b995288bf1c.jpg?x-oss-process=image/resize,w_1000/format,webp",
];

const sabreDesignMushroomContainerImages = [
  "https://makerworld.bblmw.com/makerworld/model/USa5c6c988f07bf3/design/2025-09-23_9db44544733358.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USa5c6c988f07bf3/design/2025-09-23_84007e3c39dd6.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USa5c6c988f07bf3/design/2025-09-23_79ea7f3e40bca8.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USa5c6c988f07bf3/design/2025-09-23_b062b82f7d48e8.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USa5c6c988f07bf3/design/2025-09-23_de882f8e783018.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USa5c6c988f07bf3/design/2025-09-23_f852efae91eda8.jpg?x-oss-process=image/resize,w_1000/format,webp",
];

const sabreDesignJunoTrayImages = [
  "https://makerworld.bblmw.com/makerworld/model/USed922762b5dc30/design/34f8fd3120ed287d.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USed922762b5dc30/design/115e440a11cd03e9.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USed922762b5dc30/design/c01ab9049ab21d93.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USed922762b5dc30/design/ea873bd600420ee7.jpg?x-oss-process=image/resize,w_1000/format,webp",
];

const sabreDesignPhoneStandImages = [
  "https://makerworld.bblmw.com/makerworld/model/USedc5387b4b8b54/design/2024-10-20_5e4b3349950a8.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USedc5387b4b8b54/design/2024-10-20_8c5bd4de9b727.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USedc5387b4b8b54/design/2024-10-20_760f27483f53e.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USedc5387b4b8b54/design/2024-10-20_f77932339e686.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USedc5387b4b8b54/design/2024-10-20_5d272154b0d46.jpg?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USedc5387b4b8b54/design/2024-10-20_946792dc6638f.png?x-oss-process=image/resize,w_1000/format,webp",
  "https://makerworld.bblmw.com/makerworld/model/USedc5387b4b8b54/design/2024-10-20_1aaa52c6313dc.png?x-oss-process=image/resize,w_1000/format,webp",
];

const catalog = [
  {
    seedKey: "jakes-v1-japandi-paper-towel-holder",
    name: "Japandi Paper Towel Holder",
    description: "A sculptural countertop holder that keeps a paper towel roll contained while leaving the next sheet easy to reach.",
    images: sabreDesignPaperTowelHolderImages,
    metadata: {
      shop_slug: "japandi-paper-towel-holder",
      category: "Home",
      colors: "Matte Ivory White (11100)|Matte Desert Tan (11401)|Matte Dark Brown (11801)|Matte Charcoal (11101)",
      color_hexes: "#ffffff|#e8dbb7|#7d6556|#000000",
      featured: "true",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      visibility: "public",
      photo_status: "ready",
      accent: "clay",
      detail_copy: "The Japandi holder turns an everyday kitchen roll into a calmer countertop object. Its ribbed outer sleeve adds grip and texture, while the open front keeps the working edge visible and accessible.",
      highlights: "Open front keeps the next sheet within reach|Ribbed sleeve gives the roll a finished silhouette|Standard and jumbo options for different roll sizes|Optional foam feet can add countertop grip",
      fit_note: "Measure your unopened roll at its widest point. Standard Roll fits up to 4.4 in (113 mm); Jumbo / Warehouse Roll fits up to 5.9 in (150 mm).",
      material: "Bambu PLA Matte",
      finish: "Fine vertical ribbing with hand-checked edges and surfaces",
      care: "Wipe with a soft, damp cloth. Do not place in a dishwasher or near sustained heat.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "SabreDesign",
      designer_url: "https://makerworld.com/en/@SabreDesign",
      source_model_url: "https://makerworld.com/en/models/1455387-paper-towel-holder-stand-japandi#profileId-1516726",
      license_provider: "sabredesign_commercial",
      license_status: "active",
    },
    variants: [
      ["Standard Roll", 3900, "JPT-STANDARD", "Fits rolls up to 4.4 in (113 mm) diameter · 7 in tall"],
      ["Jumbo / Warehouse Roll", 5200, "JPT-XL", "Fits rolls up to 5.9 in (150 mm) diameter · 7.6 in tall"],
    ],
  },
  {
    seedKey: "jakes-v1-japandi-tray",
    name: "Japandi Tray",
    description: "A low-profile catchall tray with a soft, sculptural edge for keys, jewelry, and the small things that deserve a calmer landing place.",
    images: sabreDesignJapandiTrayImages,
    metadata: {
      shop_slug: "japandi-tray",
      category: "Home",
      colors: "Matte Desert Tan (11401)|Matte Dark Green (11501)|Matte Ivory White (11100)|Matte Dark Blue (11602)|Matte Sakura Pink (11201)|Matte Charcoal (11101)",
      color_hexes: "#e8dbb7|#68724d|#ffffff|#042f56|#e8afcf|#000000",
      featured: "true",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      visibility: "public",
      photo_status: "ready",
      accent: "clay",
      detail_copy: "The Japandi Tray is a quiet, everyday organizer sized for a console, bedside table, or desk. Its low rim keeps small essentials in one place without making the surface feel busy.",
      highlights: "Maker-listed size: 197 × 123 × 16 mm|Creator profile reference: 1 plate · 2.1 hours|Six selected Bambu PLA Matte color options|Low-profile catchall for small everyday essentials",
      fit_note: "MakerWorld lists this tray at 197 × 123 × 16 mm. The creator's reference profile is one plate and about 2.1 hours.",
      material: "Bambu PLA Matte",
      finish: "Fine matte surface with softly rounded edges",
      care: "Wipe with a soft, damp cloth. Keep away from sustained heat and direct sunlight.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "SabreDesign",
      designer_url: "https://makerworld.com/en/@SabreDesign",
      source_model_url: "https://makerworld.com/en/models/2419531-japandi-tray#profileId-2805325",
      license_provider: "sabredesign_commercial",
      license_status: "active",
    },
    variants: [
      ["197 × 123 mm tray", 2000, "JTR-STANDARD", "197 × 123 × 16 mm"],
    ],
  },
  {
    seedKey: "jakes-v1-acorn-container",
    name: "Acorn Container",
    description: "A sculptural, screw-top storage piece with soft ribs and an unmistakably autumnal silhouette.",
    images: sabreDesignAcornContainerImages,
    metadata: {
      shop_slug: "acorn-container",
      category: "Home",
      colors: "Natural Acorn|Caramel Acorn|Terracotta Acorn|Modern Acorn",
      color_hexes: "#e8dbb7|#ae835b|#b15533|#ffffff",
      colorways: "label=Natural Acorn;base=Matte Desert Tan (11401);base_hex=#e8dbb7;cap=Matte Dark Brown (11801);cap_hex=#7d6556|label=Caramel Acorn;base=Matte Caramel (11803);base_hex=#ae835b;cap=Matte Dark Brown (11801);cap_hex=#7d6556|label=Terracotta Acorn;base=Matte Terracotta (11203);base_hex=#b15533;cap=Matte Dark Brown (11801);cap_hex=#7d6556|label=Modern Acorn;base=Matte Ivory White (11100);base_hex=#ffffff;cap=Matte Charcoal (11101);cap_hex=#000000",
      featured: "false",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      visibility: "public",
      photo_status: "ready",
      accent: "moss",
      detail_copy: "The standing acorn form is a compact lidded object that makes spare keys, jewelry, or a small gift feel deliberately placed rather than tucked away.",
      highlights: "Maker-listed size: 120 mm tall × 80 mm wide|Standing form with a compact screw-top lid|Four curated base-and-cap colorways|No hardware or AMS required",
      fit_note: "The creator recommends the supplied profile for the screw-top fit. Each colorway is made from two separately finished pieces.",
      material: "Bambu PLA Matte",
      finish: "Fine ribbing with a fuzzy-textured screw cap",
      care: "Wipe with a soft, damp cloth. Keep away from sustained heat and direct sunlight.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "SabreDesign",
      designer_url: "https://makerworld.com/en/@SabreDesign",
      source_model_url: "https://makerworld.com/en/models/1701607-acorn-containers#profileId-1804557",
      license_provider: "sabredesign_commercial",
      license_status: "active",
      preview_only: "false",
      pricing_pending: "false",
      preview_message: "",
    },
    variants: [
      ["Standing · 120 mm", 2500, "ACN-STANDING", "120 mm tall × 80 mm wide"],
    ],
  },
  {
    seedKey: "jakes-v1-japandi-mushroom-container",
    name: "Japandi Mushroom Container",
    description: "A small, sculptural mushroom that twists open to keep tiny treasures close at hand.",
    images: sabreDesignMushroomContainerImages,
    metadata: {
      shop_slug: "japandi-mushroom-container",
      category: "Home",
      colors: "Sandstone|Forest|Blush|Graphite",
      color_hexes: "#e8dbb7|#e8dbb7|#ffffff|#9b9ea0",
      colorways: "label=Sandstone;base=Matte Desert Tan (11401);base_hex=#e8dbb7;cap=Matte Ivory White (11100);cap_hex=#ffffff|label=Forest;base=Matte Desert Tan (11401);base_hex=#e8dbb7;cap=Matte Dark Green (11501);cap_hex=#68724d|label=Blush;base=Matte Ivory White (11100);base_hex=#ffffff;cap=Matte Sakura Pink (11201);cap_hex=#e4bdd0|label=Graphite;base=Matte Ash Gray (11102);base_hex=#9b9ea0;cap=Matte Charcoal (11101);cap_hex=#000000",
      featured: "false",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      visibility: "public",
      photo_status: "ready",
      accent: "rose",
      detail_copy: "This compact container brings a little warmth to a nightstand, shelf, or entry table. Its ribbed base and textured cap twist together without any additional hardware.",
      highlights: "Maker-listed size: 73 mm tall × 70 mm wide|Two printed parts with a twist-together lid|Four curated base-and-cap colorways|No hardware or AMS required",
      fit_note: "The twist-together lid is made from two separately finished pieces for each selected colorway.",
      material: "Bambu PLA Matte",
      finish: "Fine ribbing below a soft fuzzy-textured cap",
      care: "Wipe with a soft, damp cloth. Keep away from sustained heat and direct sunlight.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "SabreDesign",
      designer_url: "https://makerworld.com/en/@SabreDesign",
      source_model_url: "https://makerworld.com/en/models/1821679-japandi-mushroom-decoration-container#profileId-1944539",
      license_provider: "sabredesign_commercial",
      license_status: "active",
      preview_only: "false",
      pricing_pending: "false",
      preview_message: "",
    },
    variants: [
      ["73 mm mushroom", 2000, "JMC-STANDARD", "73 mm tall × 70 mm wide"],
    ],
  },
  {
    seedKey: "jakes-v1-juno-display-tray",
    name: "Juno Display Tray",
    description: "A large, architectural tray for giving candles, ceramics, and favorite objects a more intentional place to land.",
    images: sabreDesignJunoTrayImages,
    metadata: {
      shop_slug: "juno-display-tray",
      category: "Home",
      colors: "Matte Charcoal|Matte Ivory White|Matte Desert Tan|Matte Dark Green",
      color_hexes: "#000000|#ffffff|#e8dbb7|#68724d",
      featured: "false",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      visibility: "public",
      photo_status: "ready",
      accent: "graphite",
      detail_copy: "The one-piece solid tray has a wider footprint that makes it a sculptural display surface for a coffee table, console, or shelf rather than another small catchall.",
      highlights: "Maker-listed footprint: 236 mm wide|One-piece solid tray|Creator profile reference: 1 plate · about 8.3 hours|Designed as a display surface rather than a storage container",
      fit_note: "At 236 mm wide, this tray uses nearly the full main print area.",
      material: "Bambu PLA Matte",
      finish: "Fine matte surface with a low, sculptural edge",
      care: "Decorative use only. Wipe with a soft, damp cloth and avoid sustained heat.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "SabreDesign",
      designer_url: "https://makerworld.com/en/@SabreDesign",
      source_model_url: "https://makerworld.com/en/models/2841008-juno-tray#profileId-3167196",
      license_provider: "sabredesign_commercial",
      license_status: "active",
      preview_only: "false",
      pricing_pending: "false",
      preview_message: "",
    },
    variants: [
      ["Solid · 236 mm", 4200, "JUNO-SOLID", "236 mm-wide one-piece tray"],
    ],
  },
  {
    seedKey: "jakes-v1-sculptural-phone-stand",
    name: "Sculptural Phone Stand",
    description: "A weighty, flowing phone stand that keeps a device useful at the desk and handsome when it is empty.",
    images: sabreDesignPhoneStandImages,
    metadata: {
      shop_slug: "sculptural-phone-stand",
      category: "Desk",
      colors: "Matte Ivory White (11100)|Matte Charcoal (11101)|Matte Dark Blue (11602)|Matte Sakura Pink (11201)|Matte Apple Green (11502)",
      color_hexes: "#ffffff|#000000|#042f56|#e4bdd0|#c2e189",
      featured: "false",
      pickup: "true",
      ship: "true",
      stock_status: "made_to_order",
      visibility: "public",
      photo_status: "ready",
      accent: "ocean",
      detail_copy: "This minimal stand gives a phone a stable home while working, cooking, or following along with a video. The original profile uses a heavier build so the stand stays planted while the screen is tapped.",
      highlights: "Original creator profile: 1 plate · about 3.3 hours|Heavier 6-wall build for a more planted feel|Designed for a wide range of phones and thicker cases|Single-color print with no hardware or AMS required",
      fit_note: "MakerWorld does not publish a dimensional spec for this model. It is designed for a wide range of phones and thicker cases.",
      material: "Bambu PLA Matte",
      finish: "Fine matte surface with flowing, minimal contours",
      care: "Wipe with a soft, damp cloth. Keep away from sustained heat and direct sunlight.",
      lead_time: "Printed to order in 3–5 business days",
      designer_name: "SabreDesign",
      designer_url: "https://makerworld.com/en/@SabreDesign",
      source_model_url: "https://makerworld.com/en/models/717070-phone-stand#profileId-647981",
      license_provider: "sabredesign_commercial",
      license_status: "active",
      preview_only: "false",
      pricing_pending: "false",
      preview_message: "",
    },
    variants: [
      ["One size", 2400, "SPS-STANDARD", null],
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
];

const retiredSeedKeys = [
  "jakes-v1-onami-2-headphone-stand",
  "jakes-v1-wave-planter",
  "jakes-v1-articulated-dragon",
  "jakes-v1-controller-dock",
  "jakes-v1-hex-catchall-tray",
  "jakes-v1-book-nook-markers",
  "jakes-v1-cable-combs",
  "jakes-office-modular-desk-organizer",
  "jakes-office-desk-command-center",
  "jakes-office-tray-pencil-cup",
  "jakes-office-ribbed-organizer",
  "jakes-office-gear-phone-stand",
  "jakes-office-everyday-desk-valet",
  "jakes-office-dragon-skin-pencil-holder",
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
      ...(item.images ? { images: item.images } : {}),
    });
    productsUpdated += 1;
  } else {
    product = await stripe.products.create({
      name: item.name,
      description: item.description,
      shippable: item.metadata.ship === "true",
      metadata: productMetadata,
      ...(item.images ? { images: item.images } : {}),
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
      dimensions: dimensions || "",
      min_quantity: minQuantity ? String(minQuantity) : "",
      max_quantity: maxQuantity ? String(maxQuantity) : "",
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
