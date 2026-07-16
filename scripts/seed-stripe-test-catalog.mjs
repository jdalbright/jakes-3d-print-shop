import {
  auditStripeCatalog,
  createStripeCatalogClient,
  formatSyncSummary,
  requireHttpsSiteUrl,
  requireStripeKey,
  syncStripeCatalog,
} from "./stripe-catalog-sync.mjs";

const args = new Set(process.argv.slice(2));
const allowedArgs = new Set(["--dry-run"]);
if ([...args].some((arg) => !allowedArgs.has(arg))) {
  throw new Error("Usage: seed-stripe-test-catalog.mjs [--dry-run]");
}

const secretKey = requireStripeKey("test");
const siteUrl = requireHttpsSiteUrl();
const stripe = createStripeCatalogClient(secretKey);

if (args.has("--dry-run")) {
  const audit = await auditStripeCatalog(stripe, { siteUrl, strictStorefront: false });
  if (audit.ready) {
    console.log("Stripe test catalog audit passed; no changes are required.");
  } else {
    console.log(`Stripe test catalog audit found ${audit.issues.length} change(s):`);
    for (const issue of audit.issues) console.log(`- ${issue}`);
    process.exitCode = 2;
  }
} else {
  const summary = await syncStripeCatalog(stripe, {
    siteUrl,
    expectedMode: "test",
    strictStorefront: false,
  });
  console.log(formatSyncSummary("Stripe test catalog ready", summary));
}
