import type { PlaybackView } from "../../playback/usePlayback";
import type { Message, Scenario } from "../../types";

export interface PlatformProps {
  scenario: Scenario;
  playback: PlaybackView;
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
