# Dependency audit record

Reviewed: 2026-07-16

The launch dependency update removed all high and critical `npm audit`
findings. Eight moderate findings remain in two unreachable launch paths:

- The legacy `esbuild` advisory is pulled through the current `drizzle-kit`
  development CLI. The storefront has no active database schema or D1 binding,
  and this package is not present in the production Worker runtime. npm's
  proposed fix is a breaking downgrade, so it is deferred until Drizzle ships a
  compatible patched dependency chain.
- The PostCSS advisory is bundled under the current stable Next.js/Vinext
  dependency chain. The application does not accept or stringify customer CSS.
  npm's proposed fix incorrectly downgrades Next.js to version 9, so it is not
  safe to apply.

Review these findings after each direct dependency update and no later than
2026-08-16. Any new high or critical finding blocks deployment.
