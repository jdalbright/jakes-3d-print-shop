import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildColorHexes, normalizeProductImages, parseColorwaysMetadata, splitMetadata } from "../app/lib/catalog-metadata.ts";
import {
  commercialMetadataOrderReady,
  commercialPrintOrderReady,
  commercialPrintPreviewMessage,
  storefrontProductStatus,
} from "../app/lib/commercial-license.ts";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders a focused homepage with a varied collection and clear ordering details", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Jake’s 3D Print Shop/);
  assert.match(html, /aria-label="Jake&#x27;s 3D Print Shop home"/);
  assert.match(html, /brand-logo__mark/);
  assert.match(html, /3D-printed goods for home and desk/);
  assert.match(html, /Browse all products/);
  assert.match(html, /How orders are made/);
  assert.match(html, /Test shop/);
  const hero = html.match(/<section class="home-hero">([\s\S]*?)<\/section>[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, "homepage should render the collection hero");
  assert.match(hero, /href="\/products"/);
  const heroProductPaths = new Set(
    [...hero.matchAll(/href="(\/products\/[^"#?]+)"/g)].map((match) => match[1]),
  );
  assert.equal(heroProductPaths.size, 3);
  const homepageProductPaths = new Set(
    [...html.matchAll(/href="(\/products\/[^"#?]+)"/g)].map((match) => match[1]),
  );
  assert.equal(homepageProductPaths.size, 6);
  assert.match(html, /More from the shop/);
  assert.match(html, /How each order is made/);
  assert.match(html, /Stocked matte colors/);
  assert.match(html, /Matte Charcoal/);
  assert.match(html, /Pickup in Raleigh or ship across the U\.S\./);
  assert.match(html, /Stripe securely handles card payment/);
  assert.match(html, /\$12\.00/);
  assert.doesNotMatch(html, /Everyday objects, printed with intent|Curated carefully|Printed personally|Made here\. Sent where you are|See what’s on the bench/);
  assert.doesNotMatch(html, /X \/ 256 mm|Y \/ 256 mm|studio-gallery-stamp|home-closing-cta/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("brand logo system is reusable, accessible, and backed by vector assets", async () => {
  const [shell, logo, layout, favicon, colorMark, monoMark, profileSource, profilePng] = await Promise.all([
    readFile(new URL("../app/components/StoreShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/BrandLogo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/favicon.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/logo-mark.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/logo-mark-mono.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/logo-profile.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/logo-profile-512.png", import.meta.url)),
  ]);
  assert.match(shell, /<BrandLogo \/>/);
  assert.doesNotMatch(shell, /brand-mark/);
  assert.match(logo, /variant\?: "full" \| "mark"/);
  assert.match(logo, /tone\?: "default" \| "mono" \| "inverse"/);
  assert.match(logo, /aria-hidden="true"/);
  assert.match(logo, /Jake’s/);
  assert.match(logo, /3D Print Shop/);
  assert.match(layout, /icon: "\/favicon\.svg"/);
  assert.match(layout, /images: \["\/og\.png"\]/);
  for (const asset of [favicon, colorMark, monoMark, profileSource]) {
    assert.match(asset, /<svg/);
    assert.doesNotMatch(asset, /gradient|filter|shadow/i);
  }
  assert.match(colorMark, /#23627b/);
  assert.doesNotMatch(monoMark, /#23627b/);
  assert.deepEqual([...profilePng.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("server-renders the public SabreDesign collection with priced, orderable products", async () => {
  const response = await render("/products");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Modern objects\./);
  assert.match(html, /Japandi Paper Towel Holder/);
  assert.match(html, /Japandi Tray/);
  assert.match(html, /Acorn Container/);
  assert.match(html, /Japandi Mushroom Container/);
  assert.match(html, /Juno Display Tray/);
  assert.match(html, /Sculptural Phone Stand/);
  assert.match(html, /Made to order/);
  assert.match(html, /\$25\.00/);
  assert.match(html, /\$20\.00/);
  assert.match(html, /\$42\.00/);
  assert.match(html, /\$24\.00/);
  assert.doesNotMatch(html, /Preview only/);
  assert.doesNotMatch(html, /Pricing in final testing/);
  assert.match(html, /USf35f084eff6688\/design\/2025-08-15_55711c8d6c09c8\.png/);
  assert.match(html, /USa5c6c988f07bf3\/design\/2025-09-23_9db44544733358\.png/);
  assert.match(html, /USed922762b5dc30\/design\/34f8fd3120ed287d\.png/);
  assert.match(html, /USedc5387b4b8b54\/design\/2024-10-20_5e4b3349950a8\.png/);
  assert.doesNotMatch(html, /Keychain from the Rack/);
  assert.doesNotMatch(html, /Onami 2 Headphone Stand|Meyui/);
  assert.doesNotMatch(html, /Desk Command Center|Tray &amp; Pencil Cup|Ribbed Desk Organizer|Gear Phone Stand|Everyday Desk Valet|Dragon Skin Pencil Holder/);
  assert.doesNotMatch(html, /Wave Planter|Articulated Dragon|Controller Dock|Hex Catchall Tray|Book Nook Markers|Cable Comb Set/);
  assert.match(html, /aria-label="Filter products by category"/);
});

test("office keychain pilot stays unlisted and isolated from the public made-to-order catalog", async () => {
  const [home, office, publicCatalog, officePage, officeClient] = await Promise.all([
    render(),
    render("/office"),
    render("/products"),
    readFile(new URL("../app/office/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/office/OfficePilot.tsx", import.meta.url), "utf8"),
  ]);
  assert.equal(office.status, 200);
  const homeHtml = await home.text();
  const officeHtml = await office.text();
  const publicHtml = await publicCatalog.text();
  assert.match(officeHtml, /Pay \$5\. Take one\./);
  assert.match(officeHtml, /Keychain from the Rack/);
  assert.match(officeHtml, /office-keychain-assortment-illustration-v1\.png/);
  assert.match(officeHtml, /Illustrated assortment/);
  assert.match(officeHtml, /Hand-drawn illustration of assorted keychains/);
  assert.match(officeHtml, /\$5\.00/);
  assert.match(officeHtml, /One for [\s\S]{0,24}\$5\.00/);
  assert.match(officeHtml, /Taking two or more/);
  assert.match(officeHtml, /\$4\.00/);
  assert.match(officeHtml, /Browse the full shop/);
  assert.match(officeHtml, /noindex/);
  assert.doesNotMatch(officeHtml, /Japandi Paper Towel Holder/);
  assert.doesNotMatch(officeHtml, /Onami 2 Headphone Stand|Desk Command Center|Gear Phone Stand/);
  assert.doesNotMatch(homeHtml, /Keychain from the Rack|office-keychain-rack|href="\/office"/);
  assert.doesNotMatch(publicHtml, /Keychain from the Rack/);
  assert.match(publicHtml, /Japandi Paper Towel Holder/);
  assert.doesNotMatch(publicHtml, /Onami 2 Headphone Stand|Desk Command Center|Gear Phone Stand/);
  assert.match(officePage, /robots: \{ index: false, follow: false \}/);
  assert.match(officeClient, /length: 10/);
  assert.match(officeClient, /salesChannel: "office_nfc"/);
  assert.match(officeClient, /No confirmation needs to be shown/);
  assert.match(officeClient, /How the honor system works/);
  assert.match(officeClient, /error\?\.slug === keychain\.slug/);
  assert.match(officeClient, /variantForQuantity/);
  assert.match(officeClient, /keychainVariant\.unitAmount \* keychainQuantity/);
});

test("server-renders all current SabreDesign products as orderable while retiring removed routes", async () => {
  const [paperHolder, tray, acorn, mushroom, juno, phoneStand, retiredProduct, policy] = await Promise.all([
    render("/products/japandi-paper-towel-holder"),
    render("/products/japandi-tray"),
    render("/products/acorn-container"),
    render("/products/japandi-mushroom-container"),
    render("/products/juno-display-tray"),
    render("/products/sculptural-phone-stand"),
    render("/products/onami-2-headphone-stand"),
    render("/policies/shipping"),
  ]);
  assert.equal(paperHolder.status, 200);
  assert.equal(tray.status, 200);
  assert.equal(acorn.status, 200);
  assert.equal(mushroom.status, 200);
  assert.equal(juno.status, 200);
  assert.equal(phoneStand.status, 200);
  assert.equal(retiredProduct.status, 404);
  assert.equal(policy.status, 200);
  const paperHolderHtml = await paperHolder.text();
  const trayHtml = await tray.text();
  const acornHtml = await acorn.text();
  const mushroomHtml = await mushroom.text();
  const junoHtml = await juno.text();
  const phoneStandHtml = await phoneStand.text();
  assert.match(paperHolderHtml, /Japandi Paper Towel Holder/);
  assert.match(paperHolderHtml, /SabreDesign/);
  assert.match(paperHolderHtml, /Standard Roll/);
  assert.match(paperHolderHtml, /Jumbo \/ Warehouse Roll/);
  assert.match(paperHolderHtml, /Fits rolls up to 5\.9 in \(150 mm\) diameter/);
  assert.match(paperHolderHtml, /Measure your unopened roll/);
  assert.match(paperHolderHtml, /\$39\.00/);
  assert.match(paperHolderHtml, /\$52\.00/);
  assert.match(paperHolderHtml, /Matte Ivory White \(11100\)/);
  assert.match(paperHolderHtml, /Matte Dark Brown \(11801\)/);
  assert.match(paperHolderHtml, /Bambu PLA Matte/);
  assert.match(paperHolderHtml, /US146adb5b110ef3\/design\/2025-05-26_db990bd39a9d68\.jpg/);
  assert.match(paperHolderHtml, /Small batch/);
  assert.match(paperHolderHtml, /Add to cart/);
  assert.match(paperHolderHtml, /Printed to order in 3–5 business days/);
  assert.doesNotMatch(paperHolderHtml, /Meyui|Deltaprints|Pork3D/);
  assert.match(trayHtml, /Japandi Tray/);
  assert.match(trayHtml, /Matte Desert Tan \(11401\)/);
  assert.match(trayHtml, /Matte Charcoal \(11101\)/);
  assert.match(trayHtml, /\$20\.00/);
  assert.match(trayHtml, /Add to cart/);
  assert.match(trayHtml, /197 × 123 × 16 mm/);
  assert.match(trayHtml, /1 plate · 2\.1 hours/);
  assert.match(trayHtml, /USb800abee08578\/design\/5f0b2aecabdde816\.png/);
  for (const productHtml of [acornHtml, mushroomHtml, junoHtml, phoneStandHtml]) {
    assert.match(productHtml, /SabreDesign/);
    assert.match(productHtml, /Small batch/);
    assert.match(productHtml, /Add to cart/);
    assert.match(productHtml, /Printed to order in 3–5 business days/);
    assert.doesNotMatch(productHtml, /Preview only|Ordering opens after approval|finalized before ordering opens/);
  }
  assert.match(acornHtml, /Standing · 120 mm/);
  assert.match(acornHtml, /\$25\.00/);
  assert.match(acornHtml, /Colorway/);
  assert.match(acornHtml, /Natural Acorn/);
  assert.match(acornHtml, /Caramel Acorn/);
  assert.match(acornHtml, /Terracotta Acorn/);
  assert.match(acornHtml, /Modern Acorn/);
  assert.match(acornHtml, /Base: Matte Desert Tan \(11401\)/);
  assert.match(acornHtml, /Cap: Matte Dark Brown \(11801\)/);
  assert.match(acornHtml, /Base: Matte Terracotta \(11203\)/);
  assert.match(acornHtml, /Cap: Matte Charcoal \(11101\)/);
  assert.match(acornHtml, /USf35f084eff6688\/design\/2025-08-15_55711c8d6c09c8\.png/);
  assert.match(mushroomHtml, /73 mm tall × 70 mm wide/);
  assert.match(mushroomHtml, /\$20\.00/);
  assert.match(mushroomHtml, /Sandstone/);
  assert.match(mushroomHtml, /Forest/);
  assert.match(mushroomHtml, /Blush/);
  assert.match(mushroomHtml, /Graphite/);
  assert.match(mushroomHtml, /Base: Matte Ash Gray \(11102\)/);
  assert.match(mushroomHtml, /Cap: Matte Sakura Pink \(11201\)/);
  assert.match(mushroomHtml, /USa5c6c988f07bf3\/design\/2025-09-23_9db44544733358\.png/);
  assert.match(junoHtml, /Solid · 236 mm/);
  assert.match(junoHtml, /\$42\.00/);
  assert.match(junoHtml, /USed922762b5dc30\/design\/34f8fd3120ed287d\.png/);
  assert.match(phoneStandHtml, /MakerWorld does not publish a dimensional spec/);
  assert.match(phoneStandHtml, /Matte Dark Blue \(11602\)/);
  assert.match(phoneStandHtml, /Matte Sakura Pink \(11201\)/);
  assert.match(phoneStandHtml, /Matte Apple Green \(11502\)/);
  assert.match(phoneStandHtml, /\$24\.00/);
  assert.match(phoneStandHtml, /USedc5387b4b8b54\/design\/2024-10-20_5e4b3349950a8\.png/);
  assert.match(await policy.text(), /Shipping &amp; pickup/);
});

test("catalog metadata normalizes galleries and swatches safely", () => {
  assert.deepEqual(
    normalizeProductImages([" https://example.com/a.jpg ", "https://example.com/a.jpg", ""], "/fallback.png"),
    ["https://example.com/a.jpg"],
  );
  assert.deepEqual(normalizeProductImages([], "/fallback.png"), ["/fallback.png"]);
  assert.deepEqual(normalizeProductImages([], null), []);
  assert.deepEqual(splitMetadata("One | Two, Three", []), ["One", "Two, Three"]);
  assert.deepEqual(splitMetadata("One, Two,, Three", []), ["One", "Two", "Three"]);
  assert.deepEqual(
    buildColorHexes(["Terracotta", "Unknown", "Ocean"], "#ABCDEF|not-a-hex", "moss"),
    ["#abcdef", "#8b9d78", "#3e7484"],
  );
});

test("colorway metadata preserves paired parts and rejects malformed records", () => {
  const parsed = parseColorwaysMetadata(
    "label=Natural Acorn;base=Matte Desert Tan (11401);base_hex=#E8DBB7;cap=Matte Dark Brown (11801);cap_hex=#7D6556|bad-record|label=Missing cap;base=Matte Ivory White (11100);base_hex=#ffffff",
  );
  assert.deepEqual(parsed, [{
    label: "Natural Acorn",
    baseColor: "Matte Desert Tan (11401)",
    baseHex: "#e8dbb7",
    capColor: "Matte Dark Brown (11801)",
    capHex: "#7d6556",
  }]);
  assert.deepEqual(parseColorwaysMetadata(undefined), []);
});

test("commercial print previews stay unorderable until every required right is active", () => {
  const pendingSabreDesign = {
    requiresCommercialLicense: true,
    licenseStatus: "pending",
    photoReady: false,
    stockStatus: "made_to_order",
  };
  assert.equal(commercialPrintOrderReady(pendingSabreDesign), false);
  assert.match(commercialPrintPreviewMessage(pendingSabreDesign), /commercial licensing/);
  assert.equal(storefrontProductStatus(pendingSabreDesign), "Preview only");
  assert.equal(storefrontProductStatus({
    requiresCommercialLicense: true,
    licenseStatus: "active",
    photoReady: false,
    stockStatus: "made_to_order",
  }), "Preview only");
  assert.equal(storefrontProductStatus({
    requiresCommercialLicense: true,
    licenseStatus: "active",
    photoReady: true,
    stockStatus: "made_to_order",
  }), "Made to order");
  assert.equal(storefrontProductStatus({
    requiresCommercialLicense: true,
    licenseStatus: "active",
    photoReady: true,
    stockStatus: "sold_out",
  }), "Sold out");
  assert.equal(storefrontProductStatus({
    requiresCommercialLicense: false,
    licenseStatus: "not_required",
    photoReady: false,
    stockStatus: "in_stock",
  }), "Ready soon");
  const localDraft = {
    requiresCommercialLicense: true,
    licenseStatus: "active",
    photoReady: true,
    previewOnly: true,
    previewMessage: "Preview only—final X2D production slice and pricing are in progress.",
  };
  assert.equal(commercialPrintOrderReady(localDraft), false);
  assert.match(commercialPrintPreviewMessage(localDraft), /final X2D production slice/);
  assert.equal(
    commercialMetadataOrderReady({
      license_provider: "sabredesign_commercial",
      license_status: "active",
      photo_status: "ready",
    }),
    true,
  );
  assert.equal(
    commercialMetadataOrderReady({
      license_provider: "sabredesign_commercial",
      license_status: "active",
      photo_status: "ready",
      preview_only: "true",
    }),
    false,
  );
});

test("product UI includes accessible gallery and aligned purchase controls", async () => {
  const [gallery, configurator, page, catalogGrid] = await Promise.all([
    readFile(new URL("../app/components/ProductGallery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ProductConfigurator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/products/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CatalogGrid.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(gallery, /<dialog/);
  assert.match(gallery, /showModal/);
  assert.match(gallery, /onClose=.*focus/);
  assert.match(gallery, /aria-current/);
  assert.match(configurator, /product\.colorHexes/);
  assert.match(configurator, /product\.colorways/);
  assert.match(configurator, /colorway-row/);
  assert.match(configurator, /item\.baseHex/);
  assert.match(configurator, /item\.capHex/);
  assert.match(configurator, /colorDetail/);
  assert.match(configurator, /maxQuantity \?\? 10/);
  assert.match(configurator, /previewOnly/);
  assert.match(configurator, /Preview only/);
  assert.match(configurator, /disabled=\{soldOut \|\| previewOnly\}/);
  assert.match(configurator, /variant\.dimensions/);
  assert.match(configurator, /mobile-buy-bar/);
  assert.match(page, /application\/ld\+json/);
  assert.match(page, /commercialPrintOrderReady/);
  assert.match(page, /item\.stockStatus !== "sold_out"/);
  assert.match(page, /item\.colorways\?\.length \? "colorway" : "color"/);
  assert.match(catalogGrid, /storefrontProductStatus/);
  assert.match(catalogGrid, /colorways/);
  assert.match(catalogGrid, /Pricing in final testing/);
  assert.match(configurator, /pricingInFinalTesting/);
});

test("checkout keeps prices authoritative and secrets server-only", async () => {
  const [checkout, stripe, shell, cart] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/stripe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/StoreShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cart/CartPage.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /stripe\.prices\.retrieve/);
  assert.match(checkout, /price\.currency !== "usd"/);
  assert.match(checkout, /price\.type !== "one_time"/);
  assert.match(checkout, /STANDARD_US_SHIPPING_CENTS/);
  assert.match(checkout, /Flat-rate U\.S\. shipping/);
  assert.doesNotMatch(checkout, /subtotal >= 5000/);
  assert.match(checkout, /allowed_countries: \["US"/);
  assert.match(checkout, /fulfillment_method/);
  assert.match(checkout, /parseColorwaysMetadata\(product\.metadata\.colorways\)/);
  assert.match(checkout, /selectedColorway/);
  assert.match(checkout, /Base: \$\{selectedColorway\.baseColor\}; Cap: \$\{selectedColorway\.capColor\}/);
  assert.match(cart, /availableItems\.map\(\(\{ priceId, quantity, color \}\)/);
  assert.match(checkout, /const hasActiveLicense = licenseStatus === "active" \|\| licenseStatus === "not_required"/);
  assert.doesNotMatch(shell, /STRIPE_SECRET_KEY/);
  assert.match(stripe, /process\.env\.STRIPE_SECRET_KEY/);
  assert.match(stripe, /STORE_LIVE_MODE/);
});

test("catalog seeding is test-mode only and idempotent", async () => {
  const seed = await readFile(new URL("../scripts/seed-stripe-test-catalog.mjs", import.meta.url), "utf8");
  assert.match(seed, /startsWith\("sk_test_"\)/);
  assert.match(seed, /metadata\['seed_key'\]/);
  assert.match(seed, /lookup_keys/);
  assert.match(seed, /storefront: "true"/);
  assert.match(seed, /demo: "false"/);
  assert.match(seed, /retiredSeedKeys/);
  assert.match(seed, /jakes-v1-japandi-paper-towel-holder/);
  assert.match(seed, /Matte Dark Brown \(11801\)/);
  assert.match(seed, /colorways:/);
  assert.match(seed, /sabredesign_commercial/);
  assert.match(seed, /sabreDesignPaperTowelHolderImages/);
  assert.match(seed, /sabreDesignJapandiTrayImages/);
  assert.match(seed, /sabreDesignAcornContainerImages/);
  assert.match(seed, /sabreDesignMushroomContainerImages/);
  assert.match(seed, /sabreDesignJunoTrayImages/);
  assert.match(seed, /sabreDesignPhoneStandImages/);
  assert.match(seed, /US146adb5b110ef3\/design\/2025-05-26_70b54048ecf5d\.png/);
  assert.match(seed, /USb800abee08578\/design\/5f0b2aecabdde816\.png/);
  assert.match(seed, /USf35f084eff6688\/design\/2025-08-15_55711c8d6c09c8\.png/);
  assert.match(seed, /USa5c6c988f07bf3\/design\/2025-09-23_9db44544733358\.png/);
  assert.match(seed, /USed922762b5dc30\/design\/34f8fd3120ed287d\.png/);
  assert.match(seed, /USedc5387b4b8b54\/design\/2024-10-20_5e4b3349950a8\.png/);
  assert.match(seed, /\.\.\.\(item\.images \? \{ images: item\.images \} : \{\}\)/);
  assert.match(seed, /photo_status: "ready"/);
  assert.match(seed, /license_status: "active"/);
  assert.match(seed, /JPT-STANDARD/);
  assert.match(seed, /JPT-XL/);
  assert.match(seed, /3900/);
  assert.match(seed, /5200/);
  assert.match(seed, /jakes-v1-japandi-tray/);
  assert.match(seed, /JTR-STANDARD/);
  assert.match(seed, /2000/);
  assert.match(seed, /jakes-v1-acorn-container/);
  assert.match(seed, /Natural Acorn\|Caramel Acorn\|Terracotta Acorn\|Modern Acorn/);
  assert.match(seed, /Matte Caramel \(11803\)/);
  assert.match(seed, /Matte Terracotta \(11203\)/);
  assert.match(seed, /ACN-STANDING/);
  assert.match(seed, /2500/);
  assert.match(seed, /jakes-v1-japandi-mushroom-container/);
  assert.match(seed, /Sandstone\|Forest\|Blush\|Graphite/);
  assert.match(seed, /Matte Ash Gray \(11102\)/);
  assert.match(seed, /JMC-STANDARD/);
  assert.match(seed, /jakes-v1-juno-display-tray/);
  assert.match(seed, /JUNO-SOLID/);
  assert.match(seed, /4200/);
  assert.match(seed, /jakes-v1-sculptural-phone-stand/);
  assert.match(seed, /Matte Apple Green \(11502\)/);
  assert.match(seed, /SPS-STANDARD/);
  assert.match(seed, /2400/);
  assert.match(seed, /preview_only: "false"/);
  assert.match(seed, /preview_message: ""/);
  assert.match(seed, /pricing_pending: "false"/);
  assert.match(seed, /jakes-office-keychain-rack/);
  assert.match(seed, /jakes-v1-onami-2-headphone-stand/);
  assert.match(seed, /jakes-office-desk-command-center/);
  assert.match(seed, /jakes-office-tray-pencil-cup/);
  assert.match(seed, /jakes-office-ribbed-organizer/);
  assert.match(seed, /jakes-office-gear-phone-stand/);
  assert.match(seed, /jakes-office-everyday-desk-valet/);
  assert.match(seed, /jakes-office-dragon-skin-pencil-holder/);
  assert.match(seed, /jakes-office-modular-desk-organizer/);
  assert.match(seed, /OFFICE-KEYCHAIN/);
  assert.match(seed, /OFFICE-KEYCHAIN-MULTI/);
  assert.match(seed, /400/);
  assert.match(seed, /min_quantity: minQuantity \? String\(minQuantity\) : ""/);
  assert.match(seed, /max_quantity: maxQuantity \? String\(maxQuantity\) : ""/);
  assert.doesNotMatch(seed, /OFFICE-MEYUI-DESK-SET/);
  assert.doesNotMatch(seed, /OFFICE-DESK-COMMAND-CENTER|OFFICE-GEAR-PHONE-STAND/);
  assert.doesNotMatch(seed, /Meyui|Deltaprints|Pork3D/);
  assert.match(seed, /visibility: "office"/);
  assert.match(seed, /office_fulfillment: "take_now"/);
  assert.doesNotMatch(seed, /office_fulfillment: "work_delivery"/);
  assert.match(seed, /ship: "true"/);
  assert.match(seed, /photo_status: "missing"/);
  assert.match(seed, /active: false/);
  assert.match(seed, /color_hexes/);
  assert.match(seed, /detail_copy/);
  assert.match(seed, /dimensions/);
  assert.match(seed, /stripe\.prices\.update/);
  assert.match(seed, /transfer_lookup_key: true/);
  assert.match(seed, /Stripe test catalog ready/);
});

test("office checkout remains keychain-only while public commercial previews are server-gated", async () => {
  const [checkout, success, catalog, commercialLicense] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/order/success/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/commercial-license.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /salesChannel\?: "office_nfc"/);
  assert.match(checkout, /body\.items\.length !== 1/);
  assert.match(checkout, /price\.metadata\.min_quantity/);
  assert.match(checkout, /price\.metadata\.max_quantity/);
  assert.match(checkout, /invalid_quantity_tier/);
  assert.match(checkout, /visibility !== "office"/);
  assert.match(checkout, /visibility === "office"/);
  assert.match(checkout, /office_fulfillment/);
  assert.match(checkout, /commercialMetadataOrderReady\(product\.metadata\)/);
  assert.match(checkout, /preview_only/);
  assert.match(checkout, /cancelPath = isOfficeCheckout \? "\/office\?checkout=canceled"/);
  assert.match(checkout, /isOfficeCheckout\s*\? \{\}\s*:\s*\{\s*phone_number_collection/);
  assert.match(checkout, /shipping_amount = body\.fulfillment === "shipping" \? String\(shippingAmount\) : "0"/);
  assert.match(success, /Payment confirmed—take one available keychain/);
  assert.match(success, /deliver your made-to-order item at work/);
  assert.match(catalog, /getCatalog\(visibility: CatalogVisibility = "public"\)/);
  assert.match(catalog, /visibility === "office" \? officeDemoProducts : demoProducts/);
  assert.doesNotMatch(commercialLicense, /authorized_seller_badge/);
  assert.match(commercialLicense, /photo_status === "ready"/);
});

test("storefront analytics records conversion steps without customer data", async () => {
  const [events, configurator, cart] = await Promise.all([
    readFile(new URL("../app/api/store-events/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ProductConfigurator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cart/CartPage.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(events, /storefront_event/);
  assert.match(events, /product_view/);
  assert.match(events, /checkout_redirect/);
  assert.match(events, /office_page_view/);
  assert.match(events, /office_product_select/);
  assert.match(events, /salesChannel/);
  assert.doesNotMatch(events, /email|phone|address|customer/i);
  assert.match(configurator, /trackStorefrontEvent\("product_view"/);
  assert.match(configurator, /trackStorefrontEvent\("add_to_cart"/);
  assert.match(cart, /trackStorefrontEvent\("checkout_start"/);
  assert.match(cart, /trackStorefrontEvent\("checkout_redirect"/);
});

test("webhook verifies the raw Stripe signature and handles checkout outcomes", async () => {
  const webhook = await readFile(new URL("../app/api/stripe/webhook/route.ts", import.meta.url), "utf8");
  assert.match(webhook, /process\.env\.STRIPE_WEBHOOK_SECRET/);
  assert.match(webhook, /request\.text\(\)/);
  assert.match(webhook, /request\.headers\.get\("stripe-signature"\)/);
  assert.match(webhook, /constructEventAsync/);
  assert.match(webhook, /Stripe\.createSubtleCryptoProvider\(\)/);
  assert.match(webhook, /checkout\.session\.completed/);
  assert.match(webhook, /checkout\.session\.async_payment_succeeded/);
  assert.match(webhook, /checkout\.session\.async_payment_failed/);
  assert.doesNotMatch(webhook, /customer_details|shipping_details/);
});
