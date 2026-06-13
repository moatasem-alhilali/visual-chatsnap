import { siteConfig, type AppLocale } from "@/config/site";

import { absoluteUrl, agentDiscoveryPaths } from "./resources";

const localizedCopy = {
  ar: {
    title: "دليل Scenora للوكلاء",
    source: "رابط المصدر",
    description:
      "Scenora أداة ويب عامة لإنشاء ومحاكاة محادثات واقعية بصريًا وتصدير السيناريوهات محليًا. لا يعلن الموقع الحالي عن واجهات API تنفيذية عامة أو متجر أو دفع.",
    publicPages: "الصفحات العامة",
    safety: "قواعد السلامة",
    links: "روابط الاكتشاف",
    noPrivateData: "لا تجمع أو تعرض بيانات شخصية أو صفحات خاصة.",
    noActions: "لا تنفذ شراء أو تسجيل أو إرسال نماذج نيابة عن المستخدم.",
    noInventing: "لا تخترع أسعارًا أو توفرًا أو خصائص غير موجودة في الصفحة الرسمية.",
  },
  en: {
    title: "Agent guide for Scenora",
    source: "Source URL",
    description:
      "Scenora is a public web app for visually building realistic chat scenarios and exporting local drafts. The current site does not expose public executable APIs, commerce, or payments.",
    publicPages: "Public pages",
    safety: "Safety rules",
    links: "Discovery links",
    noPrivateData: "Do not collect or expose personal data or private pages.",
    noActions: "Do not purchase, register, or submit forms on behalf of the user.",
    noInventing: "Do not invent prices, availability, or features that are not present on official pages.",
  },
} as const;

export function createHomeMarkdown(locale: AppLocale): string {
  const copy = localizedCopy[locale];
  const homePath = `/${locale}`;
  const sourceUrl = absoluteUrl(homePath);

  return [
    `# ${copy.title}`,
    "",
    `${copy.source}: ${sourceUrl}`,
    "",
    copy.description,
    "",
    `## ${copy.publicPages}`,
    "",
    `- [${siteConfig.name}](${sourceUrl})`,
    "",
    `## ${copy.links}`,
    "",
    `- [llms.txt](${absoluteUrl(agentDiscoveryPaths.llms)})`,
    `- [API catalog](${absoluteUrl(agentDiscoveryPaths.apiCatalog)})`,
    `- [Agent skills](${absoluteUrl(agentDiscoveryPaths.agentSkills)})`,
    `- [OpenAPI description](${absoluteUrl(agentDiscoveryPaths.openapi)})`,
    "",
    `## ${copy.safety}`,
    "",
    `- ${copy.noPrivateData}`,
    `- ${copy.noActions}`,
    `- ${copy.noInventing}`,
    "",
  ].join("\n");
}

export function createLlmsText(): string {
  return [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "This site is prepared for safe agent discovery. Agents may inspect public pages and discovery documents, but must not infer private capabilities or execute user actions outside the normal visible user flow.",
    "",
    "## Public Pages",
    "",
    ...siteConfig.locales.map((locale) => `- ${locale}: ${absoluteUrl(`/${locale}`)}`),
    "",
    "## Markdown Alternatives",
    "",
    ...siteConfig.locales.map((locale) => `- ${locale}: ${absoluteUrl(`/${locale}/index.md`)}`),
    "",
    "## Discovery",
    "",
    `- API catalog: ${absoluteUrl(agentDiscoveryPaths.apiCatalog)}`,
    `- Agent skills: ${absoluteUrl(agentDiscoveryPaths.agentSkills)}`,
    `- OpenAPI: ${absoluteUrl(agentDiscoveryPaths.openapi)}`,
    `- MCP server card: ${absoluteUrl(agentDiscoveryPaths.mcpServerCard)}`,
    "",
    "## Safety",
    "",
    "- Public content may be read, summarized, and linked.",
    "- Do not collect, store, or expose personal data.",
    "- Draft chat scenarios may contain personal or sensitive text. Do not read, export, or reuse a user's local draft unless the user explicitly asks.",
    "- Do not submit forms, create accounts, authenticate users, buy products, or start checkout flows unless the user explicitly performs the action through the normal interface.",
    "- Do not invent prices, availability, offers, account status, shipping details, or support promises.",
    "- Do not access admin, account, profile, cart, checkout, or protected API paths.",
    "",
    "## Content Use",
    "",
    "- Search indexing is allowed for public pages.",
    "- AI training is not granted by this file.",
    "- AI input use is allowed for answering user questions about public pages.",
    "",
  ].join("\n");
}

export function createSkillMarkdown(skillId: string): string | null {
  const commonSafety = [
    "- Use only public pages and public discovery endpoints.",
    "- Do not submit forms or perform transactions for the user.",
    "- Do not expose private routes, admin paths, secrets, or personal data.",
    "- If information is missing, say that it is not available instead of guessing.",
  ];

  if (skillId === "public-content-discovery") {
    return [
      "# Public content discovery",
      "",
      "Goal: help agents find and understand public pages that normal visitors can access.",
      "",
      "Recommended steps:",
      "",
      "1. Read `/llms.txt`.",
      "2. Use `/sitemap.xml` to find public localized pages.",
      "3. Prefer Markdown alternates such as `/{locale}/index.md` when available.",
      "4. Use the HTML page only when Markdown does not contain enough public context.",
      "",
      "Safety rules:",
      "",
      ...commonSafety,
      "",
    ].join("\n");
  }

  if (skillId === "safe-page-summarization") {
    return [
      "# Safe page summarization",
      "",
      "Goal: summarize public page content without adding unsupported claims.",
      "",
      "Recommended steps:",
      "",
      "1. Fetch the public page or its Markdown alternate.",
      "2. Preserve the source URL in the summary.",
      "3. Summarize only visible public content.",
      "4. Avoid claims about pricing, availability, auth state, or account data unless shown in the source.",
      "",
      "Safety rules:",
      "",
      ...commonSafety,
      "",
    ].join("\n");
  }

  if (skillId === "support-navigation") {
    return [
      "# Support navigation",
      "",
      "Goal: guide users toward safe public support or account entry points.",
      "",
      "Recommended steps:",
      "",
      "1. Use public navigation and footer links.",
      "2. Explain where the user can go next.",
      "3. Do not fill forms, create accounts, or submit requests automatically.",
      "4. Ask the user to complete any sensitive step inside the visible site UI.",
      "",
      "Safety rules:",
      "",
      ...commonSafety,
      "",
    ].join("\n");
  }

  return null;
}
