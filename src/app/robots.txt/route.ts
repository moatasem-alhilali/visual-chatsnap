import { siteConfig } from "@/config/site";
import { absoluteUrl, privateRobotDisallows } from "@/core/agent-readiness/resources";

export function GET(): Response {
  const lines = [
    `# Robots policy for ${siteConfig.name}`,
    "User-agent: *",
    "Allow: /",
    ...privateRobotDisallows.map((path) => `Disallow: ${path}`),
    "",
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
