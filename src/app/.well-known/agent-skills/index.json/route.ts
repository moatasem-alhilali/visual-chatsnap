import { siteConfig } from "@/config/site";
import { createAgentDiscoveryLinkHeader } from "@/core/agent-readiness/headers";
import { absoluteUrl, agentSkills } from "@/core/agent-readiness/resources";

export function GET(): Response {
  const index = {
    version: "1.0",
    site: {
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      locales: siteConfig.locales,
    },
    safety: {
      autonomousTransactionsAllowed: false,
      formSubmissionAllowed: false,
      privateDataAccessAllowed: false,
      notes: [
        "Agents may inspect public pages and discovery documents.",
        "Agents must not access protected paths or submit forms for users.",
        "Only read-only browser discovery tools are described; no OAuth flows, remote MCP transport, or transactional commerce APIs are exposed.",
      ],
    },
    skills: agentSkills.map((skill) => ({
      id: skill.id,
      title: skill.title,
      description: skill.description,
      document: absoluteUrl(skill.documentPath),
      safeForAutonomousUse: skill.safeForAutonomousUse,
    })),
  };

  return new Response(JSON.stringify(index, null, 2), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "application/json; charset=utf-8",
      Link: createAgentDiscoveryLinkHeader(),
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
