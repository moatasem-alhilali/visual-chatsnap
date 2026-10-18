# Contributing to Scenora

Thanks for helping! Scenora lives or dies by one thing: **a mockup must be indistinguishable from a real screenshot of the real app.** Pixel fixes are as valuable as features.

> مرحبًا بمساهماتك بالعربية أو الإنجليزية في الـ Issues والـ Pull Requests.

## Ways to contribute

- **Accuracy fixes:** a colour, radius, icon, spacing, wording or behaviour that differs from the real app. Use the *Platform accuracy* issue template and attach a real screenshot.
- **New templates or devices:** e.g. Messenger, Discord, Pixel, iPhone 17 Pro. Open a feature request first so we can agree on scope.
- **Studio and export improvements:** UX, performance, codecs, accessibility.
- **Translations and docs:** Arabic and English UI strings live in `dictionary/*.json`.

## Development setup

```bash
git clone https://github.com/<you>/visual-chatsnap.git
cd visual-chatsnap
npm install
npm run dev          # http://localhost:3000
```

Node.js 20.9+ is required (22 LTS recommended). Use **npm**: `package-lock.json` is the source of truth for CI.

Before pushing, run:

```bash
npm run verify       # typecheck + lint + build
```

## Project conventions

- Read [AGENTS.md](AGENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md). They describe folder boundaries (`app` → `features` → `core`/`shared`), Server vs Client Components, i18n, and SEO rules. They apply to humans too.
- **TypeScript strict, no `any`.** Prefer small, typed helpers over clever abstractions.
- **No new dependencies** without discussing them in an issue first. The export pipeline is deliberately dependency-light.
- **UI strings** go in `dictionary/en.json` and `dictionary/ar.json` (the `studio` namespace). Both languages are required; a missing Arabic key is a compile error.
- **RTL first.** Use logical properties (`ps-*`, `me-*`, `start`/`end`), and check every UI change in `/ar`.

## Working on a platform template

Templates live in `src/features/studio/components/platforms/`, one file per app × OS:

| App | iPhone | Samsung |
| --- | --- | --- |
| WhatsApp | `WhatsApp.tsx` | `WhatsAppAndroid.tsx` |
| Telegram | `Telegram.tsx` | `TelegramAndroid.tsx` |
| Instagram | `Instagram.tsx` | `InstagramAndroid.tsx` |
| Snapchat | `Snapchat.tsx` | `SnapchatAndroid.tsx` |
| iMessage | `iMessage.tsx` | `SamsungMessages.tsx` |
| Messenger | `Messenger.tsx` | `MessengerAndroid.tsx` |
| TikTok | `TikTok.tsx` | `TikTokAndroid.tsx` |
| X | `XChat.tsx` | `XChatAndroid.tsx` |
| Signal | `Signal.tsx` | `SignalAndroid.tsx` |
| Discord | `Discord.tsx` | `DiscordAndroid.tsx` |
| Viber | `Viber.tsx` | `ViberAndroid.tsx` |

### The contract

Every template must:

1. Take `PlatformProps` (`scenario`, `playback`, `lang`, `rtl`) and render the full screen: status bar, header, thread, composer and system bar.
2. Put `data-mid={m.id}` and `data-sender={m.sender}` on the **outermost element of each message row**. The exporter animates and targets these.
3. Use `useChatScroll` from `../shared` on the scrolling body and keep the `rcss-scroll` class on it.
4. Export a `PlatformMotion` (`enterMs`, `enterStyle(p, mine, rtl)`) that reproduces its live CSS entrance animation exactly, and register it in `platforms/index.tsx`.
5. When `playback.clockMs` is defined (video export), derive looping animations such as typing dots from it instead of CSS keyframes.
6. Prefix any keyframes with the file name (e.g. `wa-ios-pop`) and keep them in a component-scoped `<style>`.
7. Use no network images or fonts, and make nothing essential depend on `backdrop-filter`. The exporter snapshots the DOM, so draw "glass" as a near-opaque fill plus a hairline.
8. Support light and dark themes, RTL, text / emoji-only / voice / image (with and without caption), grouping, sent/delivered/read, typing, and presence.

### Sources

Put the key values and their source URLs in the comment block at the top of the file. Prefer primary sources:

- open-source clients (Telegram-iOS, Telegram Android)
- CSS variables from official web clients (web.whatsapp.com, instagram.com, Snapchat Web)
- Apple HIG colour data and Material 3 specs
- engineering and redesign coverage (WABetaInfo, 9to5Mac, Android Police)

Replicate the **current** shipping design, not an old one.

### Visual check

With `npm run dev` running:

```bash
node scripts/shot.mjs out/ig-android-dark-ar.png platform=instagram device=android theme=dark lang=ar typing=1
```

| Option | Values |
| --- | --- |
| `platform` | `whatsapp` · `telegram` · `instagram` · `snapchat` · `imessage` · `messenger` · `tiktok` · `x` · `signal` · `discord` · `viber` |
| `device` | `iphone` · `android` |
| `theme` | `light` · `dark` |
| `lang` | `en` · `ar` |
| `presence` | `online` · `typing` · `lastseen` |
| `typing=1` | force the typing indicator |
| `scroll` | `top` · `bottom` |
| `fixture` | `full` (every message type) · `default` |
| `play=1` | run live playback |
| `clock=<ms>` | simulate the export clock |
| `scale` | device pixel ratio (default 2) |
| `port` | dev server port (default 3000 or `$PORT`) |

You can also open `/en/preview?platform=…&device=…` in a browser. The route returns 404 in production.

**Please attach before/after screenshots** (light + dark, en + ar) to template PRs, next to a real reference screenshot when possible.

## Commits and pull requests

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`.
- Use [Conventional Commits](https://www.conventionalcommits.org/), e.g. `fix(whatsapp-android): voice note overflow at 360dp`, `feat(export): add 4:5 preset`.
- Keep PRs focused: one template or one feature per PR is ideal.
- Fill in the PR template, link the issue, and make sure CI is green.
- By contributing you agree that your work is licensed under the [MIT License](LICENSE).

## Responsible use

Scenora is a creative mockup tool. We won't accept contributions whose main purpose is deception, such as removing disclaimers, adding real users' data, or helping fake evidence. See the *Responsible use* section of the [README](README.md#responsible-use-and-trademarks).

## Questions

Open a [discussion or issue](https://github.com/moatasem-alhilali/visual-chatsnap/issues). Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.
