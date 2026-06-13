import type { NextResponse } from "next/server";

import { absoluteUrl, agentDiscoveryPaths } from "./resources";

type DiscoveryHeaderOptions = {
  markdownPath?: string | null;
};

type LinkHeaderItem = {
  href: string;
  rel: string;
  type?: string;
  title?: string;
  hreflang?: string;
};

function formatLinkHeaderItem(item: LinkHeaderItem): string {
  const attributes = [`rel="${item.rel}"`];

  if (item.type) {
    attributes.push(`type="${item.type}"`);
  }

  if (item.title) {
    attributes.push(`title="${item.title}"`);
  }

  if (item.hreflang) {
    attributes.push(`hreflang="${item.hreflang}"`);
  }

  return `<${item.href}>; ${attributes.join("; ")}`;
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get("Vary");

  if (!current) {
    headers.set("Vary", value);
    return;
  }

  const parts = current.split(",").map((part) => part.trim().toLowerCase());

  if (!parts.includes(value.toLowerCase())) {
    headers.set("Vary", `${current}, ${value}`);
  }
}

export function createAgentDiscoveryLinkHeader({
  markdownPath,
}: DiscoveryHeaderOptions = {}): string {
  const links: LinkHeaderItem[] = [
    {
      href: absoluteUrl(agentDiscoveryPaths.apiCatalog),
      rel: "api-catalog",
      type: "application/linkset+json",
      title: "API catalog",
    },
    {
      href: absoluteUrl(agentDiscoveryPaths.llms),
      rel: "service-doc",
      type: "text/plain",
      title: "LLM guidance",
    },
    {
      href: absoluteUrl(agentDiscoveryPaths.agentSkills),
      rel: "service-desc",
      type: "application/json",
      title: "Agent skills",
    },
    {
      href: absoluteUrl(agentDiscoveryPaths.mcpServerCard),
      rel: "service-desc",
      type: "application/json",
      title: "MCP server card",
    },
    {
      href: absoluteUrl(agentDiscoveryPaths.openapi),
      rel: "service-desc",
      type: "application/vnd.oai.openapi+json",
      title: "OpenAPI description",
    },
  ];

  if (markdownPath) {
    links.push({
      href: absoluteUrl(markdownPath),
      rel: "alternate",
      type: "text/markdown",
      title: "Markdown alternate",
      hreflang: markdownPath.split("/")[1],
    });
  }

  return links.map(formatLinkHeaderItem).join(", ");
}

export function applyAgentDiscoveryHeaders(
  response: NextResponse,
  options: DiscoveryHeaderOptions = {},
): NextResponse {
  response.headers.set("Link", createAgentDiscoveryLinkHeader(options));
  response.headers.set("X-Content-Type-Options", "nosniff");
  appendVary(response.headers, "Accept");

  return response;
}

export function createDiscoveryHeaders(options: DiscoveryHeaderOptions = {}): Headers {
  const headers = new Headers();
  headers.set("Link", createAgentDiscoveryLinkHeader(options));
  headers.set("X-Content-Type-Options", "nosniff");
  appendVary(headers, "Accept");

  return headers;
}
