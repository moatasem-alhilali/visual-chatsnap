import type { PlaybackView } from "../../playback/usePlayback";
import type { Message, Scenario } from "../../types";
import type { Lang } from "./chrome";

export interface PlatformProps {
  scenario: Scenario;
  playback: PlaybackView;
  /** UI language — drives in-mockup chrome strings */
  lang: Lang;
  /** true when the whole mockup should mirror (Arabic UI) */
  rtl: boolean;
}

export interface GroupInfo {
  firstOfGroup: boolean;
  lastOfGroup: boolean;
}

export function groupInfo(messages: Message[], i: number): GroupInfo {
  const m = messages[i];
  const prev = messages[i - 1];
  const next = messages[i + 1];
  return {
    firstOfGroup: !prev || prev.sender !== m.sender,
    lastOfGroup: !next || next.sender !== m.sender,
  };
}

/**
 * Per-platform, per-OS entrance motion. Live playback uses the template's own
 * CSS keyframes; the video exporter has no running CSS animations, so it calls
 * `enterStyle` every frame for each message row (`[data-mid]`, sender read from
 * `data-sender`). Both must describe the SAME motion so preview == export.
 */
export interface PlatformMotion {
  /** entrance duration in ms */
  enterMs: number;
  /** inline style for a message row at progress p ∈ [0,1] (0 = just revealed, 1 = settled) */
  enterStyle: (
    p: number,
    mine: boolean,
    rtl: boolean,
  ) => { opacity?: number; transform?: string; transformOrigin?: string };
}
