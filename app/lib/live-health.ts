import type Stripe from "stripe";
import { checkLiveCatalogReadiness, stripeCatalogVersion } from "./catalog-readiness.ts";

export type LiveStripeHealth = {
  stripeReachable: boolean;
  catalog: boolean;
  taxRegistration: boolean;
  errorType?: string;
};

type StripeHealthClient = Pick<Stripe, "prices" | "products" | "tax">;

const stripeRequestOptions = {
  maxNetworkRetries: 0,
  timeout: 5_000,
} as const;
const liveHealthCacheTtlMs = 60_000;
const liveHealthCacheUrl = `https://jakes-3d-print-shop.jakealbright.chatgpt.site/.internal/live-health/${stripeCatalogVersion}`;
let cachedLiveHealth: { expiresAt: number; result: LiveStripeHealth } | null = null;
let pendingLiveHealth: Promise<LiveStripeHealth> | null = null;

type WorkerCacheStorage = CacheStorage & { default?: Cache };

function defaultWorkerCache(): Cache | null {
  const storage = (globalThis as typeof globalThis & { caches?: WorkerCacheStorage }).caches;
  return storage?.default ?? null;
}

function isLiveStripeHealth(value: unknown): value is LiveStripeHealth {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.stripeReachable === "boolean"
    && typeof candidate.catalog === "boolean"
    && typeof candidate.taxRegistration === "boolean"
    && (candidate.errorType === undefined || typeof candidate.errorType === "string");
}

async function readSharedHealthCache(): Promise<LiveStripeHealth | null> {
  const cache = defaultWorkerCache();
  if (!cache) return null;
  try {
    const response = await cache.match(new Request(liveHealthCacheUrl));
    if (!response) return null;
    const value = await response.json() as unknown;
    return isLiveStripeHealth(value) ? value : null;
  } catch {
    return null;
  }
}

async function writeSharedHealthCache(result: LiveStripeHealth): Promise<void> {
  const cache = defaultWorkerCache();
  if (!cache) return;
  try {
    await cache.put(
      new Request(liveHealthCacheUrl),
      Response.json(result, {
        headers: { "Cache-Control": `public, max-age=${Math.floor(liveHealthCacheTtlMs / 1_000)}` },
      }),
    );
  } catch {
    // The in-memory cache still bounds requests when the Worker cache is unavailable.
  }
}

function safeErrorType(error: unknown): string {
  if (typeof error !== "object" || error === null) return "unknown";
  const candidate = error as { name?: unknown; type?: unknown };
  const value = typeof candidate.type === "string" ? candidate.type : candidate.name;
  return typeof value === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(value) ? value : "unknown";
}

export function hasActiveNorthCarolinaRegistration(
  registrations: readonly Stripe.Tax.Registration[],
): boolean {
  return registrations.some((registration) => (
    registration.country === "US"
    && registration.status === "active"
    && registration.country_options.us?.state === "NC"
    && registration.country_options.us.type === "state_sales_tax"
  ));
}

export async function probeLiveStripeHealth(stripe: StripeHealthClient): Promise<LiveStripeHealth> {
  try {
    const [productsResult, pricesResult, registrationsResult] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }, stripeRequestOptions),
      stripe.prices.list({ active: true, limit: 100 }, stripeRequestOptions),
      stripe.tax.registrations.list({ status: "active", limit: 100 }, stripeRequestOptions),
    ]);
    const catalog = checkLiveCatalogReadiness({
      products: productsResult.data,
      prices: pricesResult.data,
      productsTruncated: productsResult.has_more,
      pricesTruncated: pricesResult.has_more,
    });

    return {
      stripeReachable: true,
      catalog: catalog.ready,
      taxRegistration: !registrationsResult.has_more
        && hasActiveNorthCarolinaRegistration(registrationsResult.data),
    };
  } catch (error) {
    return {
      stripeReachable: false,
      catalog: false,
      taxRegistration: false,
      errorType: safeErrorType(error),
    };
  }
}

export async function getCachedLiveStripeHealth(stripe: StripeHealthClient): Promise<LiveStripeHealth> {
  const now = Date.now();
  if (cachedLiveHealth && cachedLiveHealth.expiresAt > now) return cachedLiveHealth.result;

  const shared = await readSharedHealthCache();
  if (shared) {
    cachedLiveHealth = { expiresAt: now + liveHealthCacheTtlMs, result: shared };
    return shared;
  }

  pendingLiveHealth ??= probeLiveStripeHealth(stripe).then(async (result) => {
    cachedLiveHealth = { expiresAt: Date.now() + liveHealthCacheTtlMs, result };
    if (result.errorType) {
      console.error("health_live_probe_failed", { type: result.errorType });
    }
    await writeSharedHealthCache(result);
    return result;
  }).finally(() => {
    pendingLiveHealth = null;
  });
  return pendingLiveHealth;
}
