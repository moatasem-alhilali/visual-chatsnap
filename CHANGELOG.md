# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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

- The device frame was shrinking the phone screen. The iPhone screen was 365 pt wide instead of 393, and the Samsung screen 338 dp instead of 360.
- Square black corners appeared behind the rounded phone in exported videos.
- Text wrapping in exported frames could differ from the live preview.

### Changed

- Platform templates are code-split, so the studio only downloads the template on screen.
