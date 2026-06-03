import { createAgentDiscoveryLinkHeader } from "@/core/agent-readiness/headers";
import { createHomeMarkdown } from "@/core/agent-readiness/markdown";
import { createMarkdownResponse, isAppLocale } from "@/core/agent-readiness/resources";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return new Response("Locale not found.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return createMarkdownResponse(createHomeMarkdown(locale), {
    headers: {
      Link: createAgentDiscoveryLinkHeader({ markdownPath: `/${locale}/index.md` }),
    },
  });
}
