import "server-only";

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid" | "too_large" };

type TextBodyResult =
  | { ok: true; value: string }
  | { ok: false; reason: "invalid" | "too_large" };

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitPolicy = {
  scope: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const maxRateLimitBuckets = 2_000;
let rateLimitChecks = 0;

function contentLength(request: Request): number | null {
  const header = request.headers.get("content-length");
  if (header === null) return null;
  if (!/^\d{1,12}$/.test(header)) return Number.NaN;
  return Number(header);
}

async function readBoundedText(request: Request, maxBytes: number): Promise<TextBodyResult> {
  const declaredLength = contentLength(request);
  if (declaredLength !== null && (!Number.isFinite(declaredLength) || declaredLength > maxBytes)) {
    return { ok: false, reason: declaredLength > maxBytes ? "too_large" : "invalid" };
  }
  if (!request.body) return { ok: false, reason: "invalid" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let byteLength = 0;
  let value = "";

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteLength += chunk.value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }
      value += decoder.decode(chunk.value, { stream: true });
    }
    value += decoder.decode();
    return { ok: true, value };
  } catch {
    try {
      await reader.cancel();
    } catch {
      // The stream may already be closed; the original body error is what matters.
    }
    return { ok: false, reason: "invalid" };
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const declaredLength = contentLength(request);
  if (declaredLength !== null && (!Number.isFinite(declaredLength) || declaredLength > maxBytes)) {
    return { ok: false, reason: declaredLength > maxBytes ? "too_large" : "invalid" };
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, reason: "invalid" };

  const body = await readBoundedText(request, maxBytes);
  if (!body.ok) return body;

  try {
    return { ok: true, value: JSON.parse(body.value) as unknown };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export async function readTextBody(request: Request, maxBytes: number): Promise<TextBodyResult> {
  return readBoundedText(request, maxBytes);
}

export function isStrictObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function configuredSiteOrigin(): string | null {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || siteUrl.length > 2_048) return null;
  try {
    const parsed = new URL(siteUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function hasTrustedBrowserOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") return false;

  const origin = request.headers.get("origin");
  if (origin === null) return true;
  if (origin.length > 2_048 || origin === "null") return false;

  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin) return false;
    const parsedOrigin = parsed.origin;
    const requestOrigin = new URL(request.url).origin;
    const allowedOrigins = new Set([requestOrigin]);
    const siteOrigin = configuredSiteOrigin();
    if (siteOrigin) allowedOrigins.add(siteOrigin);
    return allowedOrigins.has(parsedOrigin);
  } catch {
    return false;
  }
}

function clientRateLimitKey(request: Request): string | null {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp && cloudflareIp.length <= 64) return cloudflareIp;

  if (process.env.NODE_ENV === "production") return null;

  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  if (forwardedIp && forwardedIp.length <= 64) return forwardedIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length <= 64) return realIp;
  return null;
}

function pruneRateLimitBuckets(now: number) {
  rateLimitChecks += 1;
  if (rateLimitChecks % 128 !== 0 && rateLimitBuckets.size < maxRateLimitBuckets) return;

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }

  while (rateLimitBuckets.size >= maxRateLimitBuckets) {
    const oldestKey = rateLimitBuckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    rateLimitBuckets.delete(oldestKey);
  }
}

/**
 * Best-effort abuse control for a Worker isolate. This deliberately has bounded
 * memory, but is not a globally consistent quota across isolates or regions.
 */
export function checkRateLimit(request: Request, policy: RateLimitPolicy): RateLimitResult {
  const now = Date.now();
  pruneRateLimitBuckets(now);

  const clientKey = clientRateLimitKey(request);
  if (!clientKey) return { allowed: true };

  const key = `${policy.scope}:${clientKey}`;
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + policy.windowMs });
    return { allowed: true };
  }

  current.count += 1;
  if (current.count <= policy.limit) return { allowed: true };

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
  };
}
