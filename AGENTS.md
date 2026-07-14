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
