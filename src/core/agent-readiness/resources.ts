import { siteConfig, type AppLocale } from "@/config/site";

export type AgentSkill = {
  id: string;
  title: string;
  description: string;
  documentPath: string;
  safeForAutonomousUse: boolean;
};

export const agentDiscoveryPaths = {
  apiCatalog: "/.well-known/api-catalog",
  agentSkills: "/.well-known/agent-skills/index.json",
  llms: "/llms.txt",
  mcpServerCard: "/.well-known/mcp/server-card.json",
  openapi: "/openapi.json",
} as const;

export const privateRobotDisallows = [
  "/api/",
  "/admin",
  "/checkout",
  "/account",
  "/cart",
  "/profile",
  "/login",
  "/*/account",
  "/*/cart",
  "/*/checkout",
  "/*/login",
  "/*/profile",
  "/*/register",
  "/*/dashboard",
  "/*/preview",
] as const;

export const agentSkills: AgentSkill[] = [
  {
    id: "public-content-discovery",
    title: "Public content discovery",
    description: "Find safe public pages and summarize what is visible to normal users.",
    documentPath: "/.well-known/agent-skills/public-content-discovery.md",
    safeForAutonomousUse: true,
  },
  {
    id: "safe-page-summarization",
    title: "Safe page summarization",
    description: "Summarize public pages without collecting personal data or inventing unavailable details.",
    documentPath: "/.well-known/agent-skills/safe-page-summarization.md",
    safeForAutonomousUse: true,
  },
  {
    id: "support-navigation",
    title: "Support navigation",
    description: "Guide users toward public support and account entry points without submitting forms for them.",
    documentPath: "/.well-known/agent-skills/support-navigation.md",
    safeForAutonomousUse: true,
  },
] as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

export function isAppLocale(locale: string): locale is AppLocale {
  return (siteConfig.locales as readonly string[]).includes(locale);
}

export function isMarkdownAccept(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return false;
  }

  return acceptHeader
    .toLowerCase()
    .split(",")
    .some((value) => {
      const mediaType = value.trim().split(";")[0];
      return mediaType === "text/markdown" || mediaType === "text/x-markdown";
    });
}

export function getHomeMarkdownPath(pathname: string): string | null {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  if (cleanPath === "/") {
    return `/${siteConfig.defaultLocale}/index.md`;
  }

  const locale = cleanPath.slice(1);

  if (isAppLocale(locale)) {
    return `/${locale}/index.md`;
  }

  return null;
}

export function createMarkdownResponse(body: string, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  appendVary(headers, "Accept");

  return new Response(body, {
    ...init,
    headers,
  });
}

export function createJsonResponse(
  body: unknown,
  init?: ResponseInit & { contentType?: string },
): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", init?.contentType ?? "application/json; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers,
  });
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
