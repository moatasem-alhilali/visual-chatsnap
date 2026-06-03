import type { RequestContext } from "@/core/http/types";

export function buildApiHeaders(context: RequestContext = {}, headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);

  nextHeaders.set("Accept", "application/json");

  if (!nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  if (context.locale) {
    nextHeaders.set("X-Locale", context.locale);
  }

  if (context.currency) {
    nextHeaders.set("X-Currency", context.currency);
  }

  if (context.country) {
    nextHeaders.set("X-Country", context.country);
  }

  if (context.cartToken) {
    nextHeaders.set("X-Cart-Token", context.cartToken);
  }

  return nextHeaders;
}
