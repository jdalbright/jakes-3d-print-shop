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
  `verify` includes the deterministic tracked-file secret scan used by CI.
- Confirm `/api/health` reports ready in the restricted deployment.
- Copy [`release-record-template.md`](release-record-template.md) to a dated
  release record and attach evidence as each remaining gate is completed.

### Sites access and Stripe webhooks

Sites applies its `custom` access gate before the Worker receives a request.
Stripe cannot add the `OAI-Sites-Authorization` owner-bypass header, so a Stripe
webhook sent to the final domain is rejected while access remains restricted.
Do not count a restricted final-domain webhook test as completed unless Sites
adds a verified path-level exception or a separate public webhook ingress is in
place.

The default cutover is therefore a short, owner-approved public validation
window: finish every other gate while restricted, verify fail-closed health with
the owner bypass, switch access to public, immediately complete the controlled
purchase/webhook/receipt/refund test, and remain public only if it passes. Keep
the restricted-access rollback and `STORE_LIVE_MODE=false` action ready before
opening that window. A separate public webhook proxy is the alternative when a
pre-public real-payment test is mandatory.

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
   and `checkout.session.async_payment_failed`. Pin it to Stripe API version
   `2026-02-25.clover`, matching `stripeApiVersion` in `app/lib/stripe.ts`; do
   not inherit the account default. An endpoint created with another version
   must be replaced rather than edited in place. Keep the old endpoint enabled
   until the replacement has returned 2xx for a signed delivery.
5. Store the live key and webhook signing secret in Sites. Set
   `STRIPE_AUTOMATIC_TAX=true` only after the registration is active, then set
   `STORE_LIVE_MODE=true`.
6. Deploy while access remains restricted. Run the live catalog audit again and
   confirm `/api/health` is ready.

Never paste live keys into source, commits, commands recorded in documentation,
or chat. Keep them in Stripe, ignored local environment files, and Sites secrets.

## Final live check

- While restricted, verify live catalog and tax readiness through the owner
  bypass, but do not expect Stripe to reach the final-domain webhook.
- After the approved public cutover, buy the lowest-priced public product using
  pickup immediately.
- Confirm the Stripe receipt, order-success page, verified webhook delivery,
  endpoint API version, redacted application logs, and order metadata.
- Refund the payment to the original method and confirm the refund receipt.
- Check shipping and pickup Checkout sessions in test mode, including tax,
  cancellation, invalid cart changes, and async payment events.

Repeat an anonymous home, product, cart, policy, robots, sitemap, health, and
Checkout smoke test during that same validation window. If any check fails,
return Sites to the restricted allowlist immediately and disable live mode.

## Monitoring and rollback

Watch 5xx responses, Checkout 409/429/503 rates, catalog-unavailable logs,
webhook delivery failures, and Stripe payment/refund activity during the first
day.

After the public smoke test passes, set the GitHub Actions repository variable
`PUBLIC_MONITOR_ENABLED=true` and manually run the **Production Monitor**
workflow once. It then checks live readiness, security headers, `robots.txt`,
and the sitemap every 15 minutes. Confirm GitHub Actions failure notifications
reach the launch owner. This is a baseline availability alert; Stripe Dashboard
webhook-failure notifications and Sites 5xx/log alerts must also be enabled and
test-fired because the public monitor does not inspect private payment data or
create Checkout Sessions.

If payment correctness, tax, catalog integrity, or security fails:

1. Return Sites access to the restricted allowlist.
2. Set `STORE_LIVE_MODE=false` and confirm Checkout is unavailable.
3. Redeploy the last known-good saved Sites version when code rollback is
   required.
4. Deactivate only the affected live Stripe Prices or Products; do not delete
   payment records.
5. Verify `/api/health`, the catalog, and logs before reopening access.
