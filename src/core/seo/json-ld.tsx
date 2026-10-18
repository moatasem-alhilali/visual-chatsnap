import { siteConfig } from "@/config/site";

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

/**
 * Renders schema.org structured data as `application/ld+json`.
 *
 * `dangerouslySetInnerHTML` is required for a JSON script tag. The payload is
 * built on the server from our own data (never user input) and every `<` is
 * escaped, so the JSON can't close the script tag early.
 */
export function JsonLd({ data }: { data: JsonLdValue }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export const absolute = (path: string) => new URL(path, siteConfig.url).toString();

/** The publisher behind the site (used by every page's structured data). */
export function organizationLd(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": absolute("/#organization"),
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absolute("/favicon/android-chrome-512x512.png"),
    sameAs: [siteConfig.repositoryUrl],
  };
}

export function websiteLd(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": absolute("/#website"),
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: siteConfig.locales,
    publisher: { "@id": absolute("/#organization") },
    description: siteConfig.description,
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function faqLd(faq: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
