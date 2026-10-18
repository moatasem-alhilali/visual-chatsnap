# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Search engine optimisation:**
  - **Landing pages:** 22 server-rendered pages, one per app and language (`/[locale]/chat/[app]`), plus a hub (`/[locale]/chat`). Each has unique copy, a real template screenshot, an FAQ and a link that opens the studio with that app selected.
  - **Structured data:** JSON-LD for Organization, WebSite, WebApplication, BreadcrumbList, FAQPage and ItemList.
  - **Sitemap:** `hreflang` alternates and image entries.
  - **Metadata:** a 1200×600 share image, optional Google/Bing/Yandex verification tokens, and the theme colour.
  - **Home page:** an `h1` that is now in the server HTML.
  - **Speed:**
    - Landing pages no longer prefetch the studio bundle (306 KB less unused JavaScript).
    - Phone-mockup fonts are no longer preloaded.
    - Vercel analytics scripts load only on Vercel.
- **Create with AI:**
  - The studio builds a prompt you paste into any model (ChatGPT, Claude, Gemini). The model interviews you about the ad, then replies with one JSON block in the `scenora.v1` format, which you paste back.
  - The format covers every studio feature:
    - app, device and theme;
    - group chats;
    - all 8 message kinds, reactions, replies, "Edited", link previews and timing;
    - library avatars and photos, phone colour and font, status bar, compose typing and keyboard;
    - the video settings: format, safe zone, background, caption, end card, notification intro, zoom, speed and music.
  - Parsing is lenient: prose around the JSON, comments, trailing commas, smart quotes and many aliases are accepted. It also reports what it fixed.
  - Applying is one undoable step (`services/ai-scenario.ts`, `components/studio/AiScenarioDialog.tsx`).
- **Group chats in all 22 templates:**
  - each app's own group header, sender names and colours, member avatars, and "Name is typing…";
  - in the studio, a group editor and a "sent by" picker.
- **New message kinds in all 22 templates:**
  - stickers, locations (including live), files and calls;
  - deleted messages, the "Edited" label and link previews.
  - Where an app has no such feature, the template follows what that app really shows. For example, Discord and X just remove deleted messages, and Samsung Messages shows calls as a centred line.
- **Real on-screen keyboards:** the iOS 26 keyboard and the One UI 8 Samsung keyboard, in English and Arabic. They slide up while my messages are typed, show key presses and suggestions, and every template lifts its composer above them.
- **Studio:** a built-in media library (avatars and product photos), "Generate times" with per-message time locks, editors for every message kind, and four new templates.
- **Export:**
  - batch export to many app × phone combinations;
  - safe-zone guides and fitting for TikTok, Reels, Shorts and Stories;
  - a logo/text watermark and playback speed (0.75×–2×);
  - a camera that keeps the keyboard in shot.
- **Inside every template (22):**
  - **Reactions:** each app's own reaction style.
  - **Quoted replies:** each app's real reply block.
  - **Compose typing:** my messages are typed into the composer, which switches to that app's send button, before they are sent. Live preview and export share the same timing (`playback/compose.ts`).
- **Studio:**
  - **Editing:** a reaction picker and a "reply to" picker on each message, plus undo/redo for every edit.
  - **Content:** a gallery of 10 ready-made bilingual templates, paste-a-chat import (plain transcripts and WhatsApp exports), and smart timing.
  - **Saving and sharing:** named projects and compressed share links.
  - **Phone settings:** clock, battery level and phone colour.
  - **Motion menu:** switches the preview's auto-zoom, message animations and compose typing on or off.
- **Devices:**
  - iPhone 15 Pro titanium finishes and Galaxy S25 colours.
  - The status-bar clock and battery level can be customised, with low-battery colours.
- **Export:**
  - **Formats:** PNG/JPEG still images at 1–3× from any moment, and an optimised GIF encoder with a size cap.
  - **Scenes:** an iOS 26 / One UI 8 lock-screen notification intro that opens into the chat, an end card with logo, headline and CTA, and a caption with an optional pill that fades out while the camera zooms in.
  - **Audio:** background music (trim, volume, fades, loop) mixed with the sound effects.
  - **Camera and phone:** the camera frames the composer while a message is being typed, and the exported phone uses the chosen colour.
- **Six more apps, each with separate iPhone and Samsung templates (22 templates in total):**
  - **Messenger.**
  - **TikTok DMs:** measured from TikTok's 2025 product shots, and set in the official TikTok Sans font.
  - **X Chat:** measured from X's October 2026 App Store screenshot and its own Chat client bundles.
  - **Signal:** built from the Signal-iOS and Signal-Android source code.
  - **Discord DMs:** follows the August 2026 mobile refresh and the live client's colour tokens. It stays English and LTR, because Discord has no Arabic UI.
  - **Viber:** measured from App Store and Google Play captures.
  - **Studio:** each app has its own brand mark in the platform picker.
- **Ten app × OS templates**, each a separate implementation: WhatsApp, Telegram, Instagram and Snapchat for iPhone and for Samsung, plus iMessage (iPhone) and Samsung Messages (iMessage on Samsung). Each is rebuilt from the app's current 2026 design: Telegram from its open-source clients, WhatsApp and Instagram from their web design tokens, and iMessage from Apple's iOS 26 images.
- **Per-template entrance motion** (`PlatformMotion`) shared by live playback and video export, and a deterministic export clock (`clockMs`) for looping animations such as typing dots.
- **Auto-zoom camera:** a spring-driven camera that frames each new message and pans between both sides. It works in exported videos and live in the studio, with a toolbar toggle and Subtle / Medium / Strong intensity.
- **Video export overhaul:**
  - Formats: 9:16, 4:5, 1:1, 16:9 and phone-only.
  - Output: 30/60 fps and three quality levels.
  - Encoding: H.264 High with HEVC / VP9 / AV1 fallback.
  - Look and sound: new backgrounds, including a blurred-screen backdrop; optional synthesized sounds (AAC/Opus); intro/outro holds.
  - Delivery: progress with ETA, real cancel, and the share sheet on mobile.
- **Realistic devices:** iPhone 15 Pro and Galaxy S25 frames with iOS 26 and One UI 8 status bars, plus the One UI 3-button navigation bar.
- **Redesigned studio:**
  - Three-zone editor with tablet and mobile layouts, and studio light/dark themes.
  - Faster message editing (inline edits, drag to reorder, undo) and keyboard shortcuts.
  - Segmented playback timeline and recording mode.
- **Proper Arabic typography** inside the phones (Noto Sans Arabic instead of an Arial fallback).
- **Developer tooling:** a dev-only `/preview` route and `scripts/shot.mjs` for headless screenshots of any template.
- **Open-source project files:** README (EN/AR), contributing guide, code of conduct, security policy, issue and PR templates, CI and Dependabot.

### Fixed

- The live auto-zoom in the studio framed the wrong area: it measured in screen pixels without dividing out the stage scale.
- Saving export preferences no longer updates another component during render.
- The `/preview` harness re-pins scroll until layout settles, and `scripts/shot.mjs` uses an isolated Chrome profile with a timeout.

- The device frame was shrinking the phone screen. The iPhone screen was 365 pt wide instead of 393, and the Samsung screen 338 dp instead of 360.
- Square black corners appeared behind the rounded phone in exported videos.
- Text wrapping in exported frames could differ from the live preview.

### Changed

- Platform templates are code-split, so the studio only downloads the template on screen.
