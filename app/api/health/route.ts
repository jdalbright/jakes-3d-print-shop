import { NextResponse } from "next/server";
import { getStripeRuntimeConfiguration, getValidatedSiteOrigin } from "../../lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const stripe = getStripeRuntimeConfiguration();
  const checks = {
    stripe: stripe.stripeEnabled,
    webhook: stripe.webhookConfigured,
    siteUrl: getValidatedSiteOrigin(stripe.liveModeRequested) !== null,
    automaticTax: process.env.STRIPE_AUTOMATIC_TAX === "true",
  };
  const ready = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: "ok",
      ready,
      mode: stripe.liveModeRequested ? "live" : "test",
      keyMode: stripe.keyMode ?? "unconfigured",
      stripeConfigured: stripe.stripeEnabled,
      liveLaunchEnabled: stripe.liveLaunchEnabled,
      checks,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
