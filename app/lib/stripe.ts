import "server-only";
import Stripe from "stripe";

export const stripeApiVersion = "2026-02-25.clover" as const;

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!secretKey.startsWith("sk_test_") && process.env.STORE_LIVE_MODE !== "true") {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: stripeApiVersion as Stripe.LatestApiVersion,
    appInfo: { name: "Jake's 3D Print Shop", version: "1.0.0" },
  });
}

export function isStripeTestMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
}

export function isLiveLaunchEnabled(): boolean {
  return process.env.STORE_LIVE_MODE === "true" && !isStripeTestMode();
}
