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
  assert.match(html, /A cleaner desk/);
  assert.match(html, /Test shop/);
  assert.match(html, /Onami 2 Headphone Stand/);
  assert.match(html, /Japandi Paper Towel Holder/);
  assert.match(html, /Fresh off the bench/);
  assert.match(html, /View all products/);
  assert.match(html, /onami-2-headphone-stand-hero-v3\.png/);
  assert.match(html, /japandi-paper-towel-holder-hero-v1\.png/);
  assert.match(html, /Local pickup/);
  assert.doesNotMatch(html, /Wave Planter|Articulated Dragon|Controller Dock|Hex Catchall Tray|Book Nook Markers|Cable Comb Set/);
  assert.doesNotMatch(html, /Studio favorites|Room for a good idea|Good ideas/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("server-renders the two-product catalog with useful filters", async () => {
  const response = await render("/products");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Current prints\./);
  assert.match(html, /Onami 2 Headphone Stand/);
  assert.match(html, /Japandi Paper Towel Holder/);
  assert.doesNotMatch(html, /Wave Planter|Articulated Dragon|Controller Dock|Hex Catchall Tray|Book Nook Markers|Cable Comb Set/);
  assert.match(html, /aria-label="Filter products by category"/);
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
  assert.match(paperHolderHtml, /Standard/);
  assert.match(paperHolderHtml, /XL/);
  assert.match(paperHolderHtml, /Fits rolls up to 5\.9 in diameter/);
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
  assert.match(checkout, /subtotal >= 5000 \? 0 : 600/);
  assert.match(checkout, /allowed_countries: \["US"/);
  assert.match(checkout, /fulfillment_method/);
  assert.match(checkout, /license_status !== "active"/);
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
  assert.match(seed, /active: false/);
  assert.match(seed, /color_hexes/);
  assert.match(seed, /detail_copy/);
  assert.match(seed, /dimensions/);
  assert.match(seed, /stripe\.prices\.update/);
  assert.match(seed, /Stripe test catalog ready/);
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
