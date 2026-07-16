# Repository Guidelines

## Project Structure & Module Organization

This is a Next/Vinext storefront deployed with a Cloudflare Worker. Put routes and page layouts in `app/`, and server endpoints in `app/api/`. Keep reusable React UI in `app/components/` and catalog, Stripe, and configuration helpers in `app/lib/`. Static product imagery belongs in `public/products/`. The Worker entry point is `worker/index.ts`; SQLite schema and Drizzle migrations live in `db/` and `drizzle/`. Put one-off scripts in `scripts/` and tests in `tests/`.

## Build, Test, and Development Commands

Use Node.js 22.13 or later; install dependencies with `npm install`.

- `npm run dev` — start the local Vinext development server.
- `npm run build` — produce the Worker and server output in `dist/`.
- `npm run start` — run the built application locally.
- `npm run lint` — run the Next.js ESLint configuration.
- `npm test` — build first, then run the Node test suite.
- `npm run stripe:seed` — seed the Stripe **test** catalog using `.env.local`.
- `npm run db:generate` — generate Drizzle migration files after schema changes.

## Coding Style & Naming Conventions

Write strict TypeScript and React with two-space indentation, double quotes, semicolons, and trailing commas where surrounding code does. ESLint is the source of truth; run `npm run lint` before submitting. Use PascalCase for React component files (`ProductGallery.tsx`), camelCase for functions and variables, and App Router conventions such as `page.tsx` and `route.ts`. Keep server-only Stripe and environment access in `app/lib/` or API routes; never expose secrets to client components. Prefer the existing CSS classes in `app/globals.css` over a second styling system.

## Testing Guidelines

Tests use Node's built-in `node:test` runner in `tests/rendered-html.test.mjs`. Add behavior-focused tests with names such as `test("checkout rejects inactive prices", ...)`. Cover customer-facing pages with rendered HTML assertions and security-sensitive paths with focused source or response checks. Run `npm test` after route, rendering, or configuration changes.

## Commit & Pull Request Guidelines

Recent commits use concise imperative subjects, such as `Add Japandi paper towel holder`. Keep each commit focused on a user-visible change. Pull requests should summarize scope, list validation run, link related issues when available, and include screenshots for visual storefront changes. Never commit `.env.local`, Stripe keys, or webhook secrets; copy `.env.example` for local setup and use test-mode credentials unless a live launch is explicitly approved.

## Store and Fulfillment Context

Jake operates this project in Raleigh, North Carolina (ZIP 27607). The public storefront supports U.S. shipping and local pickup. The unlisted `/office` route is a mobile-first NFC pilot for coworkers; never include an employer name, workplace address, or employee identity. Office orders are single-item, prepaid pickup/work delivery orders with receipt email only—no shipping charge, shipping address, or phone collection. Keep the site and Stripe account in test mode until the documented launch requirements are met.

The office assortment should be useful, polished, and appropriate for a cubicle-style workplace. Avoid generic novelty prints. The keychain rack is an honor-system, take-now offer; made-to-order office products should normally promise delivery at work in 3–5 business days. Keep add-ons understated and limit each product to three to five purposeful colors instead of exposing the complete filament palette.

## Production Hardware

- Owned printer: **Bambu Lab X2D**. This was confirmed by Jake on 2026-07-15.
- Do not infer owned hardware from the currently selected Bambu Studio profile. The local configuration has previously shown P2S and A1 profiles; these are slicer settings, not the source of truth for ownership.
- The X2D uses a mechanically switched dual-nozzle system. Its official print areas are 256 × 256 × 260 mm for the main/left nozzle, 235.5 × 256 × 256 mm for the auxiliary/right nozzle, and 235.5 × 256 × 256 mm where both nozzles must reach the same model. Never approve a model from its nominal dimensions alone; slice it in the correct X2D single- or dual-nozzle mode first.
- The installed nozzle sizes and AMS configuration are not yet documented. Treat single-color production as the safe default. Before relying on multiple colors, soluble/breakaway support, or a non-0.4 mm nozzle, confirm the physical configuration and the active X2D profile in Bambu Studio.
- The X2D supports a 300°C nozzle and a chamber heated to 65°C. PLA Basic and PLA Matte remain the default storefront materials unless a product has a documented reason to use another filament.
- Official hardware reference: [Bambu Lab X2D announcement and specifications](https://blog.bambulab.com/xcellence-made-simple-bambu-lab-presents-the-x2d/).

For every candidate product, save the final X2D slice data: nozzle mode, layer height, plate count, print time, filament grams, supports, purge/waste, hardware, and assembled dimensions. Prefer one-plate, support-free or low-support models. Price from the final slice, not the creator's estimate: `material grams × landed cost per gram`, plus at least 10% scrap, payment fees, license allocation, hands-on labor, hardware, and a failure allowance.

## Filament Palette

The following Bambu PLA Matte colors are confirmed on-hand inventory as of 2026-07-15. Product codes are the Bambu product/color codes printed for each exact shade, not display hex values.

| Confirmed Bambu PLA Matte color | Product code |
|---|---|
| Matte Ivory White | 11100 |
| Matte Lemon Yellow | 11400 |
| Matte Mandarin Orange | 11300 |
| Matte Sakura Pink | 11201 |
| Matte Lilac Purple | 11700 |
| Matte Apple Green | 11502 |
| Matte Grass Green | 11500 |
| Matte Dark Green | 11501 |
| Matte Sky Blue | 11603 |
| Matte Marine Blue | 11600 |
| Matte Dark Blue | 11602 |
| Matte Desert Tan | 11401 |
| Matte Latte Brown | 11800 |
| Matte Caramel | 11803 |
| Matte Terracotta | 11203 |
| Matte Dark Brown | 11801 |
| Matte Ash Gray | 11102 |
| Matte Charcoal | 11101 |

The broader list below is an **available ordering palette**, not confirmed on-hand inventory unless the exact color and code also appear in the confirmed list above. Before publishing any other color, verify that the exact spool is owned or can be replenished. Generic labels are not production specifications: record the exact Bambu family, official color name, product code, and display hex in the product record. Bambu PLA Matte is the preferred default for design-forward office goods because its subdued finish reduces visible layer lines; use PLA Basic when a brighter color or smoother everyday finish is intentional.

| Jake's available label | Bambu PLA Basic match | Bambu PLA Matte match | Status |
|---|---|---|---|
| Black | Black (10101) | Charcoal `#000000` | Both |
| White | Jade White (10100) | Ivory White `#FFFFFF` | Both |
| Silver / Light Grey | Silver `#A6A9AA`; Light Gray (10104) | Ash Grey `#9B9EA0`; Nardo Gray (11104) | Ambiguous—confirm exact spool |
| Dark Grey | Dark Gray (10105) | Nardo Gray (11104) or Charcoal | Ambiguous—confirm exact spool |
| Gold | Gold `#E4BD68` | — | Basic only |
| Brown | Brown `#9D432C` | Dark Brown `#7D6556`; Latte Brown `#D3B7A7` | Ambiguous—confirm shade |
| Red | Red (10200) | Scarlet Red `#DE4343` | Both |
| Dark Red / Burgundy | Maroon Red (10205) | Dark Red `#BB3D43` | Both |
| Orange | Orange `#FF6A13` | Mandarin Orange `#F99963` | Both |
| Yellow | Yellow `#F4EE2A` | Lemon Yellow `#FFE17F` | Both |
| Hot Pink / Magenta | Magenta `#EC008C`; Hot Pink (10204) | — | Basic only |
| Light Pink | Pink `#F55A74` | Sakura Pink `#E4BDD0` | Ambiguous—confirm shade |
| Dark Blue | Cobalt Blue (10604) | Dark Blue `#042F56` | Both |
| Standard Blue | Blue (10600) | Marine Blue (11600) | Both |
| Cyan / Light Blue | Cyan `#0086D6` | Ice Blue `#8BD5EE`; Sky Blue (11603) | Ambiguous—confirm shade |
| Dark Green / Forest Green | Mistletoe Green `#3F8E43` | Dark Green `#68724D` | Both |
| Standard Green | Bambu Green `#00AE42` | Grass Green `#61C680` | Both |
| Lime Green | Bright Green (10503) | Apple Green (11502) | Both |
| Teal / Turquoise | Turquoise (10605) | No exact verified match | Basic only / Matte unclear |
| Purple | Purple `#5E43B7` | Plum (11204) | Approximate—confirm shade |
| Lavender / Light Purple | — | Lilac Purple `#AE96D4` | Matte only |

Numbers in parentheses are Bambu color/product codes, not hex values. Display hexes are references for the website; the physical spool is authoritative. Keep the Stripe `colors` and `color_hexes` pipe-separated lists in the same order, and set `material` to the exact family such as `Bambu PLA Matte` or `Bambu PLA Basic`. Do not use positional CSS swatches.

Default office palette: Matte Charcoal, Matte Ash Gray, Matte Ivory White, Matte Dark Green, and Matte Dark Blue. A product may replace one neutral with a deliberate accent such as Dark Red or Matte Mandarin Orange, but it should still expose no more than five choices. Official references: [Bambu PLA Basic](https://us.store.bambulab.com/en/products/pla-basic-filament) and [Bambu PLA Matte](https://eu.store.bambulab.com/products/pla-matte/).

Both filament families are 1.75 mm and compatible with Bambu's material systems. Bambu recommends drying at 50°C for eight hours before use for the most consistent finish and storing the filament dry afterward. Recheck the current manufacturer guidance before changing production procedures.

## Product Rights and Production Records

MakerWorld availability does not grant commercial rights. **SabreDesign Maker** is an exception: Jake has confirmed an active commercial license for all of its models, and those models do not require additional license, attribution, creator-photo-rights, or per-model evidence checks before storefront availability. For every other maker, commercial and image-use rights must be verified and recorded before a listing becomes purchasable.

The unlicensed Meyui modular organizer has been dropped and must not be reactivated without a newly verified license. Product-source research is still evolving, so do not treat a research shortlist as launch approval. Recheck subscription prices and terms at purchase time; recurring rights normally end when the subscription ends unless the creator states otherwise in writing.

Before adding a real product to Stripe, record:

- Creator and model name, plus the MakerWorld URL/model ID when available. For non-SabreDesign Maker products, include license evidence, creator image-use rights, and required attribution.
- X2D slice profile, print time, material grams, purge/waste, supports, plate count, hardware, dimensions, and QA notes.
- Exact filament family, official color names, display hexes, and whether each spool is stocked.
- Proposed price, landed material cost, fee/labor/license assumptions, fulfillment method, and lead time.
- Stripe Product metadata, including visibility, fulfillment eligibility, stock/license status, material, ordered `colors`, and ordered `color_hexes`.

Keep office-only products isolated with `visibility=office`. Never submit office prices through the public checkout path or public prices through the `office_nfc` channel. Unlicensed, inactive, recurring, non-USD, sold-out, wrong-channel, mixed-item, or shipping-based office requests must remain server-rejected.
