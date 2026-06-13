# Agent Rules For This Next.js Template

This file is mandatory for every AI agent working inside the `nextjs` project. Read it before editing any file, then read `ARCHITECTURE.md` to understand the project structure.

## Template Mission

This project is a generic foundation for large Next.js applications. Do not connect it to a store, Laravel backend, payment provider, shipping provider, or any business-specific system unless the user explicitly asks for that phase.

## Core Next.js Rules

- Use the App Router only.
- Server Components are the default.
- Add `"use client"` only when the component requires state, effects, browser APIs, event handlers, TanStack Query, Zustand, React Hook Form, or animation libraries.
- Push Client Components as deep as possible.
- Do not place business logic in `page.tsx`.
- Do not place reusable components inside `app` unless they are route-private colocated components.
- Use `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` where they are needed for a route segment.
- In Next.js 16, use `proxy.ts` instead of `middleware.ts`.
- Do not treat proxy as the only authorization layer.
- In modern Next.js versions, `cookies()`, `headers()`, `params`, and `searchParams` can be async. Await them when required.

## File And Import Rules

Allowed dependency direction:

```txt
app -> features -> core/shared
app -> core/shared
features -> core/shared
shared -> no app/features imports
core -> no app/features imports
```

Use this top-level structure:

```txt
src/app                 routing only
src/features            domain modules
src/core                technical infrastructure
src/shared              domain-agnostic UI/helpers
src/providers           app providers
src/stores              global UI state only
src/i18n                localization setup
src/config              safe public configuration
```

Feature modules may use this shape as needed:

```txt
components/
actions/
api/
hooks/
services/
store/
types/
validations/
constants/
index.ts
```

Do not create empty folders or unused layers.

## Naming

- React components: `PascalCase`.
- Hooks: `useSomething`.
- Files: `kebab-case.ts` or `PascalCase.tsx` for components.
- Route segments: `kebab-case`.
- Types: clear names; do not use `any`.
- Client-safe environment variables must start with `NEXT_PUBLIC_`.
- Secrets must remain server-only.

## Data Fetching

- Server Components: use `serverApi` or server-only data functions.
- Client Components: use TanStack Query with `browserApi`.
- Do not use raw `fetch` unless the reason is clear and documented.
- Do not pass secrets to the client.
- Do not store API payloads in Zustand.
- Do not use `localStorage` for state that affects SEO, authentication, authorization, prices, or other critical behavior.

Every request must define:

- Whether it is public or user-private.
- Its cache policy.
- Its revalidation strategy.
- Its error-handling strategy.
- Its loading state.

## Caching

- User-private data must not use shared cache.
- Stable public data may use `next.revalidate` or cache tags after the policy is defined.
- After mutations, use explicit invalidation.
- Do not add caching just to hide slow APIs.
- Do not make layouts read slow runtime data without Suspense or a strong reason.

## Forms And Mutations

- Use React Hook Form for interactive forms.
- Use Zod for validation.
- Server Actions are suitable for internal forms when execution must happen on the server.
- Route Handlers are suitable for webhooks, external APIs, streaming, or large uploads.
- Every mutation must cover pending, validation error, success, server error, and retry/fallback where needed.

## SEO Rules

Every public page must include:

- `generateMetadata`.
- A unique title.
- A clear description.
- Canonical URL.
- Open Graph metadata.
- Twitter card metadata.
- `hreflang` for localized pages.
- Robots policy.
- JSON-LD when the page type is clear.

Do not add a public page without SEO.

Use `core/seo/metadata.ts` as the starting point.

## Agent Readiness Rules

This template must stay safely and honestly agent-ready. When adding any public page or public feature, review these files before delivery:

- `src/app/robots.txt/route.ts`
- `src/app/sitemap.ts`
- `src/app/llms.txt/route.ts`
- `src/app/openapi.json/route.ts`
- `src/app/.well-known/api-catalog/route.ts`
- `src/app/.well-known/mcp/server-card.json/route.ts`
- `src/app/.well-known/agent-skills/index.json/route.ts`
- `src/core/agent-readiness/*`

Mandatory rules:

- Do not claim that API, MCP, OAuth, checkout, or executable agent capabilities exist unless they truly exist.
- Do not add an MCP Server Card unless a real MCP server or clearly documented public HTTPS capability exists.
- Do not add OAuth/OpenID metadata unless the project truly uses OAuth/OIDC.
- Do not list admin APIs, protected APIs, or private endpoints in `api-catalog` or `openapi.json`.
- Important public routes must have SEO, may enter the sitemap, and may receive a Markdown fallback when useful to agents.
- Sensitive or personal routes such as account, profile, cart, checkout, dashboard, login, and register must not expose Markdown content and must not appear in the public sitemap.
- `robots.txt` must allow public content and block sensitive paths.
- Keep `Content-Signal: ai-train=no, search=yes, ai-input=yes` unless the project owner asks for another policy.
- Link response headers should point to `/.well-known/api-catalog`, `/llms.txt`, `/.well-known/agent-skills/index.json`, and `/openapi.json`.
- Markdown content negotiation must work only for safe public pages when `Accept: text/markdown` or `text/x-markdown` is sent.
- Every Markdown fallback must include a title, source URL, description, important public links, and safety rules.
- Do not let agents submit forms, create accounts, purchase products, or fill personal data except through the normal visible user flow and explicit user action.

When adding a new feature, ask:

- Is this feature public or private?
- Should it appear in the sitemap?
- Does it need a Markdown alternate?
- Should `llms.txt` or Agent Skills change?
- Does it expose a safe public API that belongs in OpenAPI/API Catalog?
- Should robots block it?
- Does it expose personal data or user state?

If the answer is unclear, treat the feature as private until proven otherwise.

## Performance Rules

Final pages should target Lighthouse Performance 100.

Follow these rules:

- Minimize JavaScript sent to the browser.
- Prefer Server Components.
- Use `next/image` for images.
- Use fixed dimensions or aspect ratios to prevent CLS.
- Use `next/font` only.
- Do not add manual external font links.
- Do not add large libraries for small tasks.
- Use dynamic imports for heavy components.
- Do not place charts, maps, editors, or other heavy widgets in the initial bundle unless they are immediately visible.
- Use meaningful skeleton and loading states.
- Watch LCP, CLS, and INP.

## Accessibility Rules

Final pages should target Lighthouse Accessibility 100.

Check:

- Heading order.
- Semantic landmarks.
- Labels for every input.
- `aria-label` for icon-only buttons.
- Keyboard navigation.
- Visible focus states.
- WCAG-compliant contrast.
- No click handlers on non-interactive elements.
- Links for navigation and buttons for actions.
- Text does not overflow its container.
- No incoherent overlap on mobile or desktop.

## Best Practices Rules

Final pages should target Lighthouse Best Practices 100.

Check:

- No console errors.
- No deprecated APIs.
- No mixed content.
- No hardcoded secrets.
- No third-party scripts without a strong reason.
- No `dangerouslySetInnerHTML` unless sanitized and documented.
- External links with `target="_blank"` use `rel="noopener noreferrer"`.
- Errors provide a respectful user experience.

## UX Rules

Every real flow must cover:

- First load.
- Loading state.
- Empty state.
- Success state.
- Validation error.
- Server error.
- Unauthorized state.
- Destructive confirmation.
- Retry.
- Mobile behavior.

Do not build screens that only work in the ideal state.

## UI/UX Visual Identity Rules

Every interface built in this project must start from one clear visual identity. Do not mix design systems or invent colors, radii, typography, shadows, or motion values outside the approved tokens.

Before building a real project or a major page:

- Choose exactly one Design System that fits the audience and product.
- Document the choice in `ARCHITECTURE.md` or a feature brief when one exists.
- Define tokens in `src/app/globals.css` or the approved theme config.
- Apply the same tokens to all components: buttons, cards, inputs, product tiles, navigation, and dialogs.
- Do not make improvisational visual decisions inside components.

Supported starting systems:

| Design System | Best suited for | Required rules | Prohibited |
| --- | --- | --- | --- |
| Modern Dark | Tech gear, smart devices, gaming | Deep dark backgrounds, soft but WCAG-compliant contrast, subtle glow, clearly rounded corners | Sharp edges, brutalist elements, text contrast that harms readability |
| Luxury | Jewelry, perfumes, watches, high fashion | Wide negative space, elegant typography, calm mostly monochrome palette with a limited tokenized accent, smooth transitions | Loud colors, harsh shadows, fast or distracting animations |
| Swiss Minimalist | Galleries, modern furniture, quiet premium products | Strict alignment, mathematical grids, large clear sans-serif type, very few colors | Gradients, unnecessary decoration, random center alignment |
| Neo Brutalism | Streetwear, youth brands, bold creative products | Thick black borders, solid offset shadows without blur, strong colors, heavy typography | Very soft corners, glows, blurred drop shadows |

Anti-drift rules:

- Do not mix Luxury with Neo Brutalism, or Modern Dark with Swiss Minimalist, in the same experience.
- Do not add a new color unless it is added as a token and justified.
- Do not add a new radius unless it belongs to an approved scale.
- Do not add a new shadow unless it belongs to an approved scale.
- Do not add a new font unless it is part of the chosen identity and loaded through `next/font`.
- Do not use random animation durations. Tie motion to the identity's motion rules.
- Do not make one page feel like a different product from the rest of the project.

For luxury stores and jewelry, `Luxury` is the suggested default unless the user requests another identity.

## i18n Rules

- All visible text must live in `dictionary/ar.json` and `dictionary/en.json`.
- Use `next-intl`.
- Use `Link` and navigation helpers from `src/i18n/navigation`.
- Do not use `next/link` directly in components that need locale-aware routing.
- Set `rtl/ltr` direction from layout.
- Do not duplicate translation keys without a reason.

## Styling Rules

- Use tokens from `globals.css`.
- Use shadcn/ui primitives when available.
- Use Tailwind utility classes for everyday styling.
- Inline styles are forbidden except for a narrow technical case that cannot be solved with a token or utility class; document the reason.
- Do not create feature-specific standalone CSS files. The only allowed exception is approved global/theme files such as `src/app/globals.css`.
- Components must be composable through props and variants, not hardcoded visual decisions.
- Do not nest cards inside cards unless there is a strong structural reason.
- Do not make the UI a one-color theme.
- Do not use random decoration or gradients.
- Use stable dimensions for elements that can cause layout shift.
- Do not scale font size with viewport width.

## Security Rules

- Do not store tokens in `localStorage`.
- Do not put secrets in client code.
- Do not rely on proxy as the only protection layer.
- Do not trust client data for prices, permissions, inventory, or account state.
- Separate server-only code with `server-only` when needed.
- Validate authorization inside Server Actions or the backend.

## Package And Tooling Rules

- Next.js 16 does not support `next lint`; use `eslint .`.
- After dependency changes, run `npm install`.
- Before delivery, run:

```bash
npm run typecheck
npm run lint
npm run build
```

After Agent Readiness changes, run at least these route and header checks:

```bash
curl -I /
curl -I /ar
curl -I /llms.txt
curl -I /.well-known/api-catalog
curl -I /openapi.json
curl -I /.well-known/mcp/server-card.json
curl -I /.well-known/agent-skills/index.json
curl -H "Accept: text/markdown" /ar
curl /ar/index.md
```

For final pages, run Lighthouse or Playwright/Lighthouse and target:

```txt
Performance: 100
Accessibility: 100
Best Practices: 100
SEO: 100
```

If a score cannot reach 100 because of an external factor, document the reason and do not claim completion.

## Template-Phase Prohibitions

Until the user asks to start the store:

- Do not connect Laravel API endpoints.
- Do not create product, cart, or checkout pages.
- Do not add store data or brand-specific content.
- Do not add payment or shipping providers.
- Do not add business-specific content.

Allowed during the template phase:

- Improve structure.
- Add generic placeholders.
- Prepare HTTP clients without endpoints.
- Prepare SEO helpers.
- Improve tooling and verification.
