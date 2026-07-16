import "server-only";
import Stripe from "stripe";

export const stripeApiVersion = "2026-02-25.clover" as const;

export type StripeKeyMode = "test" | "live";

const stripeSecretKeyPattern = /^sk_(test|live)_[A-Za-z0-9]{16,}$/;
const stripeWebhookSecretPattern = /^whsec_[A-Za-z0-9]{16,}$/;

export type StripeRuntimeConfiguration = {
  keyMode: StripeKeyMode | null;
  liveModeRequested: boolean;
  webhookConfigured: boolean;
  stripeEnabled: boolean;
  liveLaunchEnabled: boolean;
};

export function stripeKeyMode(secretKey = process.env.STRIPE_SECRET_KEY): StripeKeyMode | null {
  const match = secretKey?.trim().match(stripeSecretKeyPattern);
  return match?.[1] === "test" || match?.[1] === "live" ? match[1] : null;
}

export function hasValidStripeWebhookSecret(
  endpointSecret = process.env.STRIPE_WEBHOOK_SECRET,
): boolean {
  return stripeWebhookSecretPattern.test(endpointSecret?.trim() ?? "");
}

export function getValidatedSiteOrigin(requireHttps: boolean): string | null {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || siteUrl.length > 2_048) return null;

  try {
    const parsed = new URL(siteUrl);
    if (
      !parsed.hostname
      || parsed.username
      || parsed.password
      || (parsed.pathname !== "/" && parsed.pathname !== "")
      || parsed.search
      || parsed.hash
    ) {
      return null;
    }
    if (parsed.protocol === "https:") return parsed.origin;
    if (!requireHttps && parsed.protocol === "http:" && parsed.hostname === "localhost") {
      return parsed.origin;
    }
    return null;
  } catch {
    return null;
  }
}

export function getStripeRuntimeConfiguration(): StripeRuntimeConfiguration {
  const keyMode = stripeKeyMode();
  const liveModeRequested = process.env.STORE_LIVE_MODE === "true";
  const webhookConfigured = hasValidStripeWebhookSecret();
  const liveLaunchEnabled = liveModeRequested && keyMode === "live" && webhookConfigured;
  const stripeEnabled = liveLaunchEnabled || (!liveModeRequested && keyMode === "test");

  return {
    keyMode,
    liveModeRequested,
    webhookConfigured,
    stripeEnabled,
    liveLaunchEnabled,
  };
}

export function getStripe(): Stripe | null {
  const configuration = getStripeRuntimeConfiguration();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!configuration.stripeEnabled || !secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: stripeApiVersion as Stripe.LatestApiVersion,
    appInfo: { name: "Jake's 3D Print Shop", version: "1.0.0" },
  });
}

export function isStripeTestMode(): boolean {
  return stripeKeyMode() === "test";
}

export function isLiveLaunchEnabled(): boolean {
  return getStripeRuntimeConfiguration().liveLaunchEnabled;
}
