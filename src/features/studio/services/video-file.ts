import type { Platform } from "../types";

export type VideoSaveResult = "shared" | "downloaded" | "opened";

export function createVideoFile(blob: Blob, platform: Platform): File {
  return new File([blob], `chat-${platform}.mp4`, { type: "video/mp4" });
}

export function isTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  return (navigator.maxTouchPoints ?? 0) > 1 && /Mac/.test(navigator.userAgent);
}

export function canShareVideoFile(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  return typeof nav.canShare === "function" && nav.canShare({ files: [file] });
}

function anchorDownload(file: File): string {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return url;
}

export async function saveVideoFile(file: File): Promise<VideoSaveResult> {
  if (isTouchDevice() && canShareVideoFile(file)) {
    await navigator.share({
      files: [file],
      title: "Scenora",
    });
    return "shared";
  }

  const url = anchorDownload(file);

  if (isTouchDevice()) {
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return "opened";
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 4_000);
  return "downloaded";
}
