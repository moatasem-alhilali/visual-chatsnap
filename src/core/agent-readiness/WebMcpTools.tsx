"use client";

import { useEffect } from "react";
import { siteConfig } from "@/config/site";

import { absoluteUrl, agentDiscoveryPaths } from "./resources";

type ToolInput = Record<string, unknown>;

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  execute: (input?: ToolInput) => Promise<unknown> | unknown;
};

type ModelContextLike = {
  registerTool?: (tool: WebMcpTool) => void | Promise<void>;
  register?: (tool: WebMcpTool) => void | Promise<void>;
  tools?: {
    register?: (tool: WebMcpTool) => void | Promise<void>;
  };
};

declare global {
  interface Navigator {
    modelContext?: ModelContextLike;
  }

  interface Window {
    __scenoraWebMcpToolsRegistered?: boolean;
  }
}

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

function localizedPages() {
  return siteConfig.locales.map((locale) => ({
    locale,
    path: `/${locale}`,
    url: absoluteUrl(`/${locale}`),
    markdown: absoluteUrl(`/${locale}/index.md`),
    title: `${siteConfig.name} (${locale})`,
    description: siteConfig.description,
  }));
}

function registerTool(modelContext: ModelContextLike, tool: WebMcpTool): void {
  if (modelContext.registerTool) {
    void modelContext.registerTool(tool);
    return;
  }

  if (modelContext.tools?.register) {
    void modelContext.tools.register(tool);
    return;
  }

  if (modelContext.register) {
    void modelContext.register(tool);
  }
}

export function WebMcpTools() {
  useEffect(() => {
    if (!window.__scenoraWebMcpToolsRegistered) {
      const modelContext = navigator.modelContext;
      if (!modelContext || window.__scenoraWebMcpToolsRegistered) return;

      const tools: WebMcpTool[] = [
        {
          name: "get_site_guide",
          description: "Return public Scenora guidance, safety rules, and discovery URLs.",
          inputSchema: { type: "object", additionalProperties: false, properties: {} },
          annotations: readOnlyAnnotations,
          execute: () => ({
            site: {
              name: siteConfig.name,
              url: siteConfig.url,
              locales: siteConfig.locales,
              description: siteConfig.description,
            },
            discovery: {
              llms: absoluteUrl(agentDiscoveryPaths.llms),
              apiCatalog: absoluteUrl(agentDiscoveryPaths.apiCatalog),
              openApi: absoluteUrl(agentDiscoveryPaths.openapi),
              agentSkills: absoluteUrl(agentDiscoveryPaths.agentSkills),
              mcpServerCard: absoluteUrl(agentDiscoveryPaths.mcpServerCard),
            },
            safety: [
              "Read public pages and discovery files only by default.",
              "Do not export, import, save, clear, record, or mutate local chat scenarios without explicit user action.",
              "Do not collect personal data, private chat content, secrets, tokens, or filenames.",
            ],
          }),
        },
        {
          name: "list_public_pages",
          description: "List localized public pages and Markdown alternates safe for agent discovery.",
          inputSchema: { type: "object", additionalProperties: false, properties: {} },
          annotations: readOnlyAnnotations,
          execute: () => ({ pages: localizedPages() }),
        },
        {
          name: "get_markdown_page",
          description: "Fetch Markdown for a safe localized public page.",
          inputSchema: {
            type: "object",
            additionalProperties: false,
            required: ["path"],
            properties: {
              path: {
                type: "string",
                description: "Use /ar, /en, /ar/index.md, or /en/index.md.",
              },
            },
          },
          annotations: readOnlyAnnotations,
          execute: async (input) => {
            const rawPath = typeof input?.path === "string" ? input.path : `/${siteConfig.defaultLocale}`;
            const normalized = rawPath.endsWith("/index.md") ? rawPath : `${rawPath.replace(/\/$/, "")}/index.md`;
            const allowed = siteConfig.locales.some((locale) => normalized === `/${locale}/index.md`);

            if (!allowed) {
              return {
                ok: false,
                message: "Markdown is available only for localized public home pages.",
              };
            }

            const response = await fetch(normalized, {
              cache: "no-store",
              headers: { Accept: "text/markdown" },
            });

            if (!response.ok) {
              return { ok: false, status: response.status };
            }

            return { ok: true, path: normalized, markdown: await response.text() };
          },
        },
        {
          name: "get_public_api_catalog",
          description: "Return discovery URLs. No executable transactional API paths are advertised.",
          inputSchema: { type: "object", additionalProperties: false, properties: {} },
          annotations: readOnlyAnnotations,
          execute: () => ({
            apiCatalog: absoluteUrl(agentDiscoveryPaths.apiCatalog),
            openApi: absoluteUrl(agentDiscoveryPaths.openapi),
            scope: "Discovery only. OpenAPI currently has no executable public paths.",
          }),
        },
      ];

      for (const tool of tools) registerTool(modelContext, tool);
      window.__scenoraWebMcpToolsRegistered = true;
    }
  }, []);

  return null;
}
