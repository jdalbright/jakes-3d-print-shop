import assert from "node:assert/strict";
import test from "node:test";
import { validateLiveHealthPayload } from "../scripts/check-production-health.mjs";

function readyPayload() {
  return {
    status: "ok",
    ready: true,
    mode: "live",
    keyMode: "live",
    liveLaunchEnabled: true,
    checks: {
      automaticTax: true,
      catalog: true,
      siteUrl: true,
      stripe: true,
      stripeReachable: true,
      taxRegistration: true,
      webhook: true,
    },
  };
}

test("production monitor accepts only complete live readiness", () => {
  assert.doesNotThrow(() => validateLiveHealthPayload(readyPayload()));
  assert.throws(
    () => validateLiveHealthPayload({ ...readyPayload(), mode: "test" }),
    /not live and ready/,
  );
  const missingRegistration = readyPayload();
  missingRegistration.checks.taxRegistration = false;
  assert.throws(
    () => validateLiveHealthPayload(missingRegistration),
    /taxRegistration/,
  );
});
