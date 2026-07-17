# Sandbox public-window release record

## Release identity

- Release date/time (ET): 2026-07-17 09:43–10:03 EDT
- Operator: Codex, with Jake's action-time approval
- Outcome: `restricted` after a successful sandbox purchase/refund window
- Public URL: `https://jakes-3d-print-shop.jakealbright.chatgpt.site`
- Git commit SHA and branch: `a0dddfe8f3891495cb9f9c01fa45c49a48a13bae`, `main`
- Clean checkout confirmed: yes, before the public window
- CI: [run 29522431801](https://github.com/jdalbright/jakes-3d-print-shop/actions/runs/29522431801), success
- Local evidence: `npm run verify` passed all 36 tests and the secret scan;
  `npm audit --audit-level=high` exited successfully with eight moderate findings
  and no high or critical findings.

## Sites deployment

- Sites project ID: `appgprj_6a541177627c8191a1416b786947a95a`
- Saved version: 23; version reference ending `aacae40a`
- Sandbox environment deployment reference ending `180b2206`: succeeded with
  environment revision 4
- Rollback environment deployment reference ending `53ed59ca`: succeeded with
  environment revision 5
- Deployed commit SHA: `a0dddfe8f3891495cb9f9c01fa45c49a48a13bae`
- Previous known-good version: 23
- Access before: `custom`, one allowed owner, zero groups
- Access during validation: `public`
- Access after rollback: `custom`, one allowed owner, zero groups
- Anonymous rollback check: home and `/api/health` both returned 401

## Environment evidence

| Setting | Recorded state |
| --- | --- |
| `SITE_URL` | `https://jakes-3d-print-shop.jakealbright.chatgpt.site` |
| `CONTACT_EMAIL` | `hello@jalbright.dev` |
| `STORE_LIVE_MODE` | `false` throughout |
| `STRIPE_AUTOMATIC_TAX` | temporarily `true` for the sandbox tax test; restored to `false` |
| `STRIPE_SECRET_KEY` | configured; test mode |
| `STRIPE_WEBHOOK_SECRET` | configured; replacement secret retained |

## Stripe evidence

- Stripe account and mode: test/sandbox; no real charge was possible
- Catalog manifest version: `2026-07-16.1`
- Catalog audit: `env SITE_URL=https://jakes-3d-print-shop.jakealbright.chatgpt.site npm run stripe:seed:dry-run`, 2026-07-17 10:02 EDT, passed with no changes required
- Active expected catalog: six public Products with seven Prices; one office
  Product with two Prices
- North Carolina Tax registration: active in sandbox
- Product tax code: `txcd_99999999`; automatic-tax calculation completed
- Webhook: exactly one enabled final-domain endpoint remains, reference ending
  `MVJU8Nin`, pinned to `2026-02-25.clover`, with the three required Checkout
  events. The superseded account-default endpoint ending `nq3rxAOe` is disabled.
- Checkout event: `checkout.session.completed`, 2026-07-17 09:48:37 EDT,
  event reference ending `TuISE44b`. Stripe reported one pending delivery because
  the superseded endpoint used the prior signing secret; the replacement was the
  only endpoint capable of accepting the event. Stripe's public API did not expose
  the individual HTTP response log, so an exact Dashboard 2xx was not recorded.
- Sandbox purchase: PaymentIntent reference ending `0v1lRBOx`; Checkout was
  complete and paid; subtotal 2,000 cents, NC tax 145 cents, total 2,145 cents;
  automatic tax complete; `storefront`, `pickup`, and Sandstone metadata verified;
  confirmation page showed `$21.45` and Raleigh pickup; hosted receipt available
- Refund: reference ending `0jgTqJTC`; succeeded for all 2,145 cents; Charge
  reference ending `0pK85yZI` showed fully refunded

## Health and smoke evidence

- Public-window `/api/health`: HTTP 200 with `ready=true`, `mode=test`,
  `keyMode=test`, `stripeConfigured=true`, `liveLaunchEnabled=false`, and all
  dependency flags true while automatic tax was enabled
- Health caching and headers: `Cache-Control: private, no-store, max-age=0` plus
  HSTS, CSP, Permissions Policy, Referrer Policy, nosniff, and frame denial
- Anonymous smoke: home 200; product selection, Sandstone colorway, quantity,
  cart, free Raleigh pickup, Stripe redirect, tax calculation, payment return,
  and confirmation all completed
- Post-window state: anonymous home and health 401; `STORE_LIVE_MODE=false`;
  automatic tax restored to `false`; test webhook secret retained
- Monitoring checked: Stripe payment, tax, receipt, Checkout event, endpoint set,
  refund, Sites deployment status, and anonymous access status

## Rollback evidence

- Rollback owner: Jake; threshold was any failed payment, tax, confirmation,
  refund, or replacement-webhook signal
- Restricted-access switch: verified at access-policy revision 3
- `STORE_LIVE_MODE=false`: verified after environment revision 5 deployment
- Known-good Sites version: 23
- Stripe Products and Prices deactivated: none required; all activity was test mode
- Post-rollback result: home and health returned 401 anonymously; catalog dry run
  passed; one pinned test webhook remains enabled
- Reopening decision: only after owner completion of the NC registration and the
  remaining live-account launch steps

## Post-test follow-up

- The success page exposed a cart-hydration race: storage cleanup ran, but the
  header could still show one item until reload. The local follow-up waits for cart
  hydration before removing purchased items. `npm run verify` passes all 36 tests;
  this fix must be committed, pushed, and deployed before the next public window.
