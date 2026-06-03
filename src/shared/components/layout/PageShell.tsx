import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <main className={`mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </main>
  );
}
