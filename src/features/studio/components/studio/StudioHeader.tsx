"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  CircleCheck,
  Download,
  FilePlus2,
  Film,
  FolderOpen,
  Keyboard,
  Languages,
  LoaderCircle,
  Moon,
  Save,
  Sun,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useStudioStore } from "../../store";
import type { StudioLabels } from "../labels";
import { modKey } from "./ShortcutsDialog";

function AutosaveIndicator({ t }: { t: StudioLabels }) {
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const unsub = useStudioStore.subscribe((s, prev) => {
      if (s.scenario === prev.scenario) return;
      setSaving(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSaving(false), 650);
    });
    return () => {
      unsub();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <Tooltip content={t.autosavedHint}>
      <span
        tabIndex={0}
        role="status"
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {saving ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <CircleCheck className="size-3.5 text-primary" />
        )}
        <span className="hidden lg:inline">{saving ? t.autosaving : t.autosaved}</span>
      </span>
    </Tooltip>
  );
}

export function StudioHeader({
  t,
  locale,
  onNew,
  onSave,
  onLoad,
  onImport,
  onExportJson,
  onClear,
  onRecord,
  onExportVideo,
  onShortcuts,
}: {
  t: StudioLabels;
  locale: "ar" | "en";
  onNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onImport: () => void;
  onExportJson: () => void;
  onClear: () => void;
  onRecord: () => void;
  onExportVideo: () => void;
  onShortcuts: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const mod = modKey();

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-1.5 border-b border-border bg-background/85 px-3 backdrop-blur-xl sm:gap-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex shrink-0 items-center gap-2">
          <Image
            src="/favicon/android-chrome-192x192.png"
            alt=""
            width={192}
            height={192}
            priority
            className="size-8"
          />
          <span className="font-sans text-[17px] font-semibold tracking-tight text-foreground" dir="ltr">
            Scenora
          </span>
        </span>
        <span aria-hidden className="hidden h-5 w-px bg-border md:block" />
        <span className="hidden truncate text-[13px] font-medium text-muted-foreground md:block">
          {t.studioBadge}
        </span>
        <AutosaveIndicator t={t} />
      </div>

      <div className="ms-auto flex items-center gap-1">
        <Tooltip content={t.shortcuts} shortcut="?">
          <Button variant="ghost" size="icon-sm" aria-label={t.shortcuts} onClick={onShortcuts} className="hidden md:inline-flex">
            <Keyboard />
          </Button>
        </Tooltip>

        <Tooltip content={t.language}>
          <Link
            href={pathname}
            locale={locale === "ar" ? "en" : "ar"}
            aria-label={`${t.language}: ${t.otherLanguage}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 px-2")}
          >
            <Languages />
            <span className="hidden text-xs sm:inline">{t.otherLanguage}</span>
          </Link>
        </Tooltip>

        <Tooltip content={dark ? t.themeLight : t.themeDark}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dark ? t.themeLight : t.themeDark}
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </Tooltip>

        <DropdownMenu dir={dir}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2" aria-label={t.fileMenu}>
              <FolderOpen />
              <span className="hidden text-[13px] sm:inline">{t.fileMenu}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem onSelect={onNew}>
              <FilePlus2 /> {t.newScenario}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSave}>
              <Save /> {t.saveLong}
              <span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">
                {mod} S
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onLoad}>
              <FolderOpen /> {t.loadLong}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onImport}>
              <Upload /> {t.importJson}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExportJson}>
              <Download /> {t.exportJson}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onClear}>
              <Trash2 /> {t.clear}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <Tooltip content={t.recordHint} shortcut="F">
          <Button variant="outline" size="sm" onClick={onRecord} aria-label={t.record} className="gap-1.5 max-sm:size-8 max-sm:px-0">
            <Video />
            <span className="hidden sm:inline">{t.recordShort}</span>
          </Button>
        </Tooltip>
        <Tooltip content={t.exportVideo} shortcut="E">
          <Button size="sm" onClick={onExportVideo} className="gap-1.5 shadow-studio-card">
            <Film />
            <span className="max-sm:hidden">{t.exportVideo}</span>
            <span className="sm:hidden">{t.exportShort}</span>
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
