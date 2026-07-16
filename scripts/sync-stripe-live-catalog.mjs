import {
  auditStripeCatalog,
  createStripeCatalogClient,
  formatSyncSummary,
  requireHttpsSiteUrl,
  requireStripeKey,
  syncStripeCatalog,
} from "./stripe-catalog-sync.mjs";

const liveConfirmation = "UPDATE_LIVE_STRIPE_CATALOG";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run") || !apply;
const confirmation = args.find((arg) => arg.startsWith("--confirm-live-catalog="))
  ?.slice("--confirm-live-catalog=".length);
const knownArgs = args.every(
  (arg) => arg === "--apply" || arg === "--dry-run" || arg.startsWith("--confirm-live-catalog="),
);

if (!knownArgs || (apply && args.includes("--dry-run"))) {
  throw new Error(
    "Usage: sync-stripe-live-catalog.mjs [--dry-run] or --apply --confirm-live-catalog=UPDATE_LIVE_STRIPE_CATALOG",
  );
}
if (apply && confirmation !== liveConfirmation) {
  throw new Error(
    "Live sync refused. Pass --apply --confirm-live-catalog=UPDATE_LIVE_STRIPE_CATALOG to explicitly authorize live Stripe changes.",
  );
}
if (!apply && confirmation) {
  throw new Error("The live confirmation flag is only valid together with --apply.");
}

const secretKey = requireStripeKey("live");
const siteUrl = requireHttpsSiteUrl();
const stripe = createStripeCatalogClient(secretKey);

if (dryRun) {
  const audit = await auditStripeCatalog(stripe, { siteUrl, strictStorefront: true });
  if (audit.ready) {
    console.log("Stripe live catalog audit passed; no changes are required.");
  } else {
    console.log(`Stripe live catalog dry run found ${audit.issues.length} change(s):`);
    for (const issue of audit.issues) console.log(`- ${issue}`);
    process.exitCode = 2;
  }
} else {
  const summary = await syncStripeCatalog(stripe, {
    siteUrl,
    expectedMode: "live",
    strictStorefront: true,
  });
  console.log(formatSyncSummary("Stripe live catalog synced", summary));
  console.log("Run the live audit again after Stripe search indexing catches up.");
}
