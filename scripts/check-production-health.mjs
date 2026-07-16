#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const requiredHealthChecks = [
  "automaticTax",
  "catalog",
  "siteUrl",
  "stripe",
  "stripeReachable",
  "taxRegistration",
  "webhook",
];

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateLiveHealthPayload(payload) {
  if (!isObject(payload) || !isObject(payload.checks)) {
    throw new Error("Health response has an invalid shape.");
  }
  if (
    payload.status !== "ok"
    || payload.ready !== true
    || payload.mode !== "live"
    || payload.keyMode !== "live"
    || payload.liveLaunchEnabled !== true
  ) {
    throw new Error("Storefront is not live and ready.");
  }
  const missing = requiredHealthChecks.filter((check) => payload.checks[check] !== true);
  if (missing.length > 0) {
    throw new Error(`Health checks are not ready: ${missing.join(", ")}.`);
  }
}

function configuredOrigin(value = process.env.SITE_URL) {
  if (!value || value.length > 2_048) throw new Error("SITE_URL is required.");
  const parsed = new URL(value);
  if (
    parsed.protocol !== "https:"
    || parsed.username
    || parsed.password
    || (parsed.pathname !== "/" && parsed.pathname !== "")
    || parsed.search
    || parsed.hash
  ) {
    throw new Error("SITE_URL must be an HTTPS origin.");
  }
  return parsed.origin;
}

async function fetchChecked(url, accept) {
  const response = await fetch(url, {
    headers: { accept, "user-agent": "jakes-storefront-health-monitor/1.0" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`${new URL(url).pathname} returned HTTP ${response.status}.`);
  return response;
}

async function run() {
  const origin = configuredOrigin();
  const health = await fetchChecked(`${origin}/api/health`, "application/json");
  if (!/no-store/i.test(health.headers.get("cache-control") || "")) {
    throw new Error("Health response is missing no-store caching.");
  }
  validateLiveHealthPayload(await health.json());

  const [home, robots, sitemap] = await Promise.all([
    fetchChecked(`${origin}/`, "text/html"),
    fetchChecked(`${origin}/robots.txt`, "text/plain"),
    fetchChecked(`${origin}/sitemap.xml`, "application/xml"),
  ]);
  const homeText = await home.text();
  if (!homeText.includes("Jake’s 3D Print Shop") || /Stripe sandbox|Test shop/.test(homeText)) {
    throw new Error("Homepage branding or live-mode copy is incorrect.");
  }
  if (!/frame-ancestors 'none'/.test(home.headers.get("content-security-policy") || "")) {
    throw new Error("Homepage Content-Security-Policy is missing.");
  }
  if (!(await robots.text()).includes(`${origin}/sitemap.xml`)) {
    throw new Error("robots.txt does not reference the production sitemap.");
  }
  if (!(await sitemap.text()).includes(`<loc>${origin}/</loc>`)) {
    throw new Error("sitemap.xml does not include the production homepage.");
  }

  console.log("Production monitor passed: live health, homepage, robots, and sitemap are ready.");
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : "Production monitor failed.");
    process.exitCode = 1;
  });
}
