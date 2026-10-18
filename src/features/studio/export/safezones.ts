/**
 * Where each vertical-video app draws its own UI over a 9:16 frame, as
 * fractions of the frame (measured on 1080×1920 screenshots of the apps and
 * rounded outward a little; apps move things around between versions, so
 * these are guides, not guarantees).
 *
 *   top     header (tabs, search / progress bars, profile row)
 *   bottom  caption, user name, sound line, reply bar / nav bar
 *   left    a small edge margin
 *   right   the action rail (like, comment, share…) — `rail` is its vertical span
 */

export type SafeZoneId = "tiktok" | "reels" | "shorts" | "stories";

export interface SafeZone {
  id: SafeZoneId;
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** the right action rail, from `rail.top` down to the bottom band (null = no rail) */
  rail: { top: number } | null;
}

export const SAFE_ZONES: Record<SafeZoneId, SafeZone> = {
  // "Following | For You" + live/search; caption + sound + nav; avatar…share column
  tiktok: { id: "tiktok", top: 0.085, bottom: 0.235, left: 0.06, right: 0.14, rail: { top: 0.36 } },
  // "Reels" header + camera; caption + audio; like…audio column (sits low)
  reels: { id: "reels", top: 0.11, bottom: 0.22, left: 0.06, right: 0.13, rail: { top: 0.47 } },
  // search/more; title + channel + sound + nav; like…remix column
  shorts: { id: "shorts", top: 0.075, bottom: 0.25, left: 0.055, right: 0.14, rail: { top: 0.42 } },
  // progress bars + profile row; "Send message" bar
  stories: { id: "stories", top: 0.12, bottom: 0.12, left: 0.055, right: 0.055, rail: null },
};

export const SAFE_ZONE_IDS = Object.keys(SAFE_ZONES) as SafeZoneId[];

/** The clear area of the frame (fractions of each edge kept free). */
export function safeInset(z: SafeZone): { top: number; bottom: number; left: number; right: number } {
  return { top: z.top, bottom: z.bottom, left: z.left, right: z.right };
}
