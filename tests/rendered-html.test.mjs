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
import {
  confirmedBambuPlaMatteColorGroups,
  confirmedBambuPlaMatteColors,
} from "../app/lib/filament-inventory.ts";

const expectedConfirmedMattePairs = [
  "Ivory White|11100",
  "Lemon Yellow|11400",
  "Mandarin Orange|11300",
  "Sakura Pink|11201",
  "Lilac Purple|11700",
  "Apple Green|11502",
  "Grass Green|11500",
  "Dark Green|11501",
  "Sky Blue|11603",
  "Marine Blue|11600",
  "Dark Blue|11602",
  "Desert Tan|11401",
  "Latte Brown|11800",
  "Caramel|11803",
  "Terracotta|11203",
  "Dark Brown|11801",
  "Ash Gray|11102",
  "Charcoal|11101",
];

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
    [...html.matchAll(/href="(\/products\/[^\/"#?]+)"/g)].map((match) => match[1]),
  );
  assert.equal(homepageProductPaths.size, 6);
  assert.match(html, /More from the shop/);
  assert.match(html, /How each order is made/);
  assert.match(html, /Stocked matte colors/);
  assert.match(html, /18 colors on hand/);
  assert.equal(confirmedBambuPlaMatteColors.length, 18);
  assert.deepEqual(
    confirmedBambuPlaMatteColorGroups.map((group) => group.name),
    ["Neutrals", "Warm tones", "Soft tones", "Greens", "Blues", "Browns"],
  );
  assert.ok(confirmedBambuPlaMatteColorGroups.every((group) => group.colors.length === 3));
  assert.equal(new Set(confirmedBambuPlaMatteColors.map((color) => color.name)).size, 18);
  assert.equal(new Set(confirmedBambuPlaMatteColors.map((color) => color.code)).size, 18);
  assert.deepEqual(
    confirmedBambuPlaMatteColors.map(({ name, code }) => `${name}|${code}`).toSorted(),
    expectedConfirmedMattePairs.toSorted(),
  );
  for (const color of confirmedBambuPlaMatteColors) {
    assert.match(html, new RegExp(`Matte ${color.name}`));
    assert.match(html, new RegExp(`Bambu / ${color.code}`));
  }
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
  assert.match(html, /\/products\/sabredesign\/japandi-paper-towel-holder-01\.webp/);
  assert.match(html, /\/products\/sabredesign\/japandi-tray-01\.webp/);
  assert.match(html, /\/products\/sabredesign\/acorn-container-01\.webp/);
  assert.match(html, /\/products\/sabredesign\/japandi-mushroom-container-01\.webp/);
  assert.match(html, /\/products\/sabredesign\/juno-display-tray-01\.webp/);
  assert.match(html, /\/products\/sabredesign\/sculptural-phone-stand-01\.webp/);
  assert.doesNotMatch(html, /makerworld\.bblmw\.com/);
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
  assert.match(officeHtml, /Ordering unavailable/);
  assert.match(officeHtml, /Recommended with your keychain/);
  assert.match(officeHtml, /choose pickup and add “work pickup”/);
  assert.match(officeHtml, /Sculptural Phone Stand/);
  assert.match(officeHtml, /href="\/products\/sculptural-phone-stand"/);
  assert.match(officeHtml, /Japandi Tray/);
  assert.match(officeHtml, /href="\/products\/japandi-tray"/);
  assert.doesNotMatch(officeHtml, /Acorn Container|Japandi Mushroom Container|Juno Display Tray/);
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
  assert.match(officeClient, /addKeychainToCart/);
  assert.match(officeClient, /addItem\(\{/);
  assert.match(officeClient, /Add \$\{keychainQuantity\} to cart/);
  assert.match(officeClient, /View cart and checkout/);
  assert.match(officeClient, /trackStorefrontEvent\("add_to_cart"/);
  assert.doesNotMatch(officeClient, /fetch\("\/api\/checkout"/);
  assert.match(officeClient, /No confirmation needs to be shown/);
  assert.match(officeClient, /How the honor system works/);
  assert.match(officeClient, /error\?\.slug === keychain\.slug/);
  assert.match(officeClient, /variantForQuantity/);
  assert.match(officeClient, /keychainVariant\.unitAmount \* keychainQuantity/);
  assert.doesNotMatch(officeClient, /Stripe test|test catalog|refreshed for the first launch|Catalog setup/);
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
  assert.match(paperHolderHtml, /\/products\/sabredesign\/japandi-paper-towel-holder-01\.webp/);
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
  assert.match(trayHtml, /\/products\/sabredesign\/japandi-tray-01\.webp/);
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
  assert.match(acornHtml, /\/products\/sabredesign\/acorn-container-01\.webp/);
  assert.match(mushroomHtml, /73 mm tall × 70 mm wide/);
  assert.match(mushroomHtml, /\$20\.00/);
  assert.match(mushroomHtml, /Sandstone/);
  assert.match(mushroomHtml, /Forest/);
  assert.match(mushroomHtml, /Blush/);
  assert.match(mushroomHtml, /Graphite/);
  assert.match(mushroomHtml, /Base: Matte Ash Gray \(11102\)/);
  assert.match(mushroomHtml, /Cap: Matte Sakura Pink \(11201\)/);
  assert.match(mushroomHtml, /\/products\/sabredesign\/japandi-mushroom-container-01\.webp/);
  assert.match(junoHtml, /Solid · 236 mm/);
  assert.match(junoHtml, /\$42\.00/);
  assert.match(junoHtml, /\/products\/sabredesign\/juno-display-tray-01\.webp/);
  assert.match(phoneStandHtml, /MakerWorld does not publish a dimensional spec/);
  assert.match(phoneStandHtml, /Matte Dark Blue \(11602\)/);
  assert.match(phoneStandHtml, /Matte Sakura Pink \(11201\)/);
  assert.match(phoneStandHtml, /Matte Apple Green \(11502\)/);
  assert.match(phoneStandHtml, /\$24\.00/);
  assert.match(phoneStandHtml, /\/products\/sabredesign\/sculptural-phone-stand-01\.webp/);
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

test("motion feedback remains accessible, restrained, and reduced-motion safe", async () => {
  const [styles, shell, gallery, configurator, cart, office, loading, packageSource] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/StoreShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ProductGallery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ProductConfigurator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cart/CartPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/office/OfficePilot.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(shell, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(shell, /added to your cart/);
  assert.match(shell, /Cart quantity updated/);
  assert.match(gallery, /aria-live="polite" aria-atomic="true"/);
  assert.match(gallery, /event\.key === "ArrowLeft"/);
  assert.match(gallery, /event\.key === "ArrowRight"/);
  assert.match(gallery, /ref=\{closeRef\}/);
  assert.match(cart, /aria-busy=\{loadingGroup === "office"\}/);
  assert.match(cart, /aria-busy=\{loadingGroup === "storefront"\}/);
  assert.match(cart, /className="checkout-spinner" aria-hidden="true"/);
  assert.match(office, /<details className="office-rack-details">/);
  assert.match(office, /<summary>How the honor system works<\/summary>/);
  assert.doesNotMatch(configurator, /setTimeout\(\(\) => setAdded\(false\)/);
  assert.doesNotMatch(office, /setTimeout\(\(\) => setAdded\(false\)/);

  assert.match(loading, /role="status" aria-live="polite"/);
  assert.match(styles, /route-loading-in 500ms[^;]+150ms forwards/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(styles, /\.gallery-previous, \.gallery-next \{[^}]*width: 44px; height: 44px/s);
  assert.doesNotMatch(styles, /transition:\s*all\b/);
  assert.doesNotMatch(styles, /outline:\s*(?:none|0)\b/);
  const reducedMotionStart = styles.indexOf("@media (prefers-reduced-motion: reduce)");
  assert.notEqual(reducedMotionStart, -1);
  const reducedMotion = styles.slice(reducedMotionStart);
  assert.match(reducedMotion, /transition: none/);
  assert.match(reducedMotion, /animation: none/);

  const packageJson = JSON.parse(packageSource);
  assert.equal(packageJson.dependencies?.["framer-motion"], undefined);
  assert.equal(packageJson.dependencies?.motion, undefined);
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
  assert.match(checkout, /pickupNote\.length > 160/);
  assert.match(checkout, /metadata\.pickup_note = pickupNote/);
  assert.match(checkout, /body\.fulfillment !== "pickup" \|\| isOfficeCheckout/);
  assert.match(checkout, /Jake will use your pickup note/);
  assert.match(checkout, /parseColorwaysMetadata\(product\.metadata\.colorways\)/);
  assert.match(checkout, /checkLiveCatalogReadiness/);
  assert.match(checkout, /productsTruncated: productsResult\.has_more/);
  assert.match(checkout, /pricesTruncated: pricesResult\.has_more/);
  assert.match(checkout, /checkout_catalog_unavailable/);
  assert.match(checkout, /getValidatedSiteOrigin\(true\)/);
  assert.match(checkout, /selectedColorway/);
  assert.match(checkout, /Base: \$\{selectedColorway\.baseColor\}; Cap: \$\{selectedColorway\.capColor\}/);
  assert.match(cart, /availableItems\.map\(\(\{ priceId, quantity, color \}\)/);
  assert.match(cart, /maxLength=\{160\}/);
  assert.match(cart, /work pickup/);
  assert.match(cart, /pickupNote: pickupNote\.trim\(\)/);
  assert.match(cart, /aria-pressed=\{fulfillment === "shipping"\}/);
  assert.match(cart, /aria-pressed=\{fulfillment === "pickup"\}/);
  assert.match(cart, /disabled=\{!checkoutEnabled \|\| loadingGroup/);
  assert.doesNotMatch(cart, /Stripe test key|test catalog/);
  assert.match(checkout, /const hasActiveLicense = licenseStatus === "active" \|\| licenseStatus === "not_required"/);
  assert.doesNotMatch(shell, /STRIPE_SECRET_KEY/);
  assert.match(stripe, /process\.env\.STRIPE_SECRET_KEY/);
  assert.match(stripe, /STORE_LIVE_MODE/);
});

test("catalog sync is mode-safe, idempotent, and shared by test and live Stripe", async () => {
  const [testSeed, liveSync, sync, manifest] = await Promise.all([
    readFile(new URL("../scripts/seed-stripe-test-catalog.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/sync-stripe-live-catalog.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/stripe-catalog-sync.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/stripe-catalog-manifest.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(testSeed, /requireStripeKey\("test"\)/);
  assert.match(testSeed, /--dry-run/);
  assert.match(testSeed, /auditStripeCatalog/);
  assert.match(testSeed, /Stripe test catalog ready/);
  assert.match(liveSync, /requireStripeKey\("live"\)/);
  assert.match(liveSync, /UPDATE_LIVE_STRIPE_CATALOG/);
  assert.match(liveSync, /--apply/);
  assert.match(liveSync, /strictStorefront: true/);
  assert.match(sync, /\^sk_\(test\|live\)_/);
  assert.match(sync, /metadata\['seed_key'\]/);
  assert.match(sync, /lookup_keys/);
  assert.match(sync, /catalog_version/);
  assert.match(sync, /tax_code: stripeProductTaxCode/);
  assert.match(sync, /tax_behavior: desiredPrice\.taxBehavior/);
  assert.match(sync, /stripe\.products\.update/);
  assert.match(sync, /stripe\.prices\.update/);
  assert.match(sync, /transfer_lookup_key: true/);
  assert.match(sync, /idempotencyKey: syncIdempotencyKey/);
  assert.match(sync, /active: false/);
  assert.match(sync, /retired product remains available/);

  assert.match(manifest, /stripeCatalogVersion = "2026-07-16\.1"/);
  assert.match(manifest, /stripeProductTaxCode = "txcd_99999999"/);
  assert.match(manifest, /jakes-v1-japandi-paper-towel-holder/);
  assert.match(manifest, /JPT-STANDARD/);
  assert.match(manifest, /JPT-XL/);
  assert.match(manifest, /3900/);
  assert.match(manifest, /5200/);
  assert.match(manifest, /jakes-v1-japandi-tray/);
  assert.match(manifest, /jakes-v1-acorn-container/);
  assert.match(manifest, /jakes-v1-japandi-mushroom-container/);
  assert.match(manifest, /jakes-v1-juno-display-tray/);
  assert.match(manifest, /jakes-v1-sculptural-phone-stand/);
  assert.match(manifest, /jakes-office-keychain-rack/);
  assert.match(manifest, /OFFICE-KEYCHAIN-MULTI/);
  assert.match(manifest, /visibility: "office"/);
  assert.match(manifest, /office_fulfillment: "take_now"/);
  assert.match(manifest, /sabredesign_commercial/);
  assert.match(manifest, /\/products\/sabredesign\/japandi-paper-towel-holder-01\.webp/);
  assert.match(manifest, /\/products\/sabredesign\/sculptural-phone-stand-01\.webp/);
  assert.doesNotMatch(manifest, /makerworld\.bblmw\.com/);
  assert.doesNotMatch(manifest, /Meyui|Deltaprints|Pork3D/);
});

test("office checkout remains keychain-only while public commercial previews are server-gated", async () => {
  const [checkout, success, catalog, commercialLicense, cart, shell, cleanup] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/order/success/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/commercial-license.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/cart/CartPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/StoreShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/order/success/PurchasedCartCleanup.tsx", import.meta.url), "utf8"),
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
  assert.match(checkout, /checkoutOrigin\?: "cart"/);
  assert.match(checkout, /body\.checkoutOrigin !== "cart"/);
  assert.match(checkout, /metadata\.checkout_origin = "cart"/);
  assert.match(checkout, /isOfficeCheckout && body\.checkoutOrigin !== "cart"/);
  assert.match(checkout, /isOfficeCheckout\s*\? \{\}\s*:\s*\{\s*phone_number_collection/);
  assert.match(checkout, /shipping_amount = body\.fulfillment === "shipping" \? String\(shippingAmount\) : "0"/);
  assert.match(success, /Payment confirmed—take one available keychain/);
  assert.match(success, /checkoutSessionIdPattern/);
  assert.match(success, /deliver your made-to-order item at work/);
  assert.match(success, /pickupNoteReceived/);
  assert.match(success, /Jake received your pickup note/);
  assert.match(success, /Continue with the rest of your cart/);
  assert.match(success, /PurchasedCartCleanup/);
  assert.match(cleanup, /removeItem\(item\.priceId, item\.color\)/);
  assert.match(cart, /item\.salesChannel === "office_nfc"/);
  assert.match(cart, /Checkout keychain separately/);
  assert.match(cart, /Checkout other items/);
  assert.match(cart, /salesChannel: "office_nfc"/);
  assert.match(cart, /availableItems\.map\(\(\{ priceId, quantity, color \}\)/);
  assert.match(shell, /existing\.salesChannel !== "office_nfc"/);
  assert.match(shell, /office-cart-link/);
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
