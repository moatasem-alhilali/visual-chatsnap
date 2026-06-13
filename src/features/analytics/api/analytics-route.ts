import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FORWARDED_HEADERS = [
  "user-agent",
  "x-vercel-ip-country",
  "x-vercel-ip-country-region",
  "x-vercel-ip-city",
  "x-vercel-ip-timezone",
  "cf-ipcountry",
] as const;

function analyticsEndpoint(): string | null {
  const configured =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!configured) return null;

  const base = configured.replace(/\/+$/, "");
  return base.endsWith("/api/v1")
    ? `${base}/visual-chats/analytics/track`
    : `${base}/api/v1/visual-chats/analytics/track`;
}

function forwardedHeaders(request: NextRequest): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  FORWARDED_HEADERS.forEach((key) => {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  });

  return headers;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const endpoint = analyticsEndpoint();
  if (!endpoint) return new NextResponse(null, { status: 204 });

  try {
    const body = await request.text();

    await fetch(endpoint, {
      method: "POST",
      headers: forwardedHeaders(request),
      body,
      cache: "no-store",
    });
  } catch {
    // Keep analytics failures invisible to visitors and creators.
  }

  return new NextResponse(null, { status: 204 });
}
