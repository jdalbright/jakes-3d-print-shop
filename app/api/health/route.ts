import { NextResponse } from "next/server";
import { getCachedLiveStripeHealth, type LiveStripeHealth } from "../../lib/live-health";
import { checkRateLimit } from "../../lib/request-security";
import { getStripe, getStripeRuntimeConfiguration, getValidatedSiteOrigin } from "../../lib/stripe";

export const dynamic = "force-dynamic";

async function getLiveProbe(): Promise<LiveStripeHealth> {
  const stripe = getStripe();
  if (!stripe) {
    return { stripeReachable: false, catalog: false, taxRegistration: false };
  }
  return getCachedLiveStripeHealth(stripe);
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, { scope: "health", limit: 30, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { status: "degraded", ready: false, error: "Too many health requests." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }
  const stripe = getStripeRuntimeConfiguration();
  const liveProbe = stripe.liveModeRequested
    ? await getLiveProbe()
    : null;
  const checks = {
    stripe: stripe.stripeEnabled,
    webhook: stripe.webhookConfigured,
    siteUrl: getValidatedSiteOrigin(stripe.liveModeRequested) !== null,
    automaticTax: process.env.STRIPE_AUTOMATIC_TAX === "true",
    ...(liveProbe
      ? {
          stripeReachable: liveProbe.stripeReachable,
          catalog: liveProbe.catalog,
          taxRegistration: liveProbe.taxRegistration,
        }
      : {}),
  };
  const ready = Object.values(checks).every(Boolean);
  const unavailable = stripe.liveModeRequested && !ready;

  return NextResponse.json(
    {
      status: unavailable ? "degraded" : "ok",
      ready,
      mode: stripe.liveModeRequested ? "live" : "test",
      keyMode: stripe.keyMode ?? "unconfigured",
      stripeConfigured: stripe.stripeEnabled,
      liveLaunchEnabled: stripe.liveLaunchEnabled,
      checks,
    },
    {
      status: unavailable ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
