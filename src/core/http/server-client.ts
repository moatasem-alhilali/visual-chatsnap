import "server-only";

import { cookies, headers } from "next/headers";

import { toApiError } from "@/core/http/errors";
import { buildApiHeaders } from "@/core/http/headers";
import type { ApiEnvelope, ApiRequestOptions, RequestContext } from "@/core/http/types";

const apiBaseUrl =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL;

function getApiUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new Error(
      "BACKEND_API_URL, NEXT_PUBLIC_API_URL, or NEXT_PUBLIC_BACKEND_API_URL is required for server API requests.",
    );
  }

  return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function serverApi<TData>(
  path: string,
  options: ApiRequestOptions = {},
  context: RequestContext = {},
): Promise<ApiEnvelope<TData>> {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const response = await fetch(getApiUrl(path), {
    ...options,
    credentials: "include",
    headers: buildApiHeaders(
      {
        locale: context.locale ?? requestHeaders.get("x-locale") ?? undefined,
        currency: context.currency ?? requestHeaders.get("x-currency") ?? undefined,
        country: context.country ?? requestHeaders.get("x-country") ?? undefined,
        cartToken: context.cartToken ?? cookieStore.get("cart_token")?.value,
      },
      options.headers,
    ),
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as ApiEnvelope<TData>;
}
