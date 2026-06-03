"use client";

import { Menu, X } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/shared/components/LanguageSwitcher";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { Button } from "@/shared/components/ui/button";
import { siteConfig } from "@/config/site";
import { useUiStore } from "@/stores/ui-store";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isOpen = useUiStore((state) => state.isNavigationOpen);
  const setOpen = useUiStore((state) => state.setNavigationOpen);
  const toggleOpen = useUiStore((state) => state.toggleNavigation);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            {siteConfig.shortName.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-sm sm:text-base">{siteConfig.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Button key={item.href} asChild variant={active ? "secondary" : "ghost"} size="sm">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          onClick={toggleOpen}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {isOpen ? (
        <nav className="border-t border-border bg-background px-4 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigation.map((item) => (
              <Button key={item.href} asChild variant="ghost" className="justify-start">
                <Link href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </Button>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-border pt-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
