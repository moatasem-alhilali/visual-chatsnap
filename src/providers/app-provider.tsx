"use client";

import { QueryProvider } from "@/providers/query-provider";
import { WebMcpTools } from "@/core/agent-readiness/WebMcpTools";
import { ThemeProvider } from "@/shared/components/theme-provider";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <WebMcpTools />
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
