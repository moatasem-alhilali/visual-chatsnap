"use client";

import { useId, useState } from "react";
import { Copy, Ellipsis, FolderOpen, FolderPlus, PenLine, Save, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { toast } from "@/shared/components/ui/toast";
import { cn } from "@/shared/lib/utils";
import type { Scenario } from "../../types";
import {
  createProject,
  deleteProject,
  duplicateProject,
  loadProject,
  renameProject,
  type ProjectMeta,
  type StorageResult,
} from "../../services/project-storage";
import { useProjects } from "../../hooks/useProjects";
import type { StudioLabels } from "../labels";
import { PlatformMark } from "./BrandMarks";
import { platformName } from "./Pickers";
import { fmt } from "./timing";

const NAME_MAX = 60;

function relativeTime(ts: number, locale: string): string {
  const diff = (ts - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 45) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(ts).toLocaleDateString(locale, { dateStyle: "medium" });
}

/** Suggested name for a new project: "<contact> · <platform>". */
export function suggestProjectName(scenario: Scenario, t: StudioLabels): string {
  const who = scenario.them.name.trim() || t.untitled;
  return `${who} · ${platformName(scenario.platform, scenario.device, t)}`.slice(0, NAME_MAX);
}

function ProjectRow({
  p,
  current,
  t,
  locale,
  dir,
  onOpen,
  onError,
}: {
  p: ProjectMeta;
  current: boolean;
  t: StudioLabels;
  locale: string;
  dir: "rtl" | "ltr";
  onOpen: (p: ProjectMeta) => void;
  onError: (r: StorageResult<unknown>) => void;
}) {
  const [mode, setMode] = useState<"idle" | "rename" | "confirm">("idle");
  const [name, setName] = useState(p.name);
  const renameId = useId();

  const saveName = () => {
    const clean = name.trim();
    if (!clean) return;
    if (clean !== p.name && !renameProject(p.id, clean)) onError({ ok: false, reason: "unavailable" });
    setMode("idle");
  };

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-2.5 transition-colors",
        current ? "border-primary/45 ring-[3px] ring-primary/10" : "border-border",
      )}
    >
      <div className="flex items-center gap-2.5">
        <PlatformMark platform={p.platform} device={p.device} size={30} />
        <div className="min-w-0 flex-1">
          {mode === "rename" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
              data-escape-scope=""
              className="flex items-center gap-1.5"
            >
              <label htmlFor={renameId} className="sr-only">
                {t.projectName}
              </label>
              <Input
                id={renameId}
                autoFocus
                value={name}
                maxLength={NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setName(p.name);
                    setMode("idle");
                  }
                }}
                aria-invalid={!name.trim() || undefined}
                dir="auto"
                className="h-7 text-[13px]"
              />
              <Button type="submit" size="xs" disabled={!name.trim()}>
                {t.projectSave}
              </Button>
            </form>
          ) : (
            <p className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13.5px] font-semibold" dir="auto">
                {p.name}
              </span>
              {current && (
                <span className="shrink-0 rounded bg-primary/12 px-1.5 py-px text-[10.5px] font-semibold text-primary">
                  {t.projectCurrent}
                </span>
              )}
            </p>
          )}
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {fmt(t.messagesCount, { count: p.messageCount })} · {relativeTime(p.updatedAt, locale)}
          </p>
        </div>
        {mode !== "rename" && (
          <>
            <Button
              variant={current ? "ghost" : "outline"}
              size="sm"
              disabled={current}
              onClick={() => onOpen(p)}
              aria-label={`${t.projectOpen}: ${p.name}`}
            >
              {t.projectOpen}
            </Button>
            <DropdownMenu dir={dir} modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`${t.moreActions}: ${p.name}`}>
                  <Ellipsis className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setMode("rename")}>
                  <PenLine /> {t.projectRename}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    const r = duplicateProject(p.id, fmt(t.projectCopyName, { name: p.name }).slice(0, NAME_MAX));
                    if (r.ok) toast({ title: t.projectDuplicated, variant: "success" });
                    else onError(r);
                  }}
                >
                  <Copy /> {t.duplicate}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setMode("confirm")}>
                  <Trash2 /> {t.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      {p.preview && mode !== "confirm" && (
        <p className="mt-1.5 truncate ps-10 text-xs text-muted-foreground" dir="auto">
          {p.preview}
        </p>
      )}
      {mode === "confirm" && (
        <div
          role="alertdialog"
          aria-label={t.projectDeleteTitle}
          className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-destructive/8 px-2.5 py-2"
        >
          <p className="min-w-0 flex-1 text-xs text-foreground">{fmt(t.projectDeleteBody, { name: p.name })}</p>
          <Button variant="outline" size="xs" onClick={() => setMode("idle")} autoFocus>
            {t.cancel}
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => {
              deleteProject(p.id);
              toast({ title: t.projectDeleted });
            }}
          >
            {t.delete}
          </Button>
        </div>
      )}
    </li>
  );
}

/** Projects saved in this browser: save as, open, rename, duplicate, delete. */
export function ProjectsDialog({
  open,
  onOpenChange,
  t,
  locale,
  scenario,
  projectId,
  onOpenProject,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: StudioLabels;
  locale: "ar" | "en";
  scenario: Scenario;
  projectId: string | null;
  onOpenProject: (id: string, scenario: Scenario, name: string) => void;
  onCreated: (meta: ProjectMeta) => void;
}) {
  const projects = useProjects();
  const [name, setName] = useState(() => suggestProjectName(scenario, t));
  const nameId = useId();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const reportError = (r: StorageResult<unknown>) => {
    if (r.ok) return;
    if (r.reason === "quota") toast({ title: t.storageFull, description: t.storageFullHint, variant: "destructive", duration: 6000 });
    else if (r.reason === "missing") toast({ title: t.projectMissing, variant: "destructive" });
    else toast({ title: t.storageUnavailable, variant: "destructive" });
  };

  const create = () => {
    const clean = name.trim();
    if (!clean) return;
    const r = createProject(clean, scenario);
    if (r.ok) onCreated(r.value);
    else reportError(r);
  };

  const openProject = (p: ProjectMeta) => {
    const s = loadProject(p.id);
    if (!s) {
      reportError({ ok: false, reason: "missing" });
      return;
    }
    onOpenProject(p.id, s, p.name);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.projectsTitle}
      description={t.projectsHint}
      icon={<FolderOpen className="size-4" />}
      closeLabel={t.close}
      className="max-w-lg"
    >
      <form
        className="rounded-xl border border-dashed border-border bg-muted/40 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label htmlFor={nameId} className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FolderPlus className="size-3.5" />
          {t.projectSaveAs}
        </label>
        <div className="flex gap-2">
          <Input
            id={nameId}
            data-autofocus
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.projectName}
            aria-invalid={!name.trim() || undefined}
            dir="auto"
            className="h-9"
          />
          <Button type="submit" disabled={!name.trim()} className="gap-1.5">
            <Save className="size-4" />
            {t.projectSave}
          </Button>
        </div>
      </form>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <FolderOpen className="size-5" />
          </span>
          <p className="text-sm font-semibold">{t.projectsEmpty}</p>
          <p className="mt-1 max-w-72 text-xs leading-relaxed text-muted-foreground">{t.projectsEmptyHint}</p>
        </div>
      ) : (
        <>
          <p className="mt-4 mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {fmt(t.projectsCount, { count: projects.length })}
          </p>
          <ul className="space-y-2">
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                p={p}
                current={p.id === projectId}
                t={t}
                locale={locale}
                dir={dir}
                onOpen={openProject}
                onError={reportError}
              />
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">{t.projectsPrivacy}</p>
    </Dialog>
  );
}
