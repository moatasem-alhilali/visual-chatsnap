#!/usr/bin/env node
/**
 * Screenshot one platform template via the dev-only /preview route using the
 * locally installed Chrome in headless mode (no extra dependencies).
 *
 *   node scripts/shot.mjs <out.png> platform=whatsapp device=iphone theme=light \
 *        lang=en presence=online typing=0 scroll=bottom fixture=full [port=3002] [scale=2]
 *
 * Requires the dev server (`npm run dev`, port from .claude/launch.json = 3002).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [, , outArg, ...pairs] = process.argv;
if (!outArg) {
  console.error("usage: node scripts/shot.mjs <out.png> key=value ...");
  process.exit(1);
}
const opts = Object.fromEntries(pairs.map((p) => p.split("=")));
const port = opts.port ?? "3002";
const lang = opts.lang ?? "en";
const scale = opts.scale ?? "2";
const device = opts.device ?? "iphone";
delete opts.port;
delete opts.lang;
delete opts.scale;

// DEVICE_SPEC w/h (border-box, bezel included) + 8px margin each side
const size = device === "android" ? { w: 376, h: 796 } : { w: 409, h: 868 };
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
execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--force-device-scale-factor=${scale}`,
    `--window-size=${size.w},${size.h}`,
    "--virtual-time-budget=8000",
    `--screenshot=${out}`,
    url,
  ],
  { stdio: "pipe" },
);
console.log(`${out}  <-  ${url}`);
