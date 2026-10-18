import type { Message } from "../../types";
import type { StudioLabels } from "../labels";

/** One-line description of a message for pickers, quotes and previews. */
export function messageSnippet(m: Message, t: StudioLabels, max = 48): string {
  if (m.type === "voice") return `🎤 ${t.voiceMessage}${m.voiceDuration ? ` (${m.voiceDuration})` : ""}`;
  if (m.type === "sticker") return m.text.trim() && !m.imageSrc ? `${m.text.trim()} ${t.typeSticker}` : `🖼️ ${t.typeSticker}`;
  if (m.type === "location") {
    const title = m.location?.title?.trim();
    return `📍 ${m.location?.live ? t.locationLive : title || t.typeLocation}${m.location?.live && title ? ` · ${title}` : ""}`;
  }
  if (m.type === "file") return `📄 ${m.file?.name?.trim() || t.typeFile}`;
  if (m.type === "call") {
    const c = m.call ?? { video: false, missed: false };
    const label = c.missed ? (c.video ? t.callMissedVideo : t.callMissedVoice) : c.video ? t.callVideo : t.callVoice;
    return `${c.video ? "📹" : "📞"} ${label}${!c.missed && c.duration ? ` · ${c.duration}` : ""}`;
  }
  if (m.type === "deleted") return `🚫 ${t.deletedPreview}`;
  const text = m.text.replace(/\s+/g, " ").trim();
  // slice by code points so an emoji is never cut in half
  const chars = Array.from(text);
  const short = chars.length > max ? `${chars.slice(0, max).join("").trimEnd()}…` : text;
  if (m.type === "image") return short ? `📷 ${short}` : `📷 ${t.photo}`;
  return short || "…";
}
