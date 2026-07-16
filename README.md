# Jake’s 3D Print Shop

A private test storefront for design-led desk and home objects made in Raleigh. Products and prices are managed in Stripe; the site provides the catalog, variants, persistent cart, $12 flat-rate U.S. shipping, prepaid Raleigh pickup, and Stripe-hosted Checkout.

## Local development

```bash
npm install
npm run dev
```

The site works without Stripe credentials using a read-only demo catalog. Checkout stays paused.

## Enable Stripe test checkout

1. Copy `.env.example` to `.env.local`.
2. Add a Stripe **test-mode** secret key as `STRIPE_SECRET_KEY`.
3. Keep `STORE_LIVE_MODE=false`.
4. Seed or refresh the private test catalog:

```bash
npm run stripe:seed
```

The seeder is idempotent and refuses live keys. It creates Stripe Products and one-time USD Prices with the metadata contract the storefront expects. When a price amount changes, it transfers the stable lookup key to a replacement Price and archives the old Price.

## Stripe webhook

The shop accepts signed Stripe events at `/api/stripe/webhook`. Configure the endpoint to send:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Copy the endpoint signing secret into `STRIPE_WEBHOOK_SECRET`. Use the Stripe CLI signing secret for local forwarding and the Dashboard endpoint signing secret for the hosted site; they are different secrets.

The webhook records payment state without logging customer names, email addresses, phone numbers, or shipping addresses. Fulfillment remains managed manually in Stripe Dashboard for v1.

## Stripe catalog metadata

Active products appear only when `storefront=true`. Supported Product metadata:

- `shop_slug`, `category`, `colors` (pipe- or comma-separated)
- `color_hexes` (pipe-separated six-digit hex values aligned with `colors`)
- `featured`, `pickup`, `ship`, `demo`
- `visibility`: `public` (the default) or `office`
- `office_fulfillment`: `take_now` or `work_delivery` for office-only listings
- `photo_status`: set to `ready` only after authorized original listing photographs have been added
- `stock_status`: `in_stock`, `made_to_order`, or `sold_out`
- `license_status`: `pending`, `active`, `expired`, or `not_required`; set to `active` only while the relevant commercial permission is current
- `accent`: `clay`, `ocean`, `graphite`, `moss`, `rose`, or `yellow`
- `detail_copy`, `highlights` (pipe-separated), `fit_note`, `material`, `finish`, `care`, and `lead_time`

Use Stripe Product images for the product gallery; the first image is the catalog-card image. Use one-time USD Prices for size variants. Price metadata supports `size_label`, `variant_key`, `dimensions`, `min_quantity`, and `max_quantity`; `lookup_key` is used as the stable SKU. Quantity bounds are always enforced by the server before Checkout opens.

The unlisted `/office` route loads only `visibility=office` products (currently the keychain rack). Normal catalog routes exclude them. Office Checkout accepts one office product at a time, pickup fulfillment only, and records `sales_channel=office_nfc` plus the trusted `office_fulfillment` value in Stripe metadata. Public made-to-order products use the normal cart with U.S. shipping or Raleigh pickup.

### Commercial-license controls

Keep each licensed model as a physical FDM print only; never distribute its STL or derivative digital files. Follow the creator’s current rules for modification, attribution, casting, molding, mass production, and crowdfunding. Treat a maker-account remix or derivative as excluded unless its commercial permission is separately recorded. Before enabling a licensed product, save the exact membership or license evidence, confirm model coverage and media rights, add permitted original product photography, and set `license_status=active`. The storefront blocks its cart and Checkout until those conditions are true. If a membership ends or a maker revokes the right, set `license_status=expired` immediately and remove the listing from sale.

## Storefront measurement

The site records privacy-conscious `product_view`, `add_to_cart`, `checkout_start`, `checkout_redirect`, `office_page_view`, and `office_product_select` events in application logs. These events contain only product, variant, fulfillment, sales-channel, and item-count fields. Paid checkout outcomes continue to come from verified Stripe webhooks; names, contact details, and addresses are not copied into analytics logs.

## Safety and launch

- The server validates every Price and Product directly with Stripe; browser-provided amounts are ignored.
- A live Stripe key is rejected unless `STORE_LIVE_MODE=true` is also set.
- Webhook requests are rejected unless their raw request body has a valid Stripe signature.
- Do not enable live mode until real photos/listings, contact details, tax registrations, policies, and a full live checkout test are complete.
- Runtime secrets belong in Sites environment variables, never committed files.

## Checks

```bash
npm run lint
npm test
```
