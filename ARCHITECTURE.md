# Next.js Template Architecture

This project is a generic Next.js template for large applications. Its purpose is to provide a clean starting point before connecting any store, external system, or business-specific domain.

## Current Product Boundary

`visul-chats` currently ships the Scenora visual chat studio. The visible UI, copy,
routes, recording flow, local draft behavior, JSON import/export, and video export
behavior are treated as frozen behavior unless a task explicitly asks to change them.

The app is prepared for Laravel/API integration, but no executable private backend
endpoint is claimed in public discovery routes until that endpoint really exists. HTTP
clients live in `src/core/http`, and feature-owned API calls must live under
`src/features/<feature>/api`.

## Core Principles

- `app` is responsible for routing, layouts, metadata, loading, error, and not-found boundaries only.
- `features` owns domain modules and feature-specific interfaces.
- `core` contains shared technical infrastructure such as HTTP clients, SEO helpers, cache helpers, and agent-readiness utilities.
- `shared` contains generic components and helpers that do not know any business domain.
- Backend endpoints, store endpoints, payment providers, shipping providers, and business-specific content are not connected during the template phase.
- Every page must be verifiable through `typecheck`, `lint`, `build`, and then Lighthouse when it becomes a final user-facing page.

## Current Structure

```txt
src/
  app/
    [locale]/
      (public)/            public pages that do not require a session
      (auth)/              structural authentication pages
      (workspace)/         structural private/workspace area
      index.md/            localized Markdown fallback for the public home page
      layout.tsx           HTML shell, providers, and i18n
      error.tsx            segment error boundary
      not-found.tsx        localized 404
    .well-known/           agent/API discovery endpoints
    llms.txt/              LLM guidance endpoint
    openapi.json/          honest OpenAPI discovery endpoint
    robots.txt/            robots and Content-Signal route
    sitemap.ts             sitemap metadata route
    globals.css            theme tokens and Tailwind v4 setup

  config/
    site.ts                safe public site configuration from environment variables

  core/
    agent-readiness/       llms, API catalog, Link headers, and Markdown helpers
    http/                  HTTP clients, errors, headers, and query keys
    seo/                   metadata helpers

  features/
    auth/                  authentication placeholder components
    dashboard/             dashboard placeholder
    home/                  generic template home page
    shell/                 header and footer only
    studio/                Scenora chat scenario studio
      components/          studio-owned UI composition
      data/                static defaults and font options
      export/              video timeline and MP4 export logic
      hooks/               studio-only client hooks
      playback/            playback state machine hook
      services/            persistence and file workflow adapters
      store.ts             Zustand draft/UI state
      types.ts             scenario domain types
      validations/         Zod import/runtime contracts

  i18n/
    routing.ts             next-intl routing config
    request.ts             request locale/messages config
    navigation.ts          locale-aware navigation wrappers

  providers/
    app-provider.tsx       app-level providers
    query-provider.tsx     TanStack Query provider

  shared/
    components/            UI and layout primitives
    lib/                   generic framework helpers

  stores/
    ui-store.ts            UI-only Zustand state
```

## Route Groups

Route groups organize the project but do not appear in URLs:

```txt
src/app/[locale]/(public)/page.tsx        -> /ar and /en
src/app/[locale]/(auth)/login/page.tsx    -> /ar/login and /en/login
src/app/[locale]/(auth)/register/page.tsx -> /ar/register and /en/register
src/app/[locale]/(workspace)/dashboard    -> /ar/dashboard and /en/dashboard
```

`localePrefix` is set to `always` so language URLs are explicit for SEO and `hreflang`.

When adding a real project:

- Put store pages inside `(store)` or replace `(public)` as needed.
- Put account pages inside `(account)` or `(workspace)`.
- Do not add new route surfaces without considering `loading.tsx`, `error.tsx`, metadata, and empty/loading/error states.

## Feature Contract

New features may use only the folders they actually need:

```txt
features/<feature-name>/
  components/       UI owned by this feature
  actions/          Server Actions for mutations, if needed
  api/              typed data access functions
  hooks/            client hooks owned by the feature
  services/         feature workflow orchestration
  store/            feature-local UI state only
  types/            TypeScript types
  validations/      Zod schemas
  constants/        feature constants
  index.ts          public exports only
```

Feature rules:

- Do not create every folder in advance. Add folders only when needed.
- Do not import another feature through its internal files.
- Cross-feature imports must come from `features/<name>/index.ts`.
- Do not put remote API payloads in Zustand.
- Do not place business workflows inside components or pages.
- Keep feature-specific persistence and browser file workflows in `services/`, not
  in React components.
- Validate imported or external payloads with Zod before loading them into state.

### Studio Feature Rules

- `components/StudioApp.tsx` is the UI orchestrator only.
- `store.ts` owns draft/UI state through Zustand. It may call feature services, but
  it should not access storage APIs directly.
- `services/scenario-storage.ts` owns the local draft/manual-save adapter.
- `services/scenario-file.ts` owns JSON import/export browser workflows.
- `validations/scenario.ts` is the runtime contract for imported scenario JSON.
- Video rendering stays in `export/` and `components/ExportDialog.tsx` because it is
  browser-only and tightly coupled to the recording UI.

## Import Direction

Allowed direction:

```txt
app -> features -> core/shared
app -> core/shared
features -> core/shared
shared -> does not import features or app
core -> does not import features or app
```

Correct examples:

```ts
import { TemplateHomePage } from "@/features/home";
import { serverApi } from "@/core/http/server-client";
import { Button } from "@/shared/components/ui/button";
```

Forbidden examples:

```ts
import { Something } from "@/features/auth/components/internal";
import { useCartStore } from "@/shared/lib/cart";
```

## HTTP Layer

There are two HTTP clients:

- `core/http/server-client.ts`: for Server Components and Server Actions only.
- `core/http/browser-client.ts`: for Client Components and TanStack Query only.

Important rules:

- Do not use raw `fetch` in features unless the reason is documented.
- Do not place secrets or non-public environment variables in client code.
- Use `credentials: "include"` when working with cookie-based backends.
- Add `X-Locale`, `X-Currency`, `X-Country`, and `X-Cart-Token` from context only when needed.
- Do not connect real endpoints in the template. Add them only when the real project phase begins.
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_BACKEND_API_URL` are both accepted for
  browser requests; `BACKEND_API_URL` remains the server-preferred value.
- API calls for a feature must be colocated under `features/<feature>/api` and may
  use `core/http/*` internally.

## Data Fetching Strategy

Use Server Components by default:

- Public data needed for first render: Server Component.
- Interactive data after page load: TanStack Query in a Client Component.
- Mutations: Server Actions for internal forms, or a feature service using `browserApi` when needed.
- User-private data: no shared caching.
- Public data: may use `next.revalidate` or cache tags after a clear policy is defined.

Every data function must define:

- Is the data public or user-private?
- Does it need immediate freshness or can it accept stale data?
- Should it be invalidated after a mutation?
- What are the query/cache tags?

TanStack Query defaults are intentionally conservative for production UX:

- Fresh lifetime: 5 minutes.
- Garbage-collection lifetime: 30 minutes.
- No refetch on window focus.
- Refetch on reconnect.
- Retry transient failures up to 2 times, but never retry 4xx API errors.

## State Management

- Server state: Server Components or TanStack Query.
- Global UI state: Zustand in `stores`.
- Form state: React Hook Form.
- Validation: Zod.
- URL state: search params for shareable filters or pagination.
- Feature-local UI state may live in a feature store when it does not cross app
  boundaries.
- Local persistence is an adapter concern. Hide direct `localStorage` calls behind
  a feature service.

Forbidden:

- Storing remote API payloads in Zustand.
- Using `localStorage` for state that affects SEO, authentication, authorization, prices, or critical behavior.
- Creating stores for every feature without a real need.

## Internationalization

The template uses `next-intl`:

- Current locales: `ar`, `en`.
- `ar` is the default locale.
- Use `i18n/navigation` for links and navigation.
- All visible user text must live in `dictionary/<locale>.json`.
- Do not mix hardcoded Arabic/English strings inside components.
- Set `dir` from layout based on locale.

## SEO Architecture

Every public route must include:

- `generateMetadata`.
- A clear and unique title.
- A description of roughly 120 to 160 characters for final pages.
- Canonical URL.
- Open Graph image.
- Robots policy.
- `hreflang` when the page is localized.
- JSON-LD when the content type is clear.

Use `core/seo/metadata.ts` as the starting point and extend it when needed.

## Agent Readiness Architecture

The template includes an Agent Readiness layer that helps search engines and AI agents understand the site safely and honestly. This layer does not grant executable capabilities and does not claim that a store or public transactional APIs exist.

Current routes:

```txt
/robots.txt
/sitemap.xml
/llms.txt
/openapi.json
/.well-known/api-catalog
/.well-known/mcp/server-card.json
/.well-known/agent-skills/index.json
/.well-known/agent-skills/<skill-id>.md
/<locale>/index.md
```

Architecture rules:

- `robots.txt` blocks sensitive paths and contains `Content-Signal: ai-train=no, search=yes, ai-input=yes`.
- `llms.txt` describes the site, public pages, and agent safety rules.
- `api-catalog` uses `application/linkset+json` and links only to safe public resources.
- `openapi.json` is honest discovery metadata; it remains without executable `paths` until real public APIs exist.
- `agent-skills` describes public reading, summarization, and navigation skills only; no purchasing, registration, or form submission.
- `mcp/server-card.json` is an honest HTTPS discovery-only server card. It documents read-only public discovery and browser tools, and explicitly does not claim a remote executable MCP transport.
- `WebMcpTools` registers read-only browser tools only when `navigator.modelContext` exists. It must not expose export, import, save, clear, recording, account, checkout, or mutation actions.
- `proxy.ts` adds Link discovery headers and `Vary: Accept`, and returns Markdown only for safe public pages when `Accept: text/markdown` is sent.
- OAuth/OIDC metadata is added only when a real OAuth/OIDC capability exists and is documented.

When adding a new public page:

- Add metadata, canonical URL, and `hreflang`.
- Decide whether it belongs in the sitemap.
- Decide whether it needs a Markdown fallback.
- Update `llms.txt` or Agent Skills if agents need new guidance.
- If a safe public API is added, document it in `openapi.json` and `api-catalog`.

When adding a private or sensitive page:

- Do not add it to the public sitemap.
- Do not give it a Markdown fallback.
- Add it to `privateRobotDisallows` if it is guessable or contains user data.
- Do not list it in `llms.txt`, `api-catalog`, or Agent Skills.

## Visual Identity Architecture

The interface must not be built from scattered aesthetic decisions. Every real project on top of this template must choose one visual system and translate it into tokens before building pages.

Sources of truth:

```txt
src/app/globals.css        design tokens, theme variables, Tailwind v4 theme
src/shared/components/ui   primitives and reusable UI components
src/features/*/components  feature-owned composed interfaces
```

Architecture rules:

- `globals.css` contains tokens only: colors, radii, shadows, typography, spacing hints, and motion variables.
- Components use Tailwind utility classes and variants; they do not use inline styles.
- Do not create CSS files for individual features; that causes aesthetic drift.
- Do not place random colors or values inside components unless they are defined as tokens.
- Reusable components must support composition through props, slots, or `children` when needed.
- Every feature must feel like part of the same product, not a separate visual identity.

Supported starting design systems:

- `Modern Dark`: for technology, gaming, and smart devices.
- `Luxury`: for jewelry, perfumes, watches, and high fashion.
- `Swiss Minimalist`: for galleries, modern furniture, and quiet premium products.
- `Neo Brutalism`: for bold youth brands and streetwear.

When choosing a system:

- Write the selected system and the reason for choosing it.
- Define a specific palette.
- Define a typography scale.
- Define a radius scale.
- Define a shadow/elevation scale.
- Define motion durations and easing rules.
- Define the style for product cards, forms, navigation, empty states, and dialogs.

For luxury stores and jewelry, `Luxury` is the suggested default, but it is not locked until the store frontend implementation begins.

## Performance Architecture

The template starts from strict performance rules:

- Server Components by default.
- Put `"use client"` in the smallest component that needs it.
- Use `next/image` for real images.
- Do not use external images until `images.remotePatterns` is configured.
- Use `next/font` only; do not add manual Google Fonts links.
- Use dynamic imports for heavy components.
- Do not add animation libraries to public pages unless there is a clear need.
- Do not make layouts read slow runtime data when the work can move to a page or Suspense boundary.

## Accessibility Architecture

Every page must respect:

- Semantic HTML.
- Correct heading hierarchy.
- Real buttons for actions and links for navigation.
- Labels or `aria-label` for every control.
- Keyboard navigation.
- Clear focus states.
- WCAG-compliant contrast.
- No reliance on color alone to explain state.

## UX States

Every real flow must cover:

- Loading.
- Empty.
- Success.
- Validation error.
- Server error.
- Unauthorized.
- Destructive confirmation.
- Optimistic or pending state when needed.

Do not create a screen or feature without thinking through these states.

## Verification

Before considering any change ready:

```bash
npm run typecheck
npm run lint
npm run build
```

After Agent Readiness changes:

```bash
curl -I /ar
curl -I /llms.txt
curl -I /.well-known/api-catalog
curl -I /openapi.json
curl -I /.well-known/agent-skills/index.json
curl -H "Accept: text/markdown" /ar
curl /ar/index.md
```

Verify:

- Public pages expose `Link` headers.
- `Vary: Accept` exists where content negotiation is used.
- `robots.txt` blocks sensitive paths.
- `openapi.json` lists only real public APIs.
- Private routes do not expose public Markdown fallbacks.

For final pages:

- Run Lighthouse or Playwright/Lighthouse.
- Target 100 for Performance, Accessibility, Best Practices, and SEO.
- If 100 is blocked by an external factor, document the reason and required follow-up.

## Template Boundary

This version does not start building the store. Allowed now:

- Generic structure.
- Documentation and rules.
- Placeholders.
- Generic HTTP clients without endpoints.
- Generic SEO helpers.

Forbidden now:

- Connecting Laravel endpoints.
- Building product, cart, or checkout pages.
- Copying data from a specific store.
- Adding business-specific branding.
