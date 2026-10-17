"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Settings2, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Toaster, toast } from "@/shared/components/ui/toast";
import { cn } from "@/shared/lib/utils";
import { useStudioStore } from "../store";
import { usePlayback, type PlaybackView } from "../playback/usePlayback";
import { downloadScenarioJson, readScenarioFile } from "../services/scenario-file";
import type { Scenario } from "../types";
import { useStudioLayout } from "../hooks/useMediaQuery";
import { useElementSize } from "../hooks/useElementSize";
import { useStudioUi, type PanelTab } from "../hooks/useStudioUi";
import { useMessageActions } from "../hooks/useMessageActions";
import { useStudioShortcuts } from "../hooks/useStudioShortcuts";
import { DeviceStage } from "./DeviceStage";
import { PlaybackControls } from "./PlaybackControls";
import { SettingsPanel } from "./SettingsPanel";
import { MessageEditor } from "./MessageEditor";
import { ExportDialog } from "./ExportDialog";
import { STUDIO_LABELS, type StudioLabels } from "./labels";
import { StudioHeader } from "./studio/StudioHeader";
import { StageToolbar } from "./studio/StageToolbar";
import { ShortcutsDialog } from "./studio/ShortcutsDialog";
import { RecordingStage } from "./studio/RecordingStage";

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
}: {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  t: StudioLabels;
  count: number;
  setup: React.ReactNode;
  messages: React.ReactNode;
}) {
  const tabs: { id: PanelTab; label: string }[] = [
    { id: "messages", label: t.tabMessages },
    { id: "setup", label: t.tabSetup },
  ];
  return (
    <>
      <div role="tablist" aria-label={t.setup} className="flex h-11 shrink-0 items-stretch gap-5 border-b border-border px-4">
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
              onClick={() => onTab(x.id)}
              className={cn(
                "relative flex cursor-pointer items-center gap-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:text-foreground",
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
  const recording = useStudioStore((s) => s.recording);
  const setRecording = useStudioStore((s) => s.setRecording);
  const loadScenario = useStudioStore((s) => s.loadScenario);
  const resetScenario = useStudioStore((s) => s.resetScenario);
  const saveSlot = useStudioStore((s) => s.saveSlot);
  const loadSlot = useStudioStore((s) => s.loadSlot);
  const clearAll = useStudioStore((s) => s.clearAll);

  const panelTab = useStudioUi((s) => s.panelTab);
  const setPanelTab = useStudioUi((s) => s.setPanelTab);
  const select = useStudioUi((s) => s.select);
  const shortcutsOpen = useStudioUi((s) => s.shortcutsOpen);
  const setShortcutsOpen = useStudioUi((s) => s.setShortcutsOpen);

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

  const notifySaved = useCallback(() => {
    saveSlot();
    toast({ title: t.saved, variant: "success" });
  }, [saveSlot, t.saved]);

  const onLoad = () => {
    const ok = loadSlot();
    toast({ title: ok ? t.loaded : t.noSave, variant: ok ? "success" : "default" });
  };

  const onNew = () => {
    const snapshot = useStudioStore.getState().scenario;
    resetScenario();
    select(null);
    toast({
      title: t.newScenarioDone,
      action: { label: t.undo, onClick: () => loadScenario(snapshot) },
    });
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      loadScenario(await readScenarioFile(file));
      select(null);
      toast({ title: t.loaded, variant: "success" });
    } catch {
      toast({ title: t.importFailed, variant: "destructive" });
    }
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
    enabled: mounted && !recording && !showExport && !confirmClear && !shortcutsOpen,
    playback,
    onSave: notifySaved,
    onRecord: startRecording,
    onExport: openExport,
    onRemove: actions.remove,
    onDuplicate: actions.duplicate,
    onMove: actions.move,
  });

  if (!mounted) return <StudioSkeleton />;

  const toaster = <Toaster closeLabel={t.close} className="bottom-5 max-md:top-16 max-md:bottom-auto" />;

  if (recording) {
    return (
      <>
        <h1 className="sr-only">{t.appTitle}</h1>
        <RecordingStage scenario={scenario} playback={playback} t={t} onExit={() => setRecording(false)} />
        {toaster}
      </>
    );
  }

  const setup = <SettingsPanel scenario={scenario} t={t} />;
  const messages = <MessageEditor scenario={scenario} t={t} />;
  const stage = (
    <Stage scenario={scenario} playback={playback} t={t} dir={dir} compact={layout === "mobile"} onJump={jump} />
  );

  return (
    <div className="studio-motion flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">{t.appTitle}</h1>
      <StudioHeader
        t={t}
        locale={locale}
        onNew={onNew}
        onSave={notifySaved}
        onLoad={onLoad}
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
            <PanelTabs tab={panelTab} onTab={setPanelTab} t={t} count={scenario.messages.length} setup={setup} messages={messages} />
          </aside>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="relative h-[48dvh] min-h-[320px] shrink-0 border-b border-border">{stage}</main>
          <section aria-label={t.setup} className="flex min-h-0 flex-1 flex-col bg-studio-panel">
            <PanelTabs tab={panelTab} onTab={setPanelTab} t={t} count={scenario.messages.length} setup={setup} messages={messages} />
          </section>
        </div>
      )}

      {toaster}

      {showExport && <ExportDialog scenario={scenario} t={t} onClose={() => setShowExport(false)} />}

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} t={t} />

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
