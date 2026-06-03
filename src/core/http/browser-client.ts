"use client";

import { toApiError } from "@/core/http/errors";
import { buildApiHeaders } from "@/core/http/headers";
import type { ApiEnvelope, ApiRequestOptions, RequestContext } from "@/core/http/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

function getApiUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is required for browser API requests.");
  }

  return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function browserApi<TData>(
  path: string,
  options: ApiRequestOptions = {},
  context: RequestContext = {},
): Promise<ApiEnvelope<TData>> {
  const response = await fetch(getApiUrl(path), {
    ...options,
    credentials: "include",
    headers: buildApiHeaders(context, options.headers),
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as ApiEnvelope<TData>;
}
