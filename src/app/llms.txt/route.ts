import { createAgentDiscoveryLinkHeader } from "@/core/agent-readiness/headers";
import { createLlmsText } from "@/core/agent-readiness/markdown";

export function GET(): Response {
  return new Response(createLlmsText(), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "text/plain; charset=utf-8",
      Link: createAgentDiscoveryLinkHeader(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
