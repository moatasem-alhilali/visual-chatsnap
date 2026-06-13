import { createAgentDiscoveryLinkHeader } from "@/core/agent-readiness/headers";
import { createMcpServerCard } from "@/core/agent-readiness/mcp";

export function GET(): Response {
  return new Response(JSON.stringify(createMcpServerCard(), null, 2), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "application/json; charset=utf-8",
      Link: createAgentDiscoveryLinkHeader(),
      "X-Content-Type-Options": "nosniff",
      Vary: "Accept",
    },
  });
}
