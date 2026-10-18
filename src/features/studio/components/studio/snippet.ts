import type { Message } from "../../types";
import type { StudioLabels } from "../labels";

/** One-line description of a message for pickers, quotes and previews. */
export function messageSnippet(m: Message, t: StudioLabels, max = 48): string {
  if (m.type === "voice") return `🎤 ${t.voiceMessage}${m.voiceDuration ? ` (${m.voiceDuration})` : ""}`;
  const text = m.text.replace(/\s+/g, " ").trim();
  const short = text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
  if (m.type === "image") return short ? `📷 ${short}` : `📷 ${t.photo}`;
  return short || "…";
}
