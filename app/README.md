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

## Backend (Supabase · OpenRouter · MCP)

Set the variables from [`.env.example`](.env.example) on the host. Each feature switches on when its
variables are present; without them the app stays in the open, mock-only prototype mode.

| Variable | Turns on |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Posts saved to Supabase (`/api/posts`), MCP tools |
| `OPENROUTER_API_KEY` (`OPENROUTER_MODEL` optional) | Real generation in the Content Studio and the `generate_platform_variations` tool |
| `OMNIPOST_ADMIN_PASSWORD`, `OMNIPOST_SECRET` (≥ 32 chars) | Dashboard login, and OAuth consent for MCP clients |
| `PUBLIC_BASE_URL` | Absolute URLs in OAuth metadata, e.g. `https://post.avonixai.com` |

**Database.** Run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) and then
[`002_api_tokens_and_publishing.sql`](supabase/migrations/002_api_tokens_and_publishing.sql) in Supabase → SQL Editor
(both are safe to run again). RLS is on with no policies, and the files grant the tables to `service_role` only,
so only the server can read or write. Supabase does not expose new tables to its Data API on its own any more:
without those grants every database call fails with "permission denied".

**Is it working?** `GET /api/v1/health` (public, no secrets) answers `{"ok":true,…}` when the database and
login are usable, and otherwise says what to fix: tables missing, access not granted, wrong key, Supabase
unreachable. The dashboard shows the same message in a red bar, and an MCP client that cannot be added gets it
in the OAuth error.

**MCP endpoint.** `POST {PUBLIC_BASE_URL}/mcp`, Streamable HTTP with JSON responses, stateless.
Clients sign in with OAuth 2.1 (dynamic client registration, PKCE S256, refresh-token rotation);
approving a client needs the owner password. Discovery: `/.well-known/oauth-protected-resource` and
`/.well-known/oauth-authorization-server`. Tools: `create_post_draft`, `schedule_post`, `list_posts`,
`generate_platform_variations`, `get_caption_limits`. Nothing is published by a tool.

**REST API for automations (n8n, Make, scripts).** Create a token in Integrations → REST API → Generate key
(shown once, stored hashed), then call `/api/v1/*` with `Authorization: Bearer opk_…`: list/create posts,
`GET /api/v1/posts/due` for posts whose scheduled time has come, `PATCH /api/v1/posts/{id}` to report
`published` (with URL) or `failed`, and `POST /api/v1/generate`. Schema: `/api/v1/openapi.json`. Ready-made
n8n workflows are in [`integrations/n8n`](integrations/n8n). Run
[`supabase/migrations/002_api_tokens_and_publishing.sql`](supabase/migrations/002_api_tokens_and_publishing.sql) after 001.

**Deploying to the VPS:** see [`../deploy/README.md`](../deploy/README.md) — one-time `setup-vps.sh`, then every push to
`main` is tested and deployed by GitHub Actions.

Hosting must run Next.js as a server (Vercel, or `npm run build && npm start` on a Node host); a static
export cannot serve `/mcp`, `/oauth/*` or `/api/*`.

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
src/screens/             Screen components, ported 1:1 from the design template (generated;
                         Studio, Integrations, Posts and Calendar are maintained by hand)
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

- **Partial backend.** Posts, owner login, AI generation (OpenRouter) and the MCP endpoint are real once
  configured. With the database connected, All Posts / Scheduled / Published / Drafts, the sidebar counts,
  the Content Calendar and the dashboard counters show the stored posts, and a post can be scheduled, marked
  as published, moved to drafts or deleted from its row (`PATCH`/`DELETE /api/posts/{id}`). Without a
  database those screens show the design's sample data, and say so.
- **Still sample-only screens.** AI Image Studio, Content Planner, Media Library, Social Accounts,
  AI Providers, Automation, Publishing Logs, Analytics and Settings are the design with sample data: their
  controls do nothing yet. There is no job queue and no social-network publishing; "published" is recorded
  by you or by an automation (n8n) through the REST API.
- **View-model typing.** `src/lib/omnipost/logic.ts` is the design prototype's logic ported as-is and is
  excluded from type checking (`@ts-nocheck`); screens receive it as an untyped view model. The typed
  layer is `src/lib/adapters` and `src/lib/ingest`. Moving the sample data behind those adapters, screen
  by screen, is the next step toward the production backend.
- **Styling.** Ported screens keep the design's inline declarations; they are not yet Tailwind/shadcn
  components.
- **Responsive.** The design only specifies the desktop layout. Below 900px the sidebar becomes a drawer
  and fixed multi-column grids stack; wide tables and the month calendar scroll sideways.
- **Search (`⌘K`)** is a visual placeholder, as in the design.
