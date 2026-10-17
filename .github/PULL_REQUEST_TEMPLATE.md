## Summary

<!-- What does this PR change and why? Link the issue: "Closes #123". -->

## Type of change

- [ ] 🎯 Platform accuracy (template looks/behaves closer to the real app)
- [ ] ✨ Feature
- [ ] 🐞 Bug fix
- [ ] 🎬 Video export
- [ ] 🌐 Localization / docs
- [ ] 🧹 Refactor / chore

## Screenshots

<!-- Required for UI and template changes: before / after, ideally light + dark and en + ar.
     Template shots: `node scripts/shot.mjs out/x.png platform=… device=… theme=… lang=…`
     Add a real-app reference screenshot when you claim an accuracy fix. -->

| Before | After | Real app (reference) |
| --- | --- | --- |
|  |  |  |

## Checklist

- [ ] `npm run verify` passes (typecheck, lint, build)
- [ ] Checked in Arabic (RTL) and English (LTR)
- [ ] Checked light and dark themes (if UI)
- [ ] New UI strings added to both `dictionary/en.json` and `dictionary/ar.json`
- [ ] Template changes keep the contract (`data-mid`/`data-sender`, `PlatformMotion`, `clockMs`, no network assets) — see CONTRIBUTING.md
- [ ] Sources for design values are noted in the template's header comment
- [ ] No new dependencies (or discussed in an issue first)
