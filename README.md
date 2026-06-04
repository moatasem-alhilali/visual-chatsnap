# Scenora

**Create Conversations. Tell Stories. Drive Results.**

Scenora is a realistic conversation **simulation studio** that runs entirely in the
browser. It lets marketers, content creators, agencies, e‑commerce owners, and
brands build authentic chat scenarios that look and behave exactly like the real
messaging apps — **WhatsApp, Telegram, Instagram DM, Snapchat, and iMessage** —
then play them back cinematically and export them as video for ads, promos, and
social content.

🔗 **Live:** https://visual-chatsnap.vercel.app

---

## ✨ What it does

- **Five pixel‑accurate platform templates** — each app has its own look *and feel*
  (headers, bubbles, tails, read receipts, typing indicators, online status,
  message animations). Not a single recoloured chat UI.
- **Realistic device mockups** — iPhone 15 Pro (Dynamic Island, San Francisco font)
  and Samsung Galaxy (centered punch‑hole, One UI status bar, Roboto). Each
  device renders its own platform variant.
- **Full direction support** — the whole mockup mirrors to RTL for Arabic and LTR
  for English, like a genuinely localized install of the app.
- **Scenario editor** — customize the two participants (name + avatar), pick the
  platform, device and theme, then add/edit/reorder messages with per‑message
  delay, typing duration, delivery/read status, time, and type (text/voice).
- **Cinematic playback** — messages appear gradually with the right per‑platform
  entrance animation, typing indicators, smooth auto‑scroll, and live
  sent → delivered → read transitions.
- **Recording Mode** — a clean, full‑screen stage with hideable controls, made
  for screen recording.
- **In‑browser video export** — generate a real **MP4** of the conversation with
  WebCodecs + snapdom + mp4‑muxer. No server, nothing uploaded.
- **Customization** — status‑bar icons (Wi‑Fi / cellular coverage / battery %),
  switchable Samsung system font, light & dark chat themes.
- **Local persistence** — autosaves your draft; Save / Load / Clear plus
  Export / Import scenario as JSON.

---

## 🧱 Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · shadcn/Radix UI
- **Zustand** (state + persistence) · **next-intl** (Arabic/English) ·
  **next-themes**
- **WebCodecs**, **@zumer/snapdom**, **mp4-muxer** (client‑side video export)

---

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /ar
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run verify` | typecheck + lint + build |

---

## 🗺️ How to use

1. Open the app and pick a **platform** (WhatsApp, Telegram, …) and a **device**
   (iPhone / Samsung).
2. Edit the **participants** (names + photos) and the **status bar**.
3. Add and arrange **messages**, tuning delay, typing time, and read status.
4. Press **Play** to preview the conversation cinematically.
5. Use **Recording Mode** to record your screen, or **Export Video** to download
   an MP4 directly.

---

## 📁 Project structure

```
src/
  app/[locale]/          App Router pages (the studio is the home page)
  features/studio/        The product
    components/           Editor, device frames, platform templates
      platforms/          WhatsApp, Telegram, Instagram, Snapchat, iMessage (+ Android variants)
      devices/            DeviceFrame, status bars, responsive scaler
    export/               Deterministic timeline + WebCodecs MP4 encoder
    playback/             Cinematic reveal engine
    store.ts / types.ts   Zustand store + domain model
  config/site.ts          Branding & SEO config
  core/seo/               Metadata helpers (bilingual SEO, OG, canonical, alternates)
dictionary/               ar.json / en.json (i18n + SEO strings)
```

---

## 🌍 Localization & SEO

Scenora ships bilingual (Arabic / English) SEO: localized `<title>`,
description, keywords, Open Graph, Twitter cards, canonical URLs, and
`hreflang` alternates — all driven from `dictionary/*.json` and
`src/config/site.ts`. Configure the deployment via env vars
(`NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL`, …).

---

## 📦 Environment variables

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_SITE_NAME` | `Scenora` |
| `NEXT_PUBLIC_SITE_URL` | `https://visual-chatsnap.vercel.app` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | (Scenora description) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `hello@scenora.app` |

---

## 📄 License

See [LICENSE](./LICENSE).
