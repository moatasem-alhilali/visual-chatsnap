import type { Device, Platform } from "../types";

export type VideoSaveResult = "shared" | "downloaded" | "opened" | "cancelled";

function isoDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** e.g. scenora-whatsapp-iphone-2026-10-17.mp4 */
export function videoFileName(platform: Platform, device: Device, ext = "mp4"): string {
  return `scenora-${platform}-${device}-${isoDate()}.${ext}`;
}

export function createVideoFile(blob: Blob, platform: Platform, device: Device = "iphone"): File {
  return new File([blob], videoFileName(platform, device), { type: blob.type || "video/mp4" });
}

export function isTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  // iPadOS reports itself as a Mac
  return (navigator.maxTouchPoints ?? 0) > 1 && /Mac/.test(navigator.userAgent);
}

export function canShareVideoFile(file: File): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  try {
    return typeof nav.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function anchorDownload(file: File): string {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return url;
}

/** Trigger a plain file download (desktop default). */
export function downloadVideoFile(file: File): void {
  const url = anchorDownload(file);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Save the video the way the platform expects: the share sheet on phones
 * (Save Video / Save to Files / send to an app), a download elsewhere.
 * Must be called from a user gesture (share requires transient activation).
 */
export async function saveVideoFile(file: File, { preferShare = isTouchDevice() } = {}): Promise<VideoSaveResult> {
  if (preferShare && canShareVideoFile(file)) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "shared";
    } catch (e) {
      const name = (e as Error).name;
      if (name === "AbortError") return "cancelled";
      // NotAllowedError (activation expired) or a share target failure → fall back to download
    }
  }

  const url = anchorDownload(file);
  if (isTouchDevice()) {
    // iOS Safari ignores `download` for blobs in some versions; open it so the
    // user can long-press → Save Video.
    window.open(url, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return "opened";
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "downloaded";
}
