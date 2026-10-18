"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  CircleCheck,
  ClipboardPaste,
  Download,
  FilePlus2,
  Film,
  FolderOpen,
  Keyboard,
  Languages,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  LoaderCircle,
  Moon,
  Redo2,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
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
import { useStudioUi } from "../../hooks/useStudioUi";
import { useProjects } from "../../hooks/useProjects";
import type { StudioLabels } from "../labels";
import { modKey } from "./ShortcutsDialog";
import { fmt } from "./timing";

function AutosaveIndicator({ t }: { t: StudioLabels }) {
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);
  const projectId = useStudioStore((s) => s.projectId);
  const projects = useProjects();
  const project = projectId ? projects.find((p) => p.id === projectId) : undefined;

  useEffect(() => {
    const unsub = useStudioStore.subscribe((s, prev) => {
      if (s.scenario === prev.scenario) return;
      setSaving(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSaving(false), 800);
    });
    return () => {
      unsub();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const label = saving ? t.autosaving : project ? fmt(t.savedToProject, { name: project.name }) : t.autosaved;

  return (
    <Tooltip content={project ? t.projectAutosaveHint : t.autosavedHint}>
      <span
        tabIndex={0}
        role="status"
        aria-label={label}
        className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {saving ? (
          <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
        ) : (
          <CircleCheck className="size-3.5 shrink-0 text-primary" />
        )}
        <span className="hidden max-w-48 truncate lg:inline">{label}</span>
      </span>
    </Tooltip>
  );
}

function HistoryButtons({ t }: { t: StudioLabels }) {
  const canUndo = useStudioStore((s) => s.past.length > 0);
  const canRedo = useStudioStore((s) => s.future.length > 0);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const mod = modKey();
  return (
    <div role="group" aria-label={t.history} className="flex items-center">
      <Tooltip content={t.undo} shortcut={`${mod} Z`}>
        <Button variant="ghost" size="icon-sm" aria-label={t.undo} disabled={!canUndo} onClick={undo}>
          <Undo2 className="rtl:-scale-x-100" />
        </Button>
      </Tooltip>
      <Tooltip content={t.redo} shortcut={`${mod} ⇧ Z`}>
        <Button variant="ghost" size="icon-sm" aria-label={t.redo} disabled={!canRedo} onClick={redo}>
          <Redo2 className="rtl:-scale-x-100" />
        </Button>
      </Tooltip>
    </div>
  );
}

export function StudioHeader({
  t,
  locale,
  onNew,
  onSave,
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
  onImport: () => void;
  onExportJson: () => void;
  onClear: () => void;
  onRecord: () => void;
  onExportVideo: () => void;
  onShortcuts: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const openDialog = useStudioUi((s) => s.openDialog);
  const dark = resolvedTheme === "dark";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const mod = modKey();

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-background/85 px-2.5 backdrop-blur-xl sm:gap-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
        <span className="flex shrink-0 items-center gap-2">
          <Image
            src="/favicon/android-chrome-192x192.png"
            alt=""
            width={192}
            height={192}
            priority
            className="size-8"
          />
          <span className="font-sans text-[17px] font-semibold tracking-tight text-foreground max-sm:sr-only" dir="ltr">
            Scenora
          </span>
        </span>
        <span aria-hidden className="hidden h-5 w-px bg-border md:block" />
        <span className="hidden truncate text-[13px] font-medium text-muted-foreground xl:block">{t.studioBadge}</span>
        <AutosaveIndicator t={t} />
        <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
        <HistoryButtons t={t} />
      </div>

      <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
        <Tooltip content={t.aiCreateHint} shortcut="I">
          <Button
            variant="soft"
            size="sm"
            onClick={() => openDialog("ai")}
            aria-label={t.aiCreate}
            className="gap-1.5 px-2 max-md:size-8 max-md:px-0"
          >
            <Sparkles />
            <span className="hidden text-[13px] md:inline">{t.aiCreate}</span>
          </Button>
        </Tooltip>

        <Link href="/chat" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden gap-1.5 px-2 xl:inline-flex")}>
          <LayoutGrid />
          <span className="text-[13px]">{t.appsLink}</span>
        </Link>

        <Tooltip content={t.templatesHint}>
          <Button variant="ghost" size="sm" onClick={() => openDialog("templates")} className="hidden gap-1.5 px-2 lg:inline-flex">
            <LayoutTemplate />
            <span className="text-[13px]">{t.templates}</span>
          </Button>
        </Tooltip>

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
            className="max-sm:hidden"
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
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={onNew}>
              <FilePlus2 /> {t.newBlank}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openDialog("ai")}>
              <Sparkles /> {t.aiCreateMenu}
              <span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">I</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openDialog("templates")}>
              <LayoutTemplate /> {t.templatesMenu}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openDialog("projects")}>
              <FolderOpen /> {t.projectsMenu}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSave}>
              <Save /> {t.saveLong}
              <span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">
                {mod} S
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openDialog("transcript")}>
              <ClipboardPaste /> {t.pasteTranscriptMenu}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openDialog("share")}>
              <Link2 /> {t.shareMenu}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onImport}>
              <Upload /> {t.importJson}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExportJson}>
              <Download /> {t.exportJson}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setTheme(dark ? "light" : "dark")} className="sm:hidden">
              {dark ? <Sun /> : <Moon />} {dark ? t.themeLight : t.themeDark}
            </DropdownMenuItem>
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
          <Button size="sm" onClick={onExportVideo} className="gap-1.5 shadow-studio-card max-sm:px-2.5">
            <Film />
            <span className="max-sm:hidden">{t.exportVideo}</span>
            <span className="sm:hidden">{t.exportShort}</span>
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
