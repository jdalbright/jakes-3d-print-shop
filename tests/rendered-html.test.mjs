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

test("server-renders the complete test storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Jake’s 3D Print Shop/);
  assert.match(html, /Useful things/);
  assert.match(html, /Test shop/);
  assert.match(html, /Wave Planter/);
  assert.match(html, /wave-planter-demo\.png/);
  assert.match(html, /Local pickup/);
  assert.doesNotMatch(html, /Studio favorites|Room for a good idea|Good ideas/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("server-renders product and policy routes", async () => {
  const [product, policy] = await Promise.all([
    render("/products/wave-planter"),
    render("/policies/shipping"),
  ]);
  assert.equal(product.status, 200);
  assert.equal(policy.status, 200);
  const productHtml = await product.text();
  assert.match(productHtml, /Add to cart/);
  assert.match(productHtml, /Why this print works/);
  assert.match(productHtml, /Print details/);
  assert.match(productHtml, /Plant-based PLA/);
  assert.match(productHtml, /More from the print shelf/);
  assert.match(productHtml, /Demo listing/);
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
  assert.match(page, /product\.demo \? \{ index: false/);
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
