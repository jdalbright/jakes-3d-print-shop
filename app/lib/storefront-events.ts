export type StorefrontEventName =
  | "product_view"
  | "add_to_cart"
  | "checkout_start"
  | "checkout_redirect"
  | "office_page_view"
  | "office_product_select";

type StorefrontEventDetails = {
  productSlug?: string;
  variantSku?: string;
  fulfillment?: "shipping" | "pickup";
  itemCount?: number;
  salesChannel?: "office_nfc";
};

export function trackStorefrontEvent(
  eventName: StorefrontEventName,
  details: StorefrontEventDetails = {},
) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({ eventName, ...details });
  try {
    if (navigator.sendBeacon?.("/api/store-events", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/store-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Store analytics must never interrupt shopping or checkout.
  }
}
