import type { Device } from "../types";

/** iPhone uses Apple's real system font (San Francisco) when available — on
 *  Apple devices `-apple-system`/`SF Pro` resolve to the genuine SF typeface;
 *  elsewhere it falls back to Inter (the closest SF-like face) then Arabic. */
const IPHONE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

export type AndroidFontId = "roboto" | "cairo" | "tajawal";

/** Fonts the user can switch the Samsung device to (Samsung lets you change the
 *  system font, so this only applies to the Android mockup). */
export const ANDROID_FONTS: { id: AndroidFontId; label: string; family: string }[] = [
  { id: "roboto", label: "Roboto", family: 'var(--font-roboto), var(--font-tajawal), system-ui, sans-serif' },
  { id: "cairo", label: "Cairo", family: 'var(--font-cairo), system-ui, sans-serif' },
  { id: "tajawal", label: "Tajawal", family: 'var(--font-tajawal), system-ui, sans-serif' },
];

export function deviceFontFamily(device: Device, androidFont: string): string {
  if (device === "iphone") return IPHONE_FONT;
  const f = ANDROID_FONTS.find((x) => x.id === androidFont) ?? ANDROID_FONTS[0];
  return f.family;
}
