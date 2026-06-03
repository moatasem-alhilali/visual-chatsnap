import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";

export function GET(): never {
  redirect(`/${siteConfig.defaultLocale}/index.md`);
}
