"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  Film,
  FolderOpen,
  MoreHorizontal,
  Save,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import LanguageSwitcher from "@/shared/components/LanguageSwitcher";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useStudioStore } from "../store";
import { usePlayback } from "../playback/usePlayback";
import { downloadScenarioJson, readScenarioFile } from "../services/scenario-file";
import { useToast } from "../hooks/useToast";
import { DeviceStage } from "./DeviceStage";
import { PlaybackControls } from "./PlaybackControls";
import { SettingsPanel } from "./SettingsPanel";
import { MessageEditor } from "./MessageEditor";
import { ExportDialog } from "./ExportDialog";
import { Timeline } from "./Timeline";
import { STUDIO_LABELS } from "./labels";

export function StudioApp() {
  const locale = useLocale();
  const t = STUDIO_LABELS[locale === "en" ? "en" : "ar"];

  const scenario = useStudioStore((s) => s.scenario);
  const recording = useStudioStore((s) => s.recording);
  const setRecording = useStudioStore((s) => s.setRecording);
  const loadScenario = useStudioStore((s) => s.loadScenario);
  const resetScenario = useStudioStore((s) => s.resetScenario);
  const saveSlot = useStudioStore((s) => s.saveSlot);
  const loadSlot = useStudioStore((s) => s.loadSlot);
  const clearAll = useStudioStore((s) => s.clearAll);

  const playback = usePlayback(scenario);
  const { msg, show } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [showRecControls, setShowRecControls] = useState(true);
  const [showExport, setShowExport] = useState(false);

  // Avoid SSR/localStorage hydration mismatch from the persisted store.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const ctlLabels = {
    play: t.play,
    pause: t.pause,
    resume: t.resume,
    restart: t.restart,
    reset: t.reset,
  };

  const onExport = () => {
    downloadScenarioJson(scenario);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      loadScenario(await readScenarioFile(file));
      show(t.loaded);
    } catch {
      /* keep the previous silent failure behavior for bad imports */
    }
  };

  if (!mounted) {
    return <div className="min-h-[60vh]" />;
  }

  // ---- Recording mode: clean full-screen stage ----
  if (recording) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-6 bg-neutral-100 dark:bg-neutral-900">
        <button
          onClick={() => setRecording(false)}
          className="absolute end-4 top-4 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white backdrop-blur hover:bg-black/80"
        >
          <X className="size-4" />
          {t.exitRecord}
        </button>

        <DeviceStage scenario={scenario} playback={playback} />

        {showRecControls ? (
          <div className="flex flex-col items-center gap-2">
            <PlaybackControls playback={playback} labels={ctlLabels} compact />
            <button
              onClick={() => setShowRecControls(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <EyeOff className="size-3.5" />
              {t.hideControls}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRecControls(true)}
            className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white hover:bg-black/70"
          >
            <Eye className="size-3.5" />
            {t.showControls}
          </button>
        )}
      </div>
    );
  }

  // ---- Editor ----
  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5">
      {/* Clean top bar */}
      <header className="mb-5 flex items-center gap-3 border-b border-border pb-4">
        <div className="me-auto flex min-w-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Scenora"
            width={720}
            height={480}
            priority
            className="h-9 w-auto shrink-0 sm:h-10"
          />
          <p className="hidden truncate text-xs text-muted-foreground md:block">{t.appSubtitle}</p>
          <h1 className="sr-only">{t.appTitle}</h1>
        </div>

        <LanguageSwitcher />
        <ThemeToggle />

        <DropdownMenu dir={locale === "ar" ? "rtl" : "ltr"}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title={t.data} aria-label={t.data}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => { resetScenario(); show(t.loaded); }}>
              <FilePlus2 className="size-4" /> {t.newScenario}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { saveSlot(); show(t.saved); }}>
              <Save className="size-4" /> {t.save}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => show(loadSlot() ? t.loaded : t.noSave)}>
              <FolderOpen className="size-4" /> {t.load}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}>
              <Download className="size-4" /> {t.exportJson}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => importRef.current?.click()}>
              <Upload className="size-4" /> {t.importJson}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { clearAll(); show(t.cleared); }}>
              <Trash2 className="size-4" /> {t.clear}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setShowRecControls(true); setRecording(true); }}>
          <Video className="size-4" />
          <span className="hidden sm:inline">{t.record}</span>
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => setShowExport(true)}>
          <Film className="size-4" />
          {t.exportVideo}
        </Button>
      </header>

      {/* 3-pane layout */}
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_370px]">
        {/* Left: settings */}
        <aside className="order-2 rounded-xl border border-border bg-background/60 p-4 xl:order-1">
          <SettingsPanel scenario={scenario} t={t} />
        </aside>

        {/* Center: preview + controls */}
        <section className="order-1 flex flex-col items-center gap-5 rounded-xl border border-border bg-neutral-50 py-6 dark:bg-neutral-900/40 xl:order-2">
          <DeviceStage scenario={scenario} playback={playback} />
          <PlaybackControls playback={playback} labels={ctlLabels} />
        </section>

        {/* Right: messages */}
        <aside className="order-3 max-h-[80vh] rounded-xl border border-border bg-background/60 p-4">
          <MessageEditor scenario={scenario} t={t} />
        </aside>
      </div>

      {/* Bottom: simple timeline */}
      <Timeline scenario={scenario} t={t} />

      {showExport && (
        <ExportDialog scenario={scenario} t={t} onClose={() => setShowExport(false)} />
      )}

      {/* Toast */}
      {msg && (
        <div className="fixed bottom-5 left-1/2 z-[130] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {msg}
        </div>
      )}
    </div>
  );
}
