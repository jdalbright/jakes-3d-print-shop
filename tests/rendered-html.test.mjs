import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildColorHexes, normalizeProductImages, splitMetadata } from "../app/lib/catalog-metadata.ts";

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

test("server-renders the current storefront without retired demo products", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Jake’s 3D Print Shop/);
  assert.match(html, /aria-label="Jake&#x27;s 3D Print Shop home"/);
  assert.match(html, /brand-logo__mark/);
  assert.match(html, /A cleaner desk/);
  assert.match(html, /Test shop/);
  assert.match(html, /Onami 2 Headphone Stand/);
  assert.match(html, /Japandi Paper Towel Holder/);
  assert.match(html, /Fresh off the bench/);
  assert.match(html, /View all products/);
  assert.match(html, /onami-2-headphone-stand-hero-v3\.png/);
  assert.match(html, /japandi-paper-towel-holder-hero-v1\.png/);
  assert.match(html, /Raleigh pickup/);
  assert.match(html, /\$12\.00/);
  assert.match(html, /flat rate/);
  assert.doesNotMatch(html, /Wave Planter|Articulated Dragon|Controller Dock|Hex Catchall Tray|Book Nook Markers|Cable Comb Set/);
  assert.doesNotMatch(html, /Studio favorites|Room for a good idea|Good ideas/);
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
  for (const asset of [favicon, colorMark, monoMark, profileSource]) {
    assert.match(asset, /<svg/);
    assert.doesNotMatch(asset, /gradient|filter|shadow/i);
  }
  assert.match(colorMark, /#23627b/);
  assert.doesNotMatch(monoMark, /#23627b/);
  assert.deepEqual([...profilePng.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("server-renders the two-product catalog with useful filters", async () => {
  const response = await render("/products");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Modern objects\./);
  assert.match(html, /Onami 2 Headphone Stand/);
  assert.match(html, /Japandi Paper Towel Holder/);
  assert.doesNotMatch(html, /Wave Planter|Articulated Dragon|Controller Dock|Hex Catchall Tray|Book Nook Markers|Cable Comb Set/);
  assert.match(html, /aria-label="Filter products by category"/);
});

test("office pilot is unlisted, mobile-ready, and isolated from the public catalog", async () => {
  const [office, publicCatalog, officePage, officeClient] = await Promise.all([
    render("/office"),
    render("/products"),
    readFile(new URL("../app/office/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/office/OfficePilot.tsx", import.meta.url), "utf8"),
  ]);
  assert.equal(office.status, 200);
  const officeHtml = await office.text();
  const publicHtml = await publicCatalog.text();
  assert.match(officeHtml, /Tap\. Pay\. Take one\./);
  assert.match(officeHtml, /Keychain from the Rack/);
  assert.match(officeHtml, /office-keychain-assortment-illustration-v1\.png/);
  assert.match(officeHtml, /Illustrated assortment/);
  assert.match(officeHtml, /Modular Desk Organizer Set/);
  assert.match(officeHtml, /Also available, if useful/);
  assert.match(officeHtml, /No pitch/);
  assert.match(officeHtml, /\$5\.00/);
  assert.match(officeHtml, /Take more, save a little/);
  assert.match(officeHtml, /Two or more for/);
  assert.match(officeHtml, /\$4\.00/);
  assert.match(officeHtml, /\$30\.00/);
  assert.match(officeHtml, /Matte Bone White/);
  assert.match(officeHtml, /Matte Charcoal/);
  assert.match(officeHtml, /Matte Dark Green/);
  assert.match(officeHtml, /Browse the full shop/);
  assert.match(officeHtml, /noindex/);
  assert.doesNotMatch(officeHtml, /Onami 2 Headphone Stand|Japandi Paper Towel Holder/);
  assert.doesNotMatch(publicHtml, /Keychain from the Rack|Modular Desk Organizer Set/);
  assert.match(officePage, /robots: \{ index: false, follow: false \}/);
  assert.match(officeClient, /length: 10/);
  assert.match(officeClient, /salesChannel: "office_nfc"/);
  assert.match(officeClient, /No confirmation needs to be shown/);
  assert.match(officeClient, /<details className="office-organizer-details">/);
  assert.match(officeClient, /variantForQuantity/);
  assert.match(officeClient, /keychainVariant\.unitAmount \* keychainQuantity/);
});

test("server-renders both product pages and policy routes", async () => {
  const [product, paperHolder, policy] = await Promise.all([
    render("/products/onami-2-headphone-stand"),
    render("/products/japandi-paper-towel-holder"),
    render("/policies/shipping"),
  ]);
  assert.equal(product.status, 200);
  assert.equal(paperHolder.status, 200);
  assert.equal(policy.status, 200);
  const productHtml = await product.text();
  const paperHolderHtml = await paperHolder.text();
  assert.match(productHtml, /Add to cart/);
  assert.match(productHtml, /Why this print works/);
  assert.match(productHtml, /Print details/);
  assert.match(productHtml, /Matte PLA/);
  assert.match(productHtml, /Original design by/);
  assert.match(productHtml, /Meyui/);
  assert.match(productHtml, /More from the print shelf/);
  assert.match(productHtml, /Demo listing/);
  assert.match(paperHolderHtml, /Japandi Paper Towel Holder/);
  assert.match(paperHolderHtml, /SabreDesign/);
  assert.match(paperHolderHtml, /Standard Roll/);
  assert.match(paperHolderHtml, /Jumbo \/ Warehouse Roll/);
  assert.match(paperHolderHtml, /Fits rolls up to 5\.9 in \(150 mm\) diameter/);
  assert.match(paperHolderHtml, /Measure your unopened roll/);
  assert.match(paperHolderHtml, /\$39\.00/);
  assert.match(paperHolderHtml, /\$52\.00/);
  assert.match(paperHolderHtml, /japandi-paper-towel-holder-empty-v1\.png/);
  assert.match(paperHolderHtml, /Demo listing/);
  assert.match(await policy.text(), /Shipping &amp; pickup/);
});

test("catalog metadata normalizes galleries and swatches safely", () => {
  assert.deepEqual(
    normalizeProductImages([" https://example.com/a.jpg ", "https://example.com/a.jpg", ""], "/fallback.png"),
    ["https://example.com/a.jpg"],
  );
  assert.deepEqual(normalizeProductImages([], "/fallback.png"), ["/fallback.png"]);
  assert.deepEqual(normalizeProductImages([], null), []);
  assert.deepEqual(splitMetadata("One | Two,, Three", []), ["One", "Two", "Three"]);
  assert.deepEqual(
    buildColorHexes(["Terracotta", "Unknown", "Ocean"], "#ABCDEF|not-a-hex", "moss"),
    ["#abcdef", "#8b9d78", "#3e7484"],
  );
});

test("product UI includes accessible gallery and aligned purchase controls", async () => {
  const [gallery, configurator, page] = await Promise.all([
    readFile(new URL("../app/components/ProductGallery.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ProductConfigurator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/products/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(gallery, /<dialog/);
  assert.match(gallery, /showModal/);
  assert.match(gallery, /onClose=.*focus/);
  assert.match(gallery, /aria-current/);
  assert.match(configurator, /product\.colorHexes/);
  assert.match(configurator, /length: 10/);
  assert.match(configurator, /variant\.dimensions/);
  assert.match(configurator, /mobile-buy-bar/);
  assert.match(page, /application\/ld\+json/);
  assert.match(page, /product\.demo \|\| product\.licenseStatus !== "active"/);
  assert.match(page, /item\.stockStatus !== "sold_out"/);
});

test("checkout keeps prices authoritative and secrets server-only", async () => {
  const [checkout, stripe, shell] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/stripe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/StoreShell.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /stripe\.prices\.retrieve/);
  assert.match(checkout, /price\.currency !== "usd"/);
  assert.match(checkout, /price\.type !== "one_time"/);
  assert.match(checkout, /STANDARD_US_SHIPPING_CENTS/);
  assert.match(checkout, /Flat-rate U\.S\. shipping/);
  assert.doesNotMatch(checkout, /subtotal >= 5000/);
  assert.match(checkout, /allowed_countries: \["US"/);
  assert.match(checkout, /fulfillment_method/);
  assert.match(checkout, /licenseStatus !== "active" && licenseStatus !== "not_required"/);
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
  assert.match(seed, /JPT-STANDARD/);
  assert.match(seed, /JPT-XL/);
  assert.match(seed, /3900/);
  assert.match(seed, /5200/);
  assert.match(seed, /jakes-office-keychain-rack/);
  assert.match(seed, /jakes-office-modular-desk-organizer/);
  assert.match(seed, /OFFICE-KEYCHAIN/);
  assert.match(seed, /OFFICE-KEYCHAIN-MULTI/);
  assert.match(seed, /400/);
  assert.match(seed, /min_quantity/);
  assert.match(seed, /max_quantity/);
  assert.match(seed, /OFFICE-MEYUI-DESK-SET/);
  assert.match(seed, /Matte Bone White\|Matte Charcoal\|Matte Dark Green/);
  assert.match(seed, /visibility: "office"/);
  assert.match(seed, /office_fulfillment: "take_now"/);
  assert.match(seed, /office_fulfillment: "work_delivery"/);
  assert.match(seed, /photo_status: "missing"/);
  assert.match(seed, /active: false/);
  assert.match(seed, /color_hexes/);
  assert.match(seed, /detail_copy/);
  assert.match(seed, /dimensions/);
  assert.match(seed, /stripe\.prices\.update/);
  assert.match(seed, /transfer_lookup_key: true/);
  assert.match(seed, /Stripe test catalog ready/);
});

test("office checkout is single-item, channel-bound, pickup-only, and phone-light", async () => {
  const [checkout, success, catalog] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/order/success/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /salesChannel\?: "office_nfc"/);
  assert.match(checkout, /body\.items\.length !== 1/);
  assert.match(checkout, /price\.metadata\.min_quantity/);
  assert.match(checkout, /price\.metadata\.max_quantity/);
  assert.match(checkout, /invalid_quantity_tier/);
  assert.match(checkout, /visibility !== "office"/);
  assert.match(checkout, /visibility === "office"/);
  assert.match(checkout, /office_fulfillment/);
  assert.match(checkout, /photo_status !== "ready"/);
  assert.match(checkout, /cancelPath = isOfficeCheckout \? "\/office\?checkout=canceled"/);
  assert.match(checkout, /isOfficeCheckout\s*\? \{\}\s*:\s*\{\s*phone_number_collection/);
  assert.match(checkout, /shipping_amount = body\.fulfillment === "shipping" \? String\(shippingAmount\) : "0"/);
  assert.match(success, /Payment confirmed—take one available keychain/);
  assert.match(success, /deliver your made-to-order set at work/);
  assert.match(catalog, /getCatalog\(visibility: CatalogVisibility = "public"\)/);
  assert.match(catalog, /visibility === "office" \? \[\] : demoProducts/);
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
