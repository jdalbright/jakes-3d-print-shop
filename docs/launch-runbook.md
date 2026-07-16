# Public launch runbook

The storefront stays restricted and in Stripe test mode until every launch gate
below is complete. The public URL is
`https://jakes-3d-print-shop.jakealbright.chatgpt.site`.

## Required gates

- Confirm North Carolina sales-tax registration and any required assumed-name
  filing. Add the active registration and physical-goods tax treatment in both
  Stripe test and live mode.
- Confirm the Stripe account support email, branding, statement descriptor,
  receipt emails, payout account, and refund permissions.
- Keep the SabreDesign commercial membership active and retain the supporting
  evidence.
- Run `npm run verify` and `npm audit --audit-level=high` from a clean checkout.
- Confirm `/api/health` reports ready in the restricted deployment.

## Catalog and payment activation

1. Audit the test catalog using the deployed HTTPS `SITE_URL`:
   `npm run stripe:seed:dry-run`.
   Confirm all products use `txcd_99999999` (General - Tangible Goods) and all
   Prices use tax-exclusive behavior. Keep automatic tax disabled until the
   North Carolina registration is active.
2. Put the live Stripe key and deployed `SITE_URL` in ignored
   `.env.live.local`, then run `npm run stripe:live:audit`.
3. Review every reported change. Apply only with:
   `npm run stripe:live:sync -- --confirm-live-catalog=UPDATE_LIVE_STRIPE_CATALOG`.
4. Create the live webhook endpoint at `/api/stripe/webhook` for
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   and `checkout.session.async_payment_failed`.
5. Store the live key and webhook signing secret in Sites. Set
   `STRIPE_AUTOMATIC_TAX=true` only after the registration is active, then set
   `STORE_LIVE_MODE=true`.
6. Deploy while access remains restricted. Run the live catalog audit again and
   confirm `/api/health` is ready.

Never paste live keys into source, commits, commands recorded in documentation,
or chat. Keep them in Stripe, ignored local environment files, and Sites secrets.

## Restricted live check

- Buy the lowest-priced public product using pickup.
- Confirm the Stripe receipt, order-success page, verified webhook delivery,
  redacted application logs, and order metadata.
- Refund the payment to the original method and confirm the refund receipt.
- Check shipping and pickup Checkout sessions in test mode, including tax,
  cancellation, invalid cart changes, and async payment events.

After those checks pass, change Sites access from the current allowlist to
public and repeat an anonymous home, product, cart, policy, robots, sitemap,
health, and Checkout smoke test.

## Monitoring and rollback

Watch 5xx responses, Checkout 409/429/503 rates, catalog-unavailable logs,
webhook delivery failures, and Stripe payment/refund activity during the first
day.

If payment correctness, tax, catalog integrity, or security fails:

1. Return Sites access to the restricted allowlist.
2. Set `STORE_LIVE_MODE=false` and confirm Checkout is unavailable.
3. Redeploy the last known-good saved Sites version when code rollback is
   required.
4. Deactivate only the affected live Stripe Prices or Products; do not delete
   payment records.
5. Verify `/api/health`, the catalog, and logs before reopening access.
