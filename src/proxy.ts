import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { applyAgentDiscoveryHeaders } from "./core/agent-readiness/headers";
import { getHomeMarkdownPath, isMarkdownAccept } from "./core/agent-readiness/resources";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest): NextResponse {
  const markdownPath = getHomeMarkdownPath(request.nextUrl.pathname);

  if (markdownPath && isMarkdownAccept(request.headers.get("Accept"))) {
    const url = request.nextUrl.clone();
    url.pathname = markdownPath;

    return applyAgentDiscoveryHeaders(NextResponse.rewrite(url), { markdownPath });
  }

  return applyAgentDiscoveryHeaders(intlMiddleware(request), { markdownPath });
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
