import type { LinkPreview } from "../types";

/**
 * Link previews are drafted locally (nothing is fetched): the first URL in a
 * message gives the url, the site name and a readable title from the host,
 * which the user then edits.
 */

const URL_RE =
  /(?:https?:\/\/[^\s<>"'«»]+|www\.[^\s<>"'«»]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|sa|ae|kw|qa|bh|om|eg|store|shop|app|me|ly|link|ai|dev|uk|us)(?:\/[^\s<>"'«»]*)?)/i;

/** First URL-looking token of a text (trailing punctuation trimmed). */
export function firstUrl(text: string): string | null {
  const m = URL_RE.exec(text);
  if (!m) return null;
  return m[0].replace(/[.,!?;:)\]،؟…]+$/u, "");
}

/** "https://www.noon.store/track" → "noon.store" */
export function hostOf(url: string): string {
  const bare = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  return bare.split(/[/?#]/)[0].toLowerCase();
}

/** "kicks-lab.co" → "Kicks Lab" */
export function titleFromHost(host: string): string {
  const labels = host.split(".");
  const name = labels.length > 1 ? labels[labels.length - 2] : labels[0];
  // keep two-letter second-level names like "com.sa" readable
  const pick = name.length <= 3 && labels.length > 2 ? labels[labels.length - 3] : name;
  return pick
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** A first draft of a link preview for a URL. */
export function draftLinkPreview(url: string): LinkPreview {
  const host = hostOf(url);
  return {
    url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
    title: titleFromHost(host),
    description: "",
    siteName: host,
    image: null,
  };
}

/**
 * Keep an existing preview in step with an edited URL: the url always
 * follows, the title / site follow only while they still hold the
 * auto-filled value of the previous URL.
 */
export function syncLinkPreview(link: LinkPreview, url: string): LinkPreview {
  const next = draftLinkPreview(url);
  if (next.url === link.url) return link;
  const prevHost = hostOf(link.url);
  return {
    ...link,
    url: next.url,
    title: !link.title || link.title === titleFromHost(prevHost) ? next.title : link.title,
    siteName: !link.siteName || link.siteName === prevHost ? next.siteName : link.siteName,
  };
}
