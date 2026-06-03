import { createAgentDiscoveryLinkHeader } from "@/core/agent-readiness/headers";
import { createSkillMarkdown } from "@/core/agent-readiness/markdown";

export function GET(): Response {
  return new Response(createSkillMarkdown("public-content-discovery"), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "text/markdown; charset=utf-8",
      Link: createAgentDiscoveryLinkHeader(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
