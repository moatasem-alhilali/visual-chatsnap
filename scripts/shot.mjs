#!/usr/bin/env node
/**
 * Screenshot one platform template via the dev-only /preview route using the
 * locally installed Chrome in headless mode (no extra dependencies).
 *
 *   node scripts/shot.mjs <out.png> platform=whatsapp device=iphone theme=light \
 *        lang=en presence=online typing=0 scroll=bottom fixture=full [port=3000] [scale=2]
 *
 * Requires the dev server (`npm run dev`, port 3000 — override with port=… or PORT).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const [, , outArg, ...pairs] = process.argv;
if (!outArg) {
  console.error("usage: node scripts/shot.mjs <out.png> key=value ...");
  process.exit(1);
}
const opts = Object.fromEntries(pairs.map((p) => p.split("=")));
const port = opts.port ?? process.env.PORT ?? "3000";
const lang = opts.lang ?? "en";
const scale = opts.scale ?? "2";
const device = opts.device ?? "iphone";
delete opts.port;
delete opts.lang;
delete opts.scale;

// deviceOuter() footprint (iPhone 432×886, Samsung 389×804) + the 8px preview margin each side
const size = device === "android" ? { w: 405, h: 820 } : { w: 448, h: 902 };
const qs = new URLSearchParams({ device, ...opts }).toString();
const url = `http://localhost:${port}/${lang}/preview?${qs}`;

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error("Chrome not found; set CHROME_PATH");
  process.exit(1);
}

const out = resolve(outArg);
mkdirSync(dirname(out), { recursive: true });
// Own throw-away profile per shot: parallel runs never share/lock a profile,
// and a hard timeout so a stuck renderer can never hang the caller.
const profile = mkdtempSync(join(tmpdir(), "scenora-shot-"));
try {
execFileSync(
  chrome,
  [
    "--headless=new",
    `--user-data-dir=${profile}`,
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--force-device-scale-factor=${scale}`,
    `--window-size=${size.w},${size.h}`,
    "--virtual-time-budget=10000",
    `--screenshot=${out}`,
    url,
  ],
  { stdio: "pipe", timeout: Number(process.env.SHOT_TIMEOUT_MS ?? 120000), killSignal: "SIGKILL" },
);
} finally {
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* Chrome may still hold a file briefly on Windows */
  }
}
console.log(`${out}  <-  ${url}`);
