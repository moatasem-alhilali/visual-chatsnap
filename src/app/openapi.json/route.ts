import { siteConfig } from "@/config/site";
import { createAgentDiscoveryLinkHeader } from "@/core/agent-readiness/headers";
import { absoluteUrl } from "@/core/agent-readiness/resources";

export function GET(): Response {
  const openapi = {
    openapi: "3.1.0",
    info: {
      title: `${siteConfig.name} Public API`,
      version: "0.1.0",
      description:
        "This template currently exposes no public transactional APIs. Add only documented, safe public APIs here when a real project requires them.",
    },
    servers: [
      {
        url: siteConfig.url,
        description: "Current public site origin",
      },
    ],
    paths: {},
    tags: [],
    externalDocs: {
      description: "LLM and agent usage guide",
      url: absoluteUrl("/llms.txt"),
    },
  };

  return new Response(JSON.stringify(openapi, null, 2), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "application/vnd.oai.openapi+json; charset=utf-8",
      Link: createAgentDiscoveryLinkHeader(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
