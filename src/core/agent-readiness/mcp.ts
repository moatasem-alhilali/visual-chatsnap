import { siteConfig } from "@/config/site";

import { absoluteUrl, agentDiscoveryPaths } from "./resources";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function createMcpServerCard() {
  return {
    $schema: "https://modelcontextprotocol.io/schemas/server-card/v1.0",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: {
      name: siteConfig.shortName,
      title: siteConfig.name,
      url: siteConfig.url,
      description:
        "Scenora exposes public HTTPS discovery metadata and optional read-only browser tools. It does not expose an executable remote MCP transport.",
    },
    transport: {
      type: "https-discovery-only",
      url: siteConfig.url,
      executableMcp: false,
      note: "This card documents public HTTPS resources and WebMCP-style browser tools only.",
    },
    authentication: {
      type: "none",
      note: "Public discovery does not require authentication. Placeholder login/register pages are not wired to OAuth or OpenID Connect.",
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
      mutations: false,
    },
    tools: [
      {
        name: "get_site_guide",
        description: "Return public Scenora guidance, safety rules, and discovery URLs.",
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
        annotations: readOnlyAnnotations,
      },
      {
        name: "list_public_pages",
        description: "List localized public pages that are safe for agent discovery.",
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
        annotations: readOnlyAnnotations,
      },
      {
        name: "get_markdown_page",
        description: "Fetch the Markdown representation for a safe public localized page.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["path"],
          properties: {
            path: { type: "string", description: "A public path such as /ar, /en, /ar/index.md, or /en/index.md." },
          },
        },
        annotations: readOnlyAnnotations,
      },
      {
        name: "get_public_api_catalog",
        description: "Return public discovery links. No executable transactional API paths are exposed.",
        inputSchema: { type: "object", additionalProperties: false, properties: {} },
        annotations: readOnlyAnnotations,
      },
    ],
    resources: {
      llms: absoluteUrl(agentDiscoveryPaths.llms),
      apiCatalog: absoluteUrl(agentDiscoveryPaths.apiCatalog),
      openApi: absoluteUrl(agentDiscoveryPaths.openapi),
      agentSkills: absoluteUrl(agentDiscoveryPaths.agentSkills),
    },
    safety: [
      "Read-only discovery only.",
      "Do not export, import, save, clear, record, or mutate the user's local chat scenario unless the user explicitly performs that action in the visible UI.",
      "Do not collect personal data, secrets, tokens, filenames, or private chat content.",
      "Do not claim OAuth, OIDC, checkout, payments, or public transactional APIs are available.",
    ],
  };
}
