/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type ConfirmationRateBucket = { count: number; resetAt: number };
const confirmationRateBuckets = new Map<string, ConfirmationRateBucket>();
const confirmationRateLimit = 30;
const confirmationRateWindowMs = 60_000;
const maxConfirmationRateBuckets = 2_000;
let confirmationRateChecks = 0;

function checkConfirmationRateLimit(request: Request) {
  const clientIp = request.headers.get("cf-connecting-ip")?.trim();
  if (!clientIp || clientIp.length > 64) return { allowed: true } as const;

  const now = Date.now();
  confirmationRateChecks += 1;
  if (confirmationRateChecks % 128 === 0 || confirmationRateBuckets.size >= maxConfirmationRateBuckets) {
    for (const [key, bucket] of confirmationRateBuckets) {
      if (bucket.resetAt <= now) confirmationRateBuckets.delete(key);
    }
    while (confirmationRateBuckets.size >= maxConfirmationRateBuckets) {
      const oldestKey = confirmationRateBuckets.keys().next().value as string | undefined;
      if (!oldestKey) break;
      confirmationRateBuckets.delete(oldestKey);
    }
  }

  const bucket = confirmationRateBuckets.get(clientIp);
  if (!bucket || bucket.resetAt <= now) {
    confirmationRateBuckets.set(clientIp, { count: 1, resetAt: now + confirmationRateWindowMs });
    return { allowed: true } as const;
  }

  bucket.count += 1;
  if (bucket.count <= confirmationRateLimit) return { allowed: true } as const;
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
  } as const;
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

function secureResponse(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", contentSecurityPolicy);
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), browsing-topics=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  if (new URL(request.url).protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/api/") || pathname === "/order/success") {
    headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  if (pathname === "/order/success") {
    headers.set("Referrer-Policy", "no-referrer");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/order/success") {
      const rateLimit = checkConfirmationRateLimit(request);
      if (!rateLimit.allowed) {
        return secureResponse(request, new Response("Too many order lookups. Please wait and try again.", {
          status: 429,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }));
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return secureResponse(request, response);
    }

    return secureResponse(request, await handler.fetch(request, env, ctx));
  },
};

export default worker;
