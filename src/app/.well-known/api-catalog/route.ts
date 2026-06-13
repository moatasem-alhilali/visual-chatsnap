import { siteConfig } from "@/config/site";
import { createAgentDiscoveryLinkHeader } from "@/core/agent-readiness/headers";
import { absoluteUrl, agentDiscoveryPaths } from "@/core/agent-readiness/resources";

export function GET(): Response {
  const catalog = {
    linkset: [
      {
        anchor: siteConfig.url,
        "api-catalog": [
          {
            href: absoluteUrl(agentDiscoveryPaths.apiCatalog),
            type: "application/linkset+json",
            title: `${siteConfig.name} API catalog`,
          },
        ],
        "service-desc": [
          {
            href: absoluteUrl(agentDiscoveryPaths.openapi),
            type: "application/vnd.oai.openapi+json",
            title: "OpenAPI description",
          },
          {
            href: absoluteUrl(agentDiscoveryPaths.mcpServerCard),
            type: "application/json",
            title: "MCP server card",
          },
          {
            href: absoluteUrl(agentDiscoveryPaths.agentSkills),
            type: "application/json",
            title: "Agent skills index",
          },
        ],
        "service-doc": [
          {
            href: absoluteUrl(agentDiscoveryPaths.llms),
            type: "text/plain",
            title: "LLM guidance",
          },
          {
            href: absoluteUrl("/sitemap.xml"),
            type: "application/xml",
            title: "Sitemap",
          },
        ],
        alternate: siteConfig.locales.map((locale) => ({
          href: absoluteUrl(`/${locale}/index.md`),
          hreflang: locale,
          type: "text/markdown",
          title: `${locale} Markdown home`,
        })),
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "application/linkset+json; charset=utf-8",
      Link: createAgentDiscoveryLinkHeader(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
