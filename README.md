# Jake’s 3D Print Shop

A private test storefront for small-batch 3D prints. Products and prices are managed in Stripe; the site provides the catalog, variants, persistent cart, U.S. shipping, prepaid local pickup, and Stripe-hosted Checkout.

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
4. Seed or refresh the six demo products:

```bash
npm run stripe:seed
```

The seeder is idempotent and refuses live keys. It creates Stripe Products and one-time USD Prices with the metadata contract the storefront expects.

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
- `featured`, `pickup`, `ship`, `demo`
- `stock_status`: `in_stock`, `made_to_order`, or `sold_out`
- `accent`: `clay`, `ocean`, `graphite`, `moss`, `rose`, or `yellow`

Use one-time USD Prices for size variants. Price metadata supports `size_label` and `variant_key`; `lookup_key` is used as the stable SKU.

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
