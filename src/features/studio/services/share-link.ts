import type { Message, Person, Scenario } from "../types";
import { SCENARIO_VERSION, createId } from "../data/defaults";
import { parseScenario } from "../validations/scenario";
import { isLibraryAsset } from "../data/media-library";

/**
 * Share links: the whole scenario travels in the URL hash (never sent to a
 * server — browsers do not transmit the fragment). Large image data URLs are
 * dropped to keep links short; the caller warns the user when that happens.
 *
 * Format: `#s=<codec><base64url>` where codec is `z` (deflate-raw via the
 * browser's CompressionStream) or `j` (plain JSON, for old browsers).
 */

export const SHARE_PREFIX = "#s=";
/** data URLs longer than this are dropped from shared links */
const MAX_INLINE_IMAGE = 2048;

export interface ShareResult {
  url: string;
  /** number of images (avatars + photos) that were left out */
  droppedImages: number;
  compressed: boolean;
}

function supportsCompression(): boolean {
  try {
    new CompressionStream("deflate-raw");
    return true;
  } catch {
    return false;
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(text: string): Uint8Array {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const piped = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

function keepImage(src: string | null | undefined): boolean {
  // built-in library SVGs are small and compress very well: always keep them
  return !!src && (!src.startsWith("data:") || src.length <= MAX_INLINE_IMAGE || isLibraryAsset(src));
}

/** Shareable copy: short ids, no heavy images. */
function slim(scenario: Scenario): { data: Scenario; dropped: number } {
  let dropped = 0;
  const person = (p: Person): Person => {
    if (p.avatar && !keepImage(p.avatar)) {
      dropped++;
      return { ...p, avatar: null };
    }
    return p;
  };
  const ids = new Map<string, string>();
  scenario.messages.forEach((m, i) => ids.set(m.id, (i + 1).toString(36)));
  const messages: Message[] = scenario.messages.map((m) => {
    const next: Message = { ...m, id: ids.get(m.id) ?? m.id };
    if (m.replyToId) next.replyToId = ids.get(m.replyToId) ?? null;
    if (m.imageSrc && !keepImage(m.imageSrc)) {
      dropped++;
      next.imageSrc = null;
    }
    if (m.link?.image && !keepImage(m.link.image)) {
      dropped++;
      next.link = { ...m.link, image: null };
    }
    return next;
  });
  let group = scenario.group ?? null;
  if (group) {
    let avatar = group.avatar;
    if (avatar && !keepImage(avatar)) {
      dropped++;
      avatar = null;
    }
    group = { ...group, avatar, members: group.members.map(person) };
  }
  return { data: { ...scenario, me: person(scenario.me), them: person(scenario.them), group, messages }, dropped };
}

/** Build a share URL for the scenario on the current page. */
export async function createShareLink(scenario: Scenario, baseUrl: string): Promise<ShareResult> {
  const { data, dropped } = slim(scenario);
  const json = new TextEncoder().encode(JSON.stringify(data));
  const compressed = supportsCompression();
  const payload = compressed
    ? `z${bytesToBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`
    : `j${bytesToBase64Url(json)}`;
  const url = `${baseUrl.split("#")[0]}${SHARE_PREFIX}${payload}`;
  return { url, droppedImages: dropped, compressed };
}

export function hasShareHash(hash: string): boolean {
  return hash.startsWith(SHARE_PREFIX) && hash.length > SHARE_PREFIX.length + 1;
}

/** Decode and validate a `#s=…` hash. Throws when it is malformed. */
export async function readShareHash(hash: string): Promise<Scenario> {
  const body = hash.slice(SHARE_PREFIX.length);
  const codec = body[0];
  const bytes = base64UrlToBytes(body.slice(1));
  let json: Uint8Array;
  if (codec === "z") json = await pipe(bytes, new DecompressionStream("deflate-raw"));
  else if (codec === "j") json = bytes;
  else throw new Error("unknown share codec");
  const scenario = parseScenario(JSON.parse(new TextDecoder().decode(json)));
  // fresh ids so a shared chat never collides with the local draft's ids
  const ids = new Map(scenario.messages.map((m) => [m.id, createId()] as const));
  return {
    ...scenario,
    version: SCENARIO_VERSION,
    messages: scenario.messages.map((m) => ({
      ...m,
      id: ids.get(m.id) ?? createId(),
      replyToId: m.replyToId ? (ids.get(m.replyToId) ?? null) : m.replyToId,
    })),
  };
}

/**
 * Copy text to the clipboard. Returns false when the Clipboard API is not
 * available (e.g. insecure context) — the share dialog then keeps the link
 * selected in its field so it can be copied manually.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
