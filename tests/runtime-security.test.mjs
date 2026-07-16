import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("runtime-test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

async function dispatchWithWorker(worker, pathname, init = {}, origin = "https://shop.example") {
  const headers = new Headers(init.headers);
  headers.set("accept", headers.get("accept") || "application/json");
  return worker.fetch(
    new Request(`${origin}${pathname}`, { ...init, headers }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function dispatch(pathname, init = {}, origin = "https://shop.example") {
  return dispatchWithWorker(await loadWorker(), pathname, init, origin);
}

test("checkout rejects malformed objects before touching Stripe", async () => {
  const nullResponse = await dispatch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://shop.example" },
    body: "null",
  });
  assert.equal(nullResponse.status, 400);

  const nullItemResponse = await dispatch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://shop.example" },
    body: JSON.stringify({ items: [null], fulfillment: "shipping" }),
  });
  assert.equal(nullItemResponse.status, 400);

  const unavailableResponse = await dispatch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://shop.example" },
    body: JSON.stringify({
      items: [{ priceId: "price_valid123", quantity: 1, color: "Matte Charcoal" }],
      fulfillment: "shipping",
    }),
  });
  assert.equal(unavailableResponse.status, 503);
});

test("checkout and analytics reject cross-origin and oversized requests", async () => {
  const crossOrigin = await dispatch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.example" },
    body: JSON.stringify({
      items: [{ priceId: "price_valid123", quantity: 1, color: "Black" }],
      fulfillment: "shipping",
    }),
  });
  assert.equal(crossOrigin.status, 403);

  const oversized = await dispatch("/api/store-events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": "5000",
      origin: "https://shop.example",
    },
    body: JSON.stringify({ eventName: "product_view", productSlug: "acorn-container" }),
  });
  assert.equal(oversized.status, 413);
});

test("analytics rejects null and accepts a bounded same-origin event", async () => {
  const nullResponse = await dispatch("/api/store-events", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://shop.example" },
    body: "null",
  });
  assert.equal(nullResponse.status, 400);

  const validResponse = await dispatch("/api/store-events", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://shop.example" },
    body: JSON.stringify({ eventName: "product_view", productSlug: "acorn-container" }),
  });
  assert.equal(validResponse.status, 204);
});

test("health reports non-secret readiness and API responses are not cached", async () => {
  const response = await dispatch("/api/health");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  const body = await response.text();
  assert.doesNotMatch(body, /sk_(?:test|live)_|rk_live_|whsec_/);
  const payload = JSON.parse(body);
  assert.equal(payload.status, "ok");
  assert.equal(typeof payload.stripeConfigured, "boolean");
  assert.equal(typeof payload.liveLaunchEnabled, "boolean");
});

test("worker applies security headers and protects confirmation responses", async () => {
  const home = await dispatch("/", { headers: { accept: "text/html" } });
  assert.equal(home.status, 200);
  assert.match(home.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
  assert.equal(home.headers.get("x-content-type-options"), "nosniff");
  assert.equal(home.headers.get("x-frame-options"), "DENY");
  assert.equal(home.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(home.headers.get("strict-transport-security") || "", /max-age=31536000/);

  const success = await dispatch("/order/success", { headers: { accept: "text/html" } });
  assert.match(success.headers.get("cache-control") || "", /no-store/);
  assert.equal(success.headers.get("referrer-policy"), "no-referrer");
});

test("confirmation lookups are bounded and rate limited before Stripe retrieval", async () => {
  const worker = await loadWorker();
  for (let index = 0; index < 30; index += 1) {
    const response = await dispatchWithWorker(worker, "/order/success?session_id=cs_bad", {
      headers: { accept: "text/html", "cf-connecting-ip": "203.0.113.77" },
    });
    assert.equal(response.status, 200);
  }
  const limited = await dispatchWithWorker(worker, "/order/success?session_id=cs_bad", {
    headers: { accept: "text/html", "cf-connecting-ip": "203.0.113.77" },
  });
  assert.equal(limited.status, 429);
  assert.match(limited.headers.get("retry-after") || "", /^\d+$/);
  assert.match(limited.headers.get("cache-control") || "", /no-store/);
});

test("public discovery files render and excluded pages remain noindex", async () => {
  const [robots, sitemap, cart, office] = await Promise.all([
    dispatch("/robots.txt", { headers: { accept: "text/plain" } }),
    dispatch("/sitemap.xml", { headers: { accept: "application/xml" } }),
    dispatch("/cart", { headers: { accept: "text/html" } }),
    dispatch("/office", { headers: { accept: "text/html" } }),
  ]);
  assert.equal(robots.status, 200);
  assert.equal(sitemap.status, 200);
  assert.match(await robots.text(), /Sitemap:/);
  assert.match(await sitemap.text(), /<urlset/);
  assert.match(await cart.text(), /name="robots" content="noindex, nofollow"/);
  assert.match(await office.text(), /name="robots" content="noindex, nofollow"/);
});
