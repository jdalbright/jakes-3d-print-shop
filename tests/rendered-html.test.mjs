import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  assert.match(html, /Good ideas/);
  assert.match(html, /Test shop/);
  assert.match(html, /Wave Planter/);
  assert.match(html, /wave-planter-demo\.png/);
  assert.match(html, /Free local pickup/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("server-renders product and policy routes", async () => {
  const [product, policy] = await Promise.all([
    render("/products/wave-planter"),
    render("/policies/shipping"),
  ]);
  assert.equal(product.status, 200);
  assert.equal(policy.status, 200);
  assert.match(await product.text(), /Add to cart/);
  assert.match(await policy.text(), /Shipping &amp; pickup/);
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
  assert.match(seed, /Stripe test catalog ready/);
});
