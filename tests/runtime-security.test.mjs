import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";

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

test("checkout returns controlled errors for malformed and bounded payloads", async () => {
  const cases = [
    {
      expected: 400,
      headers: { "content-type": "application/json", origin: "https://shop.example" },
      body: "{",
    },
    {
      expected: 400,
      headers: { "content-type": "text/plain", origin: "https://shop.example" },
      body: JSON.stringify({ items: [], fulfillment: "shipping" }),
    },
    {
      expected: 400,
      headers: { "content-type": "application/json", origin: "https://shop.example" },
      body: JSON.stringify({ items: [], fulfillment: "shipping", unexpected: true }),
    },
    {
      expected: 400,
      headers: { "content-type": "application/json", origin: "https://shop.example" },
      body: JSON.stringify({
        items: [{ priceId: `price_${"a".repeat(241)}`, quantity: 1, color: "Matte Charcoal" }],
        fulfillment: "shipping",
      }),
    },
    {
      expected: 400,
      headers: { "content-type": "application/json", origin: "https://shop.example" },
      body: JSON.stringify({
        items: [{ priceId: "price_valid123", quantity: 1, color: "a".repeat(81) }],
        fulfillment: "shipping",
      }),
    },
    {
      expected: 413,
      headers: { "content-type": "application/json", origin: "https://shop.example" },
      body: JSON.stringify({
        items: [{ priceId: "price_valid123", quantity: 1, color: "Matte Charcoal" }],
        fulfillment: "shipping",
        pickupNote: "a".repeat(17_000),
      }),
    },
  ];

  for (const candidate of cases) {
    const response = await dispatch("/api/checkout", {
      method: "POST",
      headers: candidate.headers,
      body: candidate.body,
    });
    assert.equal(response.status, candidate.expected);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.equal(typeof (await response.json()).error, "string");
  }
});

test("checkout rate limiting returns a bounded 429 response", async () => {
  const worker = await loadWorker();
  const init = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://shop.example",
      "cf-connecting-ip": "203.0.113.88",
    },
    body: "null",
  };
  for (let index = 0; index < 12; index += 1) {
    assert.equal((await dispatchWithWorker(worker, "/api/checkout", init)).status, 400);
  }
  const limited = await dispatchWithWorker(worker, "/api/checkout", init);
  assert.equal(limited.status, 429);
  assert.match(limited.headers.get("retry-after") || "", /^\d+$/);
  assert.match(limited.headers.get("cache-control") || "", /no-store/);
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

test("webhook accepts a signed Checkout event and rejects a bad signature", async () => {
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  const previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const previousLiveMode = process.env.STORE_LIVE_MODE;
  const webhookSecret = "whsec_1234567890abcdef";
  process.env.STRIPE_SECRET_KEY = "sk_test_1234567890abcdef";
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  process.env.STORE_LIVE_MODE = "false";

  try {
    const worker = await loadWorker();
    const payload = JSON.stringify({
      id: "evt_test_signed123456",
      object: "event",
      api_version: "2026-02-25.clover",
      created: 1_700_000_000,
      data: {
        object: {
          id: "cs_test_signed123456",
          object: "checkout.session",
          payment_status: "paid",
          metadata: {
            fulfillment_method: "pickup",
            sales_channel: "storefront",
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: "checkout.session.completed",
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });
    const signedResponse = await dispatchWithWorker(worker, "/api/stripe/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });
    assert.equal(signedResponse.status, 200);
    assert.match(signedResponse.headers.get("cache-control") || "", /no-store/);
    assert.deepEqual(await signedResponse.json(), { received: true });

    const rejectedResponse = await dispatchWithWorker(worker, "/api/stripe/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1700000000,v1=invalid",
      },
      body: payload,
    });
    assert.equal(rejectedResponse.status, 400);
  } finally {
    if (previousStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousStripeKey;
    if (previousWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret;
    if (previousLiveMode === undefined) delete process.env.STORE_LIVE_MODE;
    else process.env.STORE_LIVE_MODE = previousLiveMode;
  }
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

test("live mode stays degraded when automatic tax is not enabled", async () => {
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  const previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const previousLiveMode = process.env.STORE_LIVE_MODE;
  const previousAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX;
  const previousSiteUrl = process.env.SITE_URL;
  process.env.STRIPE_SECRET_KEY = "sk_live_1234567890abcdef";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_1234567890abcdef";
  process.env.STORE_LIVE_MODE = "true";
  process.env.STRIPE_AUTOMATIC_TAX = "false";
  process.env.SITE_URL = "https://shop.example";

  try {
    const response = await dispatch("/api/health");
    assert.equal(response.status, 503);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    const payload = await response.json();
    assert.equal(payload.status, "degraded");
    assert.equal(payload.ready, false);
    assert.equal(payload.liveLaunchEnabled, false);
    assert.equal(payload.checks.automaticTax, false);
  } finally {
    if (previousStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousStripeKey;
    if (previousWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret;
    if (previousLiveMode === undefined) delete process.env.STORE_LIVE_MODE;
    else process.env.STORE_LIVE_MODE = previousLiveMode;
    if (previousAutomaticTax === undefined) delete process.env.STRIPE_AUTOMATIC_TAX;
    else process.env.STRIPE_AUTOMATIC_TAX = previousAutomaticTax;
    if (previousSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previousSiteUrl;
  }
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
