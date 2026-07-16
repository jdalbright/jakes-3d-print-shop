# Public release record template

Copy this file to a dated release record before each public-launch attempt. Store
identifiers, status, timestamps, and links only. Never record keys, webhook
signing secrets, customer details, or payment-method data.

## Release identity

- Release date/time (ET):
- Operator:
- Outcome: `restricted` / `public` / `rolled back`
- Public URL: `https://jakes-3d-print-shop.jakealbright.chatgpt.site`
- Git commit SHA and branch:
- Clean checkout confirmed:
- CI run URL and result:
- Local evidence: `npm run verify`, `npm run security:secrets`, and
  `npm audit --audit-level=high` results:

## Sites deployment

- Sites project ID:
- Saved version number and version ID:
- Deployment ID:
- Deployed commit SHA:
- Previous known-good version number and version ID:
- Access before deployment (mode and allowlist counts):
- Access after deployment (mode and allowlist counts):
- Deployment log or screenshot reference:

## Environment evidence

Record values only for non-secret settings. For secret settings, record
`configured` or `missing`.

| Setting | Recorded state |
| --- | --- |
| `SITE_URL` | |
| `CONTACT_EMAIL` | |
| `STORE_LIVE_MODE` | |
| `STRIPE_AUTOMATIC_TAX` | |
| `STRIPE_SECRET_KEY` | `configured` / `missing`; derived mode only: `test` / `live` |
| `STRIPE_WEBHOOK_SECRET` | `configured` / `missing` |

## Stripe evidence

- Stripe account and mode verified:
- Catalog manifest version:
- Catalog audit command, timestamp, and result:
- Catalog sync command, timestamp, and result, if applied:
- Expected/active public Product and Price counts:
- Expected/active office Product and Price counts:
- North Carolina Tax registration status:
- Physical-goods tax code and tax behavior:
- Webhook endpoint status, pinned API version, and required events:
- Successful signed webhook delivery timestamp and 2xx result:
- Restricted purchase PaymentIntent reference (last 8 characters only), receipt
  result, and success-page result (no customer data):
- Refund reference (last 8 characters only) and result:

## Health and smoke evidence

- `/api/health` timestamp, HTTP status, `ready`, `mode`, and dependency flags:
- Health response `Cache-Control` and security-header result:
- Restricted checkout smoke result:
- Anonymous public home/product/cart/policy/robots/sitemap/health smoke result:
- Monitoring checked (5xx, checkout errors, webhook deliveries, payments):

## Rollback evidence

- Rollback owner and decision threshold:
- Restricted-access switch verified:
- `STORE_LIVE_MODE=false` deployment/version verified:
- Known-good Sites version and deployment selected:
- Affected Stripe Prices or Products deactivated, if required:
- Post-rollback `/api/health`, catalog, and log result:
- Reopening decision and approver:
