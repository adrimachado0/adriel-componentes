@AGENTS.md

# Adriel Componentes — project conventions

Small store for used PC parts. No online payments: buyers build a cart and ask via WhatsApp.
A single admin (Adriel) manages products from `/admin`. Prefer simple, standard solutions.

## Environment: everything runs in Docker

Node is **not** installed on the host. Every npm/next/vitest command runs inside the dev container
(`compose.yaml` + `Dockerfile.dev`, Node 24, project bind-mounted at `/app`, user `node`).
Claude Code runs on Windows against the WSL path, so wrap commands like this (Git Bash):

```bash
MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu-26.04 --cd /home/adriel/projects/adriel-componentes -- \
  bash -lc 'docker compose run --rm -T app npm run check'
```

- Dev server: `docker compose up` → http://localhost:3000
- One-off: `docker compose run --rm app npm <script>`
- Run git from WSL (`wsl.exe … -- git …`), not Windows git, so line endings and file modes stay Linux.

Scripts: `lint`, `typecheck`, `test`, `build`, `format`, and `check` (lint + typecheck + test + build).
**Before calling a step done, `npm run check` must pass.**

## Stack

- Next.js 16 App Router, `src/`, TypeScript strict (no `any`). Request interception lives in `src/proxy.ts`
  (Next 16 name for middleware). Read `node_modules/next/dist/docs/` before using an API you are unsure about.
- `cacheComponents` + `partialPrefetching` are on. Public reads use `'use cache'` + `cacheLife` + `cacheTag('products')`
  with the cookie-less Supabase client; mutations call `revalidateTag`/`updateTag` and `revalidatePath`.
  Anything reading cookies/searchParams goes inside `<Suspense>`.
- React Server Components by default. `"use client"` only for: cart, gallery, admin form, dialogs, toasts.
- Tailwind v4. Design tokens are defined **once** in `src/app/globals.css` (`@theme`). Use the token utilities
  (`bg-primary`, `text-muted`, `rounded-card`, `shadow-card`, `container-page`, `bg-hero`, `bg-photo`, `skeleton`…).
  No loose hex colors in components.
- Supabase: `@supabase/supabase-js` + `@supabase/ssr`. Separate clients in `src/lib/supabase/`
  (server with cookies, browser, public cookie-less for cached reads). Anon key only — **never** the service_role key.
- Data access in `src/lib/data/*` with `import 'server-only'`.
- Validation with zod; the same schema is used on client and server. Mutations = Server Actions + `useActionState`.
  Every Server Action re-checks the session (`supabase.auth.getUser()`), in addition to RLS.
- Animations: `motion/react`, 150–300 ms, ease-out, always honor `useReducedMotion`. Nothing decorative.
- Icons: `lucide-react`. WhatsApp icon is a custom SVG copied from the design files.
- Prices: integers in ARS, formatted with `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })`.
- Tests: Vitest for utilities (`src/**/*.test.ts`).

## Language

- Code (identifiers, components, tables, comments) in **English**.
- UI copy in **Rioplatense Spanish** (vos: "Elegí", "Consultá"), matching the designs. `<html lang="es-AR">`.

## Design

`design/*.dc.html` is the visual source of truth. Ignore tool tags (`<x-dc>`, `<sc-for>`, `<sc-if>`,
`<dc-import>`, `{{…}}`, `support.js`); sample data lives in the trailing `<script type="text/x-dc">`.
`{{accent}}` = `#1F5BEF`. Reproduce faithfully; do not restyle. Product illustrations (`ProductArt`) are
photo placeholders: real photos are shown, or a generic image icon on the light-blue gradient.

Touch targets ≥ 44px; inputs use 16px text on mobile. Semantic elements, `aria-label` on icon-only buttons,
visible focus, AA contrast, keyboard support in cart/dialogs/gallery.

## Data

- Table `public.products` (see `supabase/migrations/`). `images` stores Storage **paths** (bucket `product-images`), `[0]` = cover.
- RLS: public `select`; `insert/update/delete` only for `authenticated` (sign-ups disabled → only the admin).
- Types generated into `src/types/database.ts` (do not edit by hand).

## Skills to use

- `vercel-react-best-practices` / `vercel-composition-patterns` when writing components and data fetching.
- `web-design-guidelines` + `frontend-design` when building UI.
- `security-guidance` on anything touching auth, data or uploads.
- `supabase` / `supabase-postgres-best-practices` for schema, RLS and Storage.

## Git

Small, descriptive commits per step (English, imperative).
