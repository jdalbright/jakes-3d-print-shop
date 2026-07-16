import assert from "node:assert/strict";
import test from "node:test";

import {
  isBinaryBuffer,
  scanSecretText,
} from "../scripts/scan-tracked-secrets.mjs";

test("secret scan detects provider credentials without returning their values", () => {
  const stripeKey = ["sk", "live", "A".repeat(32)].join("_");
  const findings = scanSecretText(`STRIPE_SECRET_KEY=${stripeKey}`, "fixture.env");

  assert.ok(findings.some((finding) => finding.detector === "stripe-api-key"));
  assert.equal(JSON.stringify(findings).includes(stripeKey), false);
});

test("secret scan detects generic assigned secrets and private keys", () => {
  const assignedName = ["SERVICE", "TOKEN"].join("_");
  const assignedValue = "a1B2c3D4e5F6g7H8i9J0k1L2m3N4";
  const privateKeyHeader = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
  const findings = scanSecretText(
    `${assignedName}=${assignedValue}\n${privateKeyHeader}`,
    "fixture.txt",
  );

  assert.deepEqual(
    findings.map((finding) => finding.detector).sort(),
    ["assigned-secret", "private-key"],
  );
});

test("secret scan accepts documented placeholders and ordinary source", () => {
  const text = [
    "STRIPE_SECRET_KEY=sk_test_replace_me",
    "STRIPE_WEBHOOK_SECRET=whsec_replace_me",
    "const secretKey = process.env.STRIPE_SECRET_KEY;",
  ].join("\n");

  assert.deepEqual(scanSecretText(text, ".env.example"), []);
});

test("secret scan identifies binary buffers", () => {
  assert.equal(isBinaryBuffer(Buffer.from([137, 80, 78, 71, 0, 1])), true);
  assert.equal(isBinaryBuffer(Buffer.from("plain text", "utf8")), false);
});
