import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedLiveStripeHealth,
  hasActiveNorthCarolinaRegistration,
  probeLiveStripeHealth,
} from "../app/lib/live-health.ts";

function registration(overrides = {}) {
  return {
    id: "taxreg_test",
    object: "tax.registration",
    active_from: 1,
    country: "US",
    country_options: {
      us: {
        state: "NC",
        type: "state_sales_tax",
      },
    },
    created: 1,
    expires_at: null,
    livemode: true,
    status: "active",
    ...overrides,
  };
}

test("live health recognizes only an active North Carolina sales-tax registration", () => {
  assert.equal(hasActiveNorthCarolinaRegistration([registration()]), true);
  assert.equal(hasActiveNorthCarolinaRegistration([registration({ status: "expired" })]), false);
  assert.equal(hasActiveNorthCarolinaRegistration([
    registration({ country_options: { us: { state: "VA", type: "state_sales_tax" } } }),
  ]), false);
});

test("live health bounds Stripe requests and fails a missing catalog closed", async () => {
  const requestOptions = [];
  const client = {
    products: {
      async list(_params, options) {
        requestOptions.push(options);
        return { data: [], has_more: false };
      },
    },
    prices: {
      async list(_params, options) {
        requestOptions.push(options);
        return { data: [], has_more: false };
      },
    },
    tax: {
      registrations: {
        async list(_params, options) {
          requestOptions.push(options);
          return { data: [registration()], has_more: false };
        },
      },
    },
  };

  const result = await probeLiveStripeHealth(client);
  assert.deepEqual(result, {
    stripeReachable: true,
    catalog: false,
    taxRegistration: true,
  });
  assert.equal(requestOptions.length, 3);
  assert.ok(requestOptions.every((options) => (
    options.timeout === 5_000 && options.maxNetworkRetries === 0
  )));
});

test("live health redacts Stripe probe failures", async () => {
  const client = {
    products: { async list() { throw Object.assign(new Error("secret response"), { type: "StripeConnectionError" }); } },
    prices: { async list() { return { data: [], has_more: false }; } },
    tax: { registrations: { async list() { return { data: [], has_more: false }; } } },
  };

  assert.deepEqual(await probeLiveStripeHealth(client), {
    stripeReachable: false,
    catalog: false,
    taxRegistration: false,
    errorType: "StripeConnectionError",
  });
});

test("live health caches dependency probes within an isolate", async () => {
  let calls = 0;
  const client = {
    products: { async list() { calls += 1; return { data: [], has_more: false }; } },
    prices: { async list() { calls += 1; return { data: [], has_more: false }; } },
    tax: { registrations: { async list() { calls += 1; return { data: [], has_more: false }; } } },
  };

  const first = await getCachedLiveStripeHealth(client);
  const second = await getCachedLiveStripeHealth(client);
  assert.deepEqual(second, first);
  assert.equal(calls, 3);
});
