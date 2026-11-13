<p align="center">
  <img src="docs/media/banner.png" alt="OmniPost AI — one hub for every post, on every platform" width="100%">
</p>

<h1 align="center">OmniPost AI</h1>

<p align="center">
  <b>A private, single-user AI social media studio with a universal publishing pipeline.</b><br>
  Create anywhere → send to OmniPost → customize → schedule → publish everywhere.
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-18181b?logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-18181b?logo=react&logoColor=61dafb">
  <img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-18181b?logo=typescript&logoColor=3178c6">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-18181b?logo=tailwindcss&logoColor=38bdf8">
  <img alt="Tests passing" src="https://img.shields.io/badge/tests-19_passing-0ca678">
  <img alt="Status: interactive prototype" src="https://img.shields.io/badge/status-interactive_prototype-b45309">
</p>

<p align="center">
  <a href="#-demo">Demo</a> ·
  <a href="#-screenshots">Screenshots</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-getting-started">Getting started</a> ·
  <a href="#-roadmap">Roadmap</a>
</p>

---

## 📌 Overview

OmniPost AI is one central website for managing every social media publishing activity. Content can be
written inside the built-in AI studio, sent from an external AI assistant, pushed by an automation
tool, posted to a REST endpoint, delivered by a webhook, or imported from a spreadsheet. Whatever the
source, every item enters the **same** pipeline:

> **External source → Integration → Draft → Review → Approval → Accounts → Schedule → Publish → History**

> [!IMPORTANT]
> **Current status: interactive prototype.** Every screen is built, navigable and interactive, and the
> connector architecture is in place behind typed interfaces. All external connections run through
> clearly labelled **mock adapters** — nothing is actually connected, imported or published yet, and the
> UI says so wherever it matters. The backend (database, authentication, job queue, real provider APIs)
> is the next phase. See the [roadmap](#-roadmap).

## 🎬 Demo

A 46-second walkthrough: dashboard → AI Content Studio → Image Studio → Calendar → Social Accounts →
Integration Hub → importing a full-year content plan → dark theme.

<p align="center">
  <a href="docs/media/demo.mp4">
    <img src="docs/media/demo.gif" alt="OmniPost AI product walkthrough" width="100%">
  </a>
</p>

<p align="center">
  ▶️ <a href="docs/media/demo.mp4"><b>Watch the full-quality video (MP4, 2.6 MB)</b></a>
</p>

## 🖼 Screenshots

### Dashboard

Publishing command center: connected accounts, scheduled and published counts, pending approvals,
failed jobs, the next posts in the queue, AI generation activity and account health.

![Dashboard](docs/media/screens/dashboard.png)

### AI Content Studio

One brief in, a tailored variation per platform out. Each variation has its own headline, caption,
hashtags, call to action, image and alt text, with live character counts against the platform limit.

![AI Content Studio](docs/media/screens/studio.png)

### AI Image Studio

Generate and edit visuals, export per-platform presets (Instagram square/portrait/story, Facebook,
LinkedIn, X, Pinterest, YouTube thumbnail) and manage SEO metadata for every image.

![AI Image Studio](docs/media/screens/image.png)

### Content Planner and Calendar

Bulk-plan 30 days to a full year, then see every scheduled, published and pending post in one calendar.

| Content Planner | Content Calendar |
| :---: | :---: |
| ![Content Planner](docs/media/screens/planner.png) | ![Content Calendar](docs/media/screens/calendar.png) |

### Social Accounts and capability matrix

Multiple accounts per platform, each with its own publishing route, token status and health. The
capability matrix shows exactly what each route supports, so unsupported actions are never offered.

![Social Accounts](docs/media/screens/accounts.png)

### Integration Hub

Eight categories in one place: AI Providers, MCP Connections, Automation Platforms, REST API, Webhooks,
File Imports, Connected Apps, and Activity & Logs. Each integration shows a clear status — Connected,
Disconnected, Connection Error or Authentication Required.

![Integration Hub](docs/media/screens/integrations.png)

| MCP connections | REST API |
| :---: | :---: |
| ![MCP connections](docs/media/screens/integrations-mcp.png) | ![REST API](docs/media/screens/integrations-api.png) |

### Bulk file import

Upload a CSV or JSON file (parsed in the browser), map your columns to OmniPost fields, validate every
row, preview, then import as drafts or pending-approval posts. Invalid dates, missing content,
duplicates and unsupported platforms are flagged before anything is imported.

| Column mapping | Validation |
| :---: | :---: |
| ![Column mapping](docs/media/screens/import-mapping.png) | ![Validation](docs/media/screens/import-validate.png) |

### Automation, logs and analytics

| Automation | Publishing logs |
| :---: | :---: |
| ![Automation](docs/media/screens/automation.png) | ![Publishing logs](docs/media/screens/logs.png) |

| Analytics | System architecture |
| :---: | :---: |
| ![Analytics](docs/media/screens/analytics.png) | ![System architecture](docs/media/screens/architecture.png) |

### Dark theme

| Dashboard | AI Content Studio |
| :---: | :---: |
| ![Dashboard, dark theme](docs/media/screens/dashboard-dark.png) | ![AI Content Studio, dark theme](docs/media/screens/studio-dark.png) |

### Mobile

Below 900px the sidebar becomes a slide-in drawer and multi-column layouts stack.

![Mobile layouts](docs/media/screens/mobile.png)

## ✨ Features

### Create

- **AI Content Studio** — provider and model selection, topic, tone, language, focus keyword and target
  platforms; per-platform variations with independent editing.
- **AI Image Studio** — prompt-driven generation, platform export presets and an image SEO metadata
  editor (filename, title, alt text, focus keyword, format and size).
- **Content Planner** — bulk planning horizons from 30 days to one year, publishing days and times.

### Schedule

- **Content Calendar** — month grid with a view switcher for week, day, list and timeline.
- **Post lists** — All Posts, Scheduled, Published and Drafts, each tagged with its content source.

### Connect

- **Social Accounts** — Facebook, Instagram, LinkedIn, X, YouTube, TikTok, Pinterest, Threads, Reddit
  and Telegram, with multiple accounts per platform and a per-account publishing route.
- **AI Providers** — guided connection wizard for OpenAI, Google Gemini, Anthropic, OpenRouter, xAI,
  DeepSeek, Mistral, Meta Llama, Qwen and any OpenAI-compatible endpoint. No base URLs, headers or
  payloads to configure for standard providers.
- **MCP server** — lets compatible AI assistants create drafts, attach media and schedule posts through
  authorized tools.
- **Automation platforms** — n8n with ready-to-import workflows, plus Make and Zapier via REST and
  webhooks. n8n is optional; the platform does not depend on it.
- **REST API and webhooks** — versioned endpoints, API keys, signed incoming webhooks and outgoing
  event notifications.
- **File imports** — CSV and JSON in the browser, with flexible column mapping for both
  one-row-per-date and one-row-per-platform spreadsheets, and downloadable templates.

### Monitor

- **Publishing Logs** — attempts, retries and recovery of failed jobs.
- **Analytics** — only metrics the platform actually exposes; nothing is fabricated.
- **Architecture** — the system blueprint, documented inside the app.

### Experience

- Light and dark themes, remembered between visits.
- Desktop and mobile layouts.
- Statically generated routes for fast page loads.

## 🧭 Architecture

The UI and the publishing engine depend only on typed contracts. Every AI provider, social platform
and publishing route is an independent adapter held in a registry, so adding one never requires
changing the screens or the engine.

```mermaid
flowchart LR
    subgraph Sources
        A1[AI Content Studio]
        A2[AI assistants via MCP]
        A3[n8n / Make / Zapier]
        A4[REST API & webhooks]
        A5[CSV / JSON import]
    end

    subgraph OmniPost
        B[Ingestion<br/>validated payload]
        C[Draft]
        D[Review & approval]
        E[Schedule queue]
        F[Publishing engine]
    end

    subgraph Adapters
        G1[AIProvider]
        G2[SocialConnector]
        G3[PublishingProvider]
    end

    A1 & A2 & A3 & A4 & A5 --> B --> C --> D --> E --> F
    C -.-> G1
    F --> G3 --> G2
    G2 --> H[(Social platforms)]
    F --> I[Publishing history]
```

| Contract | Responsibility | File |
| --- | --- | --- |
| `AIProvider` | Text and structured generation, image prompts, model discovery, connection test | [`app/src/lib/adapters/types.ts`](app/src/lib/adapters/types.ts) |
| `SocialConnector` | Capabilities, account discovery, media validation, idempotent publishing, post status | [`app/src/lib/adapters/types.ts`](app/src/lib/adapters/types.ts) |
| `PublishingProvider` | A route (direct API or third-party provider) a post can travel | [`app/src/lib/adapters/types.ts`](app/src/lib/adapters/types.ts) |
| `Registry` | Adapter lookup and the provider capability matrix | [`app/src/lib/adapters/registry.ts`](app/src/lib/adapters/registry.ts) |
| Content payload | Zod schema for the universal ingestion API | [`app/src/lib/ingest/schema.ts`](app/src/lib/ingest/schema.ts) |

Design rules the adapters already enforce:

- **Capability detection.** A connector declares what it supports and why something is unavailable, so
  the UI never shows a working-looking button for an unsupported feature.
- **Idempotent publishing.** Every post carries an idempotency key; retrying the same key returns the
  same receipt instead of publishing twice.
- **Status before retry.** `getPostStatus()` is available so an uncertain publish is checked before it
  is retried.
- **Honest mocks.** Every mock result carries `mock: true` and is never presented as a real success.

## 🛠 Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router, static generation) |
| UI | React 19, TypeScript (strict), Tailwind CSS, CSS-variable design tokens |
| Icons and type | Phosphor Icons, Geist and Geist Mono (self-hosted) |
| Validation | Zod |
| Testing | Vitest |
| Planned backend | Node.js, PostgreSQL with Prisma, Redis with BullMQ, S3-compatible storage, Sharp, FFmpeg |

## 🚀 Getting started

**Requirements:** Node.js 20 or newer.

```bash
git clone https://github.com/Mostafijemon24/Omni-Post.git
cd Omni-Post/app
npm install
npm run dev
```

Open <http://localhost:3000>. No environment variables or API keys are needed in the prototype phase.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (all routes statically generated) |
| `npm start` | Serve the production build |
| `npm test` | Run the unit tests |
| `npm run typecheck` | Type-check the project |
| `npm run port:design` | Regenerate the screen components from the design file |

## 🗺 Routes

| Section | Routes |
| --- | --- |
| Overview | `/dashboard` |
| Create | `/studio` · `/image` · `/planner` |
| Schedule | `/calendar` · `/posts` · `/scheduled` · `/published` · `/drafts` |
| Assets | `/media` |
| Connections | `/accounts` · `/providers` · `/integrations` · `/automation` |
| Monitor | `/logs` · `/analytics` |
| System | `/settings` · `/architecture` |

## 📁 Project structure

```
Omni-Post/
├── app/                      Next.js application
│   ├── src/
│   │   ├── app/              App Router: layout, global styles, one static route per screen
│   │   ├── components/       Shell (sidebar, top bar, mobile drawer), state provider
│   │   ├── screens/          Screen components, generated 1:1 from the design
│   │   ├── lib/
│   │   │   ├── adapters/     AIProvider, SocialConnector, PublishingProvider + mock adapters
│   │   │   ├── ingest/       Zod schema for incoming content
│   │   │   └── omnipost/     View-model logic and state store
│   │   └── styles/           Generated hover and focus states
│   ├── tests/                Unit tests
│   └── tools/dc2tsx.mjs      Design → React porting tool
├── design/                   Original HTML design prototype
└── docs/media/               Banner, screenshots and demo video
```

## ✅ Testing

```bash
cd app
npm test
```

19 unit tests cover the adapter registry, mock AI providers and social connectors (platform limits,
idempotent publishing, route support), the ingestion schema, CSV parsing, import validation, routing
and the style helper.

## 🔐 Security notes

- No credentials are stored in the browser. The only value kept in `localStorage` is the theme choice.
- API keys, tokens and webhook secrets shown in the prototype are generated in the browser for
  illustration and labelled as mock.
- The production design keeps all provider credentials encrypted on the server, with signed webhooks,
  idempotency keys, rate limiting and audit logs.

## 🧱 Roadmap

- [x] **Phase 1 — Architecture:** connector contracts, registries, ingestion schema
- [x] **Phase 2 — Visual prototype:** all screens, light and dark themes, mobile layout
- [x] **Phase 3 — Functional prototype:** interactive flows on mock adapters
- [ ] **Phase 4 — Production backend:** PostgreSQL, authentication, REST API, BullMQ workers, storage
- [ ] **Phase 5 — Integrations:** real AI providers, n8n, MCP server, official social APIs
- [ ] **Phase 6 — Testing and deployment:** integration and security tests, VPS deployment

Known limits of the current phase:

- Screens keep the design's inline styles; they are not yet split into reusable Tailwind components.
- The view-model logic in `app/src/lib/omnipost/logic.ts` is not yet type-checked.
- Only content generation and the provider connection test run through the adapters so far; the rest
  of the sample data is still inline.
- Wide tables and the month calendar scroll sideways on phones.
- Search (`⌘K`) is a visual placeholder.

## 👤 Author

**Mostafijemon24** — [github.com/Mostafijemon24](https://github.com/Mostafijemon24)

Private project built for personal use. All rights reserved.
