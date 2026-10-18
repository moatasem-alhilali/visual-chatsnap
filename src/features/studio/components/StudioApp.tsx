"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Settings2, Timer, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Toaster, toast } from "@/shared/components/ui/toast";
import { cn } from "@/shared/lib/utils";
import { useStudioStore } from "../store";
import { usePlayback, type PlaybackView } from "../playback/usePlayback";
import { downloadScenarioJson, readScenarioFile } from "../services/scenario-file";
import { hasShareHash, readShareHash } from "../services/share-link";
import { migrateLegacySlot, updateProject } from "../services/project-storage";
import { buildFromTemplate, type ScenarioTemplate, type TemplateLang } from "../data/templates";
import type { Scenario } from "../types";
import { useStudioLayout } from "../hooks/useMediaQuery";
import { useElementSize } from "../hooks/useElementSize";
import { useStudioUi, type PanelTab, type StudioDialog } from "../hooks/useStudioUi";
import { undoTo, useMessageActions } from "../hooks/useMessageActions";
import { useStudioShortcuts } from "../hooks/useStudioShortcuts";
import { useProjectAutosave } from "../hooks/useProjects";
import { DeviceStage } from "./DeviceStage";
import { PlaybackControls } from "./PlaybackControls";
import { SettingsPanel } from "./SettingsPanel";
import { MessageEditor, MessageTools } from "./MessageEditor";
import { ExportDialog } from "./ExportDialog";
import { STUDIO_LABELS, type StudioLabels } from "./labels";
import { StudioHeader } from "./studio/StudioHeader";
import { StageToolbar } from "./studio/StageToolbar";
import { ShortcutsDialog } from "./studio/ShortcutsDialog";
import { RecordingStage } from "./studio/RecordingStage";
import { TemplateGallery } from "./studio/TemplateGallery";
import { TranscriptDialog, type TranscriptImport } from "./studio/TranscriptDialog";
import { ProjectsDialog } from "./studio/ProjectsDialog";
import { ShareDialog } from "./studio/ShareDialog";
import { fmt, formatSeconds, stepBounds } from "./studio/timing";

/** Centre zone: the phone on a studio backdrop with floating controls. */
function Stage({
  scenario,
  playback,
  t,
  dir,
  compact,
  onJump,
}: {
  scenario: Scenario;
  playback: PlaybackView;
  t: StudioLabels;
  dir: "rtl" | "ltr";
  compact: boolean;
  onJump: (id: string) => void;
}) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const selectedId = useStudioUi((s) => s.selectedId);

  return (
    <div className="studio-canvas relative h-full overflow-hidden">
      {!compact && (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center px-3">
          <StageToolbar scenario={scenario} t={t} dir={dir} />
        </div>
      )}
      <div ref={ref} className={cn("absolute inset-x-3", compact ? "top-3 bottom-[70px]" : "top-[66px] bottom-[92px]")}>
        <div className="flex h-full items-center justify-center">
          {size.height > 0 && <DeviceStage scenario={scenario} playback={playback} maxHeight={size.height} />}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
        <PlaybackControls
          playback={playback}
          messages={scenario.messages}
          composeTyping={scenario.composeTyping !== false}
          t={t}
          selectedId={selectedId}
          onJump={onJump}
          className="max-w-xl"
        />
      </div>
    </div>
  );
}

/** Setup / Messages tabs used when the screen is too narrow for three zones. */
function PanelTabs({
  tab,
  onTab,
  t,
  count,
  setup,
  messages,
  trailing,
}: {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  t: StudioLabels;
  count: number;
  setup: React.ReactNode;
  messages: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const tabs: { id: PanelTab; label: string }[] = [
    { id: "messages", label: t.tabMessages },
    { id: "setup", label: t.tabSetup },
  ];
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next = tab === "messages" ? "setup" : "messages";
    onTab(next);
    document.getElementById(`studio-tab-${next}`)?.focus();
  };
  return (
    <>
      <div className="flex h-11 shrink-0 items-stretch gap-5 border-b border-border ps-4 pe-2">
        <div role="tablist" aria-label={t.setup} onKeyDown={onKeyDown} className="flex items-stretch gap-5">
          {tabs.map((x) => {
            const active = tab === x.id;
            return (
              <button
                key={x.id}
                id={`studio-tab-${x.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`studio-panel-${x.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => onTab(x.id)}
                className={cn(
                  "relative flex cursor-pointer items-center gap-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:text-foreground focus-visible:after:bg-ring",
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors",
                  active ? "text-foreground after:bg-foreground" : "text-muted-foreground after:bg-transparent hover:text-foreground",
                )}
              >
                {x.label}
                {x.id === "messages" && (
                  <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </div>
        {trailing && <div className="ms-auto flex items-center gap-1">{trailing}</div>}
      </div>
      <div
        role="tabpanel"
        id={`studio-panel-${tab}`}
        aria-labelledby={`studio-tab-${tab}`}
        className={cn("flex min-h-0 flex-1 flex-col", tab === "setup" && "studio-scroll overflow-y-auto")}
      >
        {tab === "setup" ? setup : messages}
      </div>
    </>
  );
}

function StudioSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-background" aria-hidden>
      <div className="h-14 border-b border-border" />
      <div className="studio-canvas flex flex-1 items-center justify-center">
        <div className="h-[70%] max-h-[640px] w-[min(300px,60vw)] animate-pulse rounded-[44px] bg-foreground/5" />
      </div>
    </div>
  );
}

export function StudioApp() {
  const locale = useLocale() === "en" ? "en" : "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const t = STUDIO_LABELS[locale];

  const scenario = useStudioStore((s) => s.scenario);
  const projectId = useStudioStore((s) => s.projectId);
  const recording = useStudioStore((s) => s.recording);
  const setRecording = useStudioStore((s) => s.setRecording);
  const loadScenario = useStudioStore((s) => s.loadScenario);
  const newBlank = useStudioStore((s) => s.newBlank);
  const insertMessages = useStudioStore((s) => s.insertMessages);
  const setProjectId = useStudioStore((s) => s.setProjectId);
  const clearAll = useStudioStore((s) => s.clearAll);

  const panelTab = useStudioUi((s) => s.panelTab);
  const setPanelTab = useStudioUi((s) => s.setPanelTab);
  const select = useStudioUi((s) => s.select);
  const shortcutsOpen = useStudioUi((s) => s.shortcutsOpen);
  const setShortcutsOpen = useStudioUi((s) => s.setShortcutsOpen);
  const dialog = useStudioUi((s) => s.dialog);
  const openDialog = useStudioUi((s) => s.openDialog);

  const playback = usePlayback(scenario);
  const layout = useStudioLayout();
  const actions = useMessageActions(t);
  const importRef = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Avoid SSR/localStorage hydration mismatch from the persisted store.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useProjectAutosave(t, mounted);

  /** Replace the scenario as one undo step and offer "Undo" in a toast. */
  const replaceWithUndo = useCallback(
    (next: Scenario, nextProject: string | null, title: string) => {
      const before = useStudioStore.getState().scenario;
      loadScenario(next, nextProject);
      const after = useStudioStore.getState().scenario;
      playback.reset();
      select(null);
      toast({ title, variant: "success", action: { label: t.undo, onClick: () => undoTo(before, after) } });
    },
    [loadScenario, playback, select, t.undo],
  );

  // One-time migration of the old single save slot + open shared links (#s=…).
  const { legacyProjectName, sharedLoaded, sharedInvalid } = t;
  useEffect(() => {
    if (!mounted) return;
    migrateLegacySlot(legacyProjectName);
    const openShared = async () => {
      const hash = window.location.hash;
      if (!hasShareHash(hash)) return;
      // drop the payload from the address bar so a reload keeps local edits
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      try {
        const shared = await readShareHash(hash);
        replaceWithUndo(shared, null, sharedLoaded);
      } catch {
        toast({ title: sharedInvalid, variant: "destructive" });
      }
    };
    void openShared();
    window.addEventListener("hashchange", openShared);
    return () => window.removeEventListener("hashchange", openShared);
    // replaceWithUndo is stable enough for a mount-time effect; re-running would re-import
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const onSave = useCallback(() => {
    const { projectId: id, scenario: current } = useStudioStore.getState();
    if (!id) {
      openDialog("projects");
      return;
    }
    const r = updateProject(id, current);
    if (r.ok) toast({ title: fmt(t.savedToProject, { name: r.value.name }), variant: "success" });
    else if (r.reason === "missing") {
      setProjectId(null);
      openDialog("projects");
    } else toast({ title: t.storageFull, description: t.storageFullHint, variant: "destructive", duration: 6000 });
  }, [openDialog, setProjectId, t.savedToProject, t.storageFull, t.storageFullHint]);

  const onNew = () => {
    const before = useStudioStore.getState().scenario;
    newBlank();
    const after = useStudioStore.getState().scenario;
    playback.reset();
    select(null);
    setPanelTab("messages");
    toast({ title: t.newBlankDone, action: { label: t.undo, onClick: () => undoTo(before, after) } });
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      replaceWithUndo(await readScenarioFile(file), null, t.loaded);
    } catch {
      toast({ title: t.importFailed, variant: "destructive" });
    }
  };

  const onUseTemplate = (tpl: ScenarioTemplate, lang: TemplateLang) => {
    openDialog(null);
    setPanelTab("messages");
    replaceWithUndo(
      buildFromTemplate(tpl, lang, useStudioStore.getState().scenario),
      null,
      fmt(t.templateApplied, { name: t.templateItems[tpl.id].title }),
    );
  };

  const onTranscript = ({ messages, mode, people }: TranscriptImport) => {
    const before = useStudioStore.getState().scenario;
    insertMessages(messages, mode, people);
    const after = useStudioStore.getState().scenario;
    openDialog(null);
    setPanelTab("messages");
    playback.reset();
    toast({
      title: fmt(t.transcriptDone, { count: messages.length }),
      variant: "success",
      action: { label: t.undo, onClick: () => undoTo(before, after) },
    });
  };

  const startRecording = useCallback(() => setRecording(true), [setRecording]);
  const openExport = useCallback(() => setShowExport(true), []);

  const jump = useCallback(
    (id: string) => {
      setPanelTab("messages");
      select(id);
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-msg-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    },
    [select, setPanelTab],
  );

  useStudioShortcuts({
    enabled: mounted && !recording && !showExport && !confirmClear && !shortcutsOpen && !dialog,
    playback,
    onSave,
    onRecord: startRecording,
    onExport: openExport,
    onRemove: actions.remove,
    onDuplicate: actions.duplicate,
    onMove: actions.move,
  });

  if (!mounted) return <StudioSkeleton />;

  const toaster = <Toaster closeLabel={t.close} className="bottom-[104px] max-md:top-16 max-md:bottom-auto" />;

  if (recording) {
    return (
      <>
        <h1 className="sr-only">{t.appTitle}</h1>
        <RecordingStage scenario={scenario} playback={playback} t={t} onExit={() => setRecording(false)} />
        {toaster}
      </>
    );
  }

  const setup = <SettingsPanel scenario={scenario} t={t} lang={locale} />;
  const tabbed = layout !== "desktop";
  const liveId = playback.isLive ? (playback.messages[playback.messages.length - 1]?.id ?? null) : null;
  const messages = (
    <MessageEditor
      scenario={scenario}
      t={t}
      showHeader={!tabbed}
      liveId={liveId}
      following={playback.phase === "playing"}
    />
  );
  const totalMs = stepBounds(scenario.messages, { composeTyping: scenario.composeTyping !== false }).at(-1) ?? 0;
  const trailing = (
    <>
      <span className="flex items-center gap-1 px-1 text-xs text-muted-foreground" title={t.totalLength}>
        <Timer className="size-3.5" />
        <span className="sr-only">{t.totalLength}:</span>
        <span className="tabular-nums" dir="ltr">
          {formatSeconds(totalMs)}
          {t.seconds}
        </span>
      </span>
      {panelTab === "messages" && (
        <>
          <span aria-hidden className="h-4 w-px bg-border" />
          <MessageTools t={t} disabled={scenario.messages.length === 0} />
        </>
      )}
    </>
  );
  const stage = (
    <Stage scenario={scenario} playback={playback} t={t} dir={dir} compact={layout === "mobile"} onJump={jump} />
  );
  const closeDialog = (open: boolean) => {
    if (!open) openDialog(null);
  };
  const activeDialog: StudioDialog = dialog;

  return (
    <div className="studio-motion flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">{t.appTitle}</h1>
      <StudioHeader
        t={t}
        locale={locale}
        onNew={onNew}
        onSave={onSave}
        onImport={() => importRef.current?.click()}
        onExportJson={() => downloadScenarioJson(scenario)}
        onClear={() => setConfirmClear(true)}
        onRecord={startRecording}
        onExportVideo={openExport}
        onShortcuts={() => setShortcutsOpen(true)}
      />
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onImport(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {layout === "desktop" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[316px_minmax(0,1fr)_392px] 2xl:grid-cols-[340px_minmax(0,1fr)_430px]">
          <aside aria-label={t.setup} className="flex min-h-0 flex-col border-e border-border bg-studio-panel">
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
              <Settings2 className="size-3.5 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold">{t.setup}</h2>
            </div>
            <div className="studio-scroll min-h-0 flex-1 overflow-y-auto">{setup}</div>
          </aside>
          <main className="relative min-h-0 min-w-0">{stage}</main>
          <aside aria-label={t.messages} className="flex min-h-0 flex-col border-s border-border bg-studio-panel">
            {messages}
          </aside>
        </div>
      ) : layout === "tablet" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(340px,44%)]">
          <main className="relative min-h-0 min-w-0">{stage}</main>
          <aside aria-label={t.setup} className="flex min-h-0 flex-col border-s border-border bg-studio-panel">
            <PanelTabs tab={panelTab} onTab={setPanelTab} t={t} count={scenario.messages.length} setup={setup} messages={messages} trailing={trailing} />
          </aside>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="relative h-[46dvh] min-h-[300px] shrink-0 border-b border-border">{stage}</main>
          <section aria-label={t.setup} className="flex min-h-0 flex-1 flex-col bg-studio-panel">
            <PanelTabs tab={panelTab} onTab={setPanelTab} t={t} count={scenario.messages.length} setup={setup} messages={messages} trailing={trailing} />
          </section>
        </div>
      )}

      {toaster}

      {showExport && <ExportDialog scenario={scenario} t={t} onClose={() => setShowExport(false)} />}

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} t={t} />

      {activeDialog === "templates" && (
        <TemplateGallery open onOpenChange={closeDialog} t={t} locale={locale} scenario={scenario} onUse={onUseTemplate} />
      )}
      {activeDialog === "transcript" && (
        <TranscriptDialog open onOpenChange={closeDialog} t={t} locale={locale} scenario={scenario} onImport={onTranscript} />
      )}
      {activeDialog === "projects" && (
        <ProjectsDialog
          open
          onOpenChange={closeDialog}
          t={t}
          locale={locale}
          scenario={scenario}
          projectId={projectId}
          onOpenProject={(id, s, name) => {
            openDialog(null);
            replaceWithUndo(s, id, fmt(t.projectOpened, { name }));
          }}
          onCreated={(meta) => {
            setProjectId(meta.id);
            openDialog(null);
            toast({ title: fmt(t.projectCreated, { name: meta.name }), variant: "success" });
          }}
        />
      )}
      {activeDialog === "share" && <ShareDialog open onOpenChange={closeDialog} t={t} scenario={scenario} />}

      <Dialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={t.clearConfirmTitle}
        description={t.clearConfirmBody}
        icon={<Trash2 className="size-4 text-destructive" />}
        closeLabel={t.close}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmClear(false)} data-autofocus>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAll();
                select(null);
                setConfirmClear(false);
                toast({ title: t.cleared });
              }}
            >
              {t.clearConfirmAction}
            </Button>
          </>
        }
      />
    </div>
  );
}
