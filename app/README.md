# OmniPost AI — web app

Next.js implementation of the **OmniPost AI** design (`../design/OmniPost AI.dc.html`): a private,
single-user AI social media management and publishing platform.

This is the **frontend + mock-adapter phase** (Phases 2–3 of the brief). Every screen is navigable and
interactive; every external connection runs through a clearly labelled mock adapter. Nothing is actually
connected, imported or published, and the UI says so.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all routes are statically generated)
npm test           # unit tests (vitest)
npm run typecheck
```

## Screens

`/dashboard` `/studio` `/image` `/planner` `/calendar` `/posts` `/scheduled` `/published` `/drafts`
`/media` `/accounts` `/providers` `/integrations` `/automation` `/logs` `/analytics` `/settings` `/architecture`

The Integration Hub (`/integrations`) has eight tabs: AI Providers (guided connection wizard), MCP
Connections, Automation Platforms (n8n), REST API, Webhooks, File Imports (CSV/JSON parsed in the
browser, column mapping, validation, preview, import), Connected Apps, and Activity & Logs.

## Structure

```
src/app/                 Next.js App Router: layout, one static route per screen
src/components/          Shell (sidebar, top bar, mobile drawer), provider, screen switch
src/screens/             Screen components, ported 1:1 from the design template (generated)
src/lib/omnipost/        View-model logic ported from the design, and its state store
src/lib/adapters/        Typed contracts (AIProvider, SocialConnector, PublishingProvider),
                         registries and mock adapters
src/lib/ingest/          Zod schema for the universal content ingestion payload
src/lib/css.ts           Inline-declaration → React style helper used by the ported screens
tools/dc2tsx.mjs         Design template → TSX porting tool (`npm run port:design`)
tests/                   Unit tests
```

### How the design was ported

The design file is a declarative template (loops, conditionals, bindings, inline styles).
`tools/dc2tsx.mjs` converts it mechanically into the components in `src/screens/`, so dimensions,
colours and spacing are the design's own values rather than a re-interpretation. Re-run
`npm run port:design` if the design file changes. `Shell.tsx` started from the same output and is
maintained by hand.

Design tokens live as CSS variables in `src/app/globals.css` (light and `.om-dark`), and are exposed to
Tailwind in `tailwind.config.ts` for hand-written components.

## Known limits of this phase

- **No backend.** There is no database, auth, job queue, or real provider/social API call. Keys and
  tokens shown in the UI are generated in the browser for illustration and are labelled as mock.
- **View-model typing.** `src/lib/omnipost/logic.ts` is the design prototype's logic ported as-is and is
  excluded from type checking (`@ts-nocheck`); screens receive it as an untyped view model. The typed
  layer is `src/lib/adapters` and `src/lib/ingest`. Moving the sample data behind those adapters, screen
  by screen, is the next step toward the production backend.
- **Styling.** Ported screens keep the design's inline declarations; they are not yet Tailwind/shadcn
  components.
- **Responsive.** The design only specifies the desktop layout. Below 900px the sidebar becomes a drawer
  and fixed multi-column grids stack; wide tables and the month calendar scroll sideways.
- **Search (`⌘K`)** is a visual placeholder, as in the design.
