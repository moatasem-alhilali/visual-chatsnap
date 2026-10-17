import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlatformPreview } from "@/features/studio/components/dev/PlatformPreview";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Dev-only screenshot harness for the platform templates (see PlatformPreview). */
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <PlatformPreview />
    </Suspense>
  );
}
