import { NextResponse } from "next/server";
import {
  checkRateLimit,
  hasOnlyKeys,
  hasTrustedBrowserOrigin,
  isStrictObject,
  readJsonBody,
} from "../../lib/request-security";

export const dynamic = "force-dynamic";

const eventNames = new Set([
  "product_view",
  "add_to_cart",
  "checkout_start",
  "checkout_redirect",
  "office_page_view",
  "office_product_select",
]);
const safeSlug = /^[a-z0-9][a-z0-9-]{0,99}$/;
const safeSku = /^[a-zA-Z0-9][a-zA-Z0-9_/-]{0,79}$/;
const eventKeys = new Set(["eventName", "productSlug", "variantSku", "fulfillment", "itemCount", "salesChannel"]);
const eventBodyLimit = 2_048;

type EventBody = {
  eventName: string;
  productSlug?: string;
  variantSku?: string;
  fulfillment?: "shipping" | "pickup";
  itemCount?: number;
  salesChannel?: "office_nfc";
};

function eventJson(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        ...headers,
      },
    },
  );
}

function parseEventBody(value: unknown): EventBody | null {
  if (!isStrictObject(value) || !hasOnlyKeys(value, eventKeys)) return null;
  if (typeof value.eventName !== "string" || !eventNames.has(value.eventName)) return null;
  if (value.productSlug !== undefined && (typeof value.productSlug !== "string" || !safeSlug.test(value.productSlug))) {
    return null;
  }
  if (value.variantSku !== undefined && (typeof value.variantSku !== "string" || !safeSku.test(value.variantSku))) {
    return null;
  }
  if (value.fulfillment !== undefined && value.fulfillment !== "shipping" && value.fulfillment !== "pickup") {
    return null;
  }
  if (
    value.itemCount !== undefined
    && (typeof value.itemCount !== "number" || !Number.isInteger(value.itemCount) || value.itemCount < 1 || value.itemCount > 200)
  ) {
    return null;
  }
  if (value.salesChannel !== undefined && value.salesChannel !== "office_nfc") return null;

  return {
    eventName: value.eventName,
    ...(value.productSlug !== undefined ? { productSlug: value.productSlug } : {}),
    ...(value.variantSku !== undefined ? { variantSku: value.variantSku } : {}),
    ...(value.fulfillment !== undefined ? { fulfillment: value.fulfillment } : {}),
    ...(value.itemCount !== undefined ? { itemCount: value.itemCount } : {}),
    ...(value.salesChannel !== undefined ? { salesChannel: value.salesChannel } : {}),
  };
}

export async function POST(request: Request) {
  if (!hasTrustedBrowserOrigin(request)) {
    return eventJson("Invalid event origin.", 403);
  }

  const rateLimit = checkRateLimit(request, { scope: "store-events", limit: 120, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return eventJson("Too many event requests.", 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  const parsedBody = await readJsonBody(request, eventBodyLimit);
  if (!parsedBody.ok) {
    return parsedBody.reason === "too_large"
      ? eventJson("Event payload is too large.", 413)
      : eventJson("Invalid event payload.", 400);
  }

  const body = parseEventBody(parsedBody.value);
  if (!body) {
    return eventJson("Invalid event payload.", 400);
  }

  console.info("storefront_event", {
    eventName: body.eventName,
    ...(body.productSlug ? { productSlug: body.productSlug } : {}),
    ...(body.variantSku ? { variantSku: body.variantSku } : {}),
    ...(body.fulfillment ? { fulfillment: body.fulfillment } : {}),
    ...(body.itemCount ? { itemCount: body.itemCount } : {}),
    ...(body.salesChannel ? { salesChannel: body.salesChannel } : {}),
  });

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "private, no-store" },
  });
}
