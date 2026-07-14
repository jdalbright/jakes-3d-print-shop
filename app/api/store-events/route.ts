import { NextResponse } from "next/server";

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

type EventBody = {
  eventName?: string;
  productSlug?: string;
  variantSku?: string;
  fulfillment?: string;
  itemCount?: number;
  salesChannel?: string;
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid event origin." }, { status: 403 });
  }

  if (Number(request.headers.get("content-length") || 0) > 2048) {
    return NextResponse.json({ error: "Event payload is too large." }, { status: 413 });
  }

  let body: EventBody;
  try {
    body = (await request.json()) as EventBody;
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  if (!body.eventName || !eventNames.has(body.eventName)) {
    return NextResponse.json({ error: "Invalid event name." }, { status: 400 });
  }
  if (body.productSlug !== undefined && !safeSlug.test(body.productSlug)) {
    return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  }
  if (body.variantSku !== undefined && !safeSku.test(body.variantSku)) {
    return NextResponse.json({ error: "Invalid variant." }, { status: 400 });
  }
  if (body.fulfillment !== undefined && body.fulfillment !== "shipping" && body.fulfillment !== "pickup") {
    return NextResponse.json({ error: "Invalid fulfillment method." }, { status: 400 });
  }
  if (body.itemCount !== undefined && (!Number.isInteger(body.itemCount) || body.itemCount < 1 || body.itemCount > 200)) {
    return NextResponse.json({ error: "Invalid item count." }, { status: 400 });
  }
  if (body.salesChannel !== undefined && body.salesChannel !== "office_nfc") {
    return NextResponse.json({ error: "Invalid sales channel." }, { status: 400 });
  }

  console.info("storefront_event", {
    eventName: body.eventName,
    ...(body.productSlug ? { productSlug: body.productSlug } : {}),
    ...(body.variantSku ? { variantSku: body.variantSku } : {}),
    ...(body.fulfillment ? { fulfillment: body.fulfillment } : {}),
    ...(body.itemCount ? { itemCount: body.itemCount } : {}),
    ...(body.salesChannel ? { salesChannel: body.salesChannel } : {}),
  });

  return new NextResponse(null, { status: 204 });
}
