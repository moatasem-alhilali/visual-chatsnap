"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  Download,
  Eye,
  EyeOff,
  FilePlus2,
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
import { SCENARIO_VERSION } from "../data/defaults";
import type { Scenario } from "../types";
import { DeviceStage } from "./DeviceStage";
import { PlaybackControls } from "./PlaybackControls";
import { SettingsPanel } from "./SettingsPanel";
import { MessageEditor } from "./MessageEditor";
import { STUDIO_LABELS, type StudioLabels } from "./labels";

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 1800);
  };
  return { msg, show };
}

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
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-scenario.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Scenario;
        loadScenario({ ...parsed, version: SCENARIO_VERSION });
        show(t.loaded);
      } catch {
        /* ignore bad files */
      }
    };
    reader.readAsText(file);
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
        <div className="me-auto min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight">{t.appTitle}</h1>
          <p className="truncate text-xs text-muted-foreground">{t.appSubtitle}</p>
        </div>

        <Button variant="ghost" size="sm" className="hidden gap-1.5 sm:flex" onClick={() => { resetScenario(); show(t.loaded); }}>
          <FilePlus2 className="size-4" />
          {t.newScenario}
        </Button>

        <DropdownMenu dir={locale === "ar" ? "rtl" : "ltr"}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <MoreHorizontal className="size-4" />
              {t.data}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
            <DropdownMenuItem className="sm:hidden" onClick={() => { resetScenario(); show(t.loaded); }}>
              <FilePlus2 className="size-4" /> {t.newScenario}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { clearAll(); show(t.cleared); }}>
              <Trash2 className="size-4" /> {t.clear}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />

        <LanguageSwitcher />
        <ThemeToggle />

        <Button size="sm" className="gap-1.5" onClick={() => { setShowRecControls(true); setRecording(true); }}>
          <Video className="size-4" />
          {t.record}
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

      {/* Toast */}
      {msg && (
        <div className="fixed bottom-5 left-1/2 z-[130] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {msg}
        </div>
      )}
    </div>
  );
}

interface TimelineItem {
  id: string;
  index: number;
  at: string;
  mine: boolean;
  preview: string;
}

function buildTimeline(scenario: Scenario): TimelineItem[] {
  let cumulative = 0;
  return scenario.messages.map((m, i) => {
    cumulative += m.delayMs + (m.sender === "them" ? m.typingMs : 0);
    return {
      id: m.id,
      index: i,
      at: (cumulative / 1000).toFixed(1),
      mine: m.sender === "me",
      preview: m.type === "voice" ? "🎤" : m.text.slice(0, 22) || "…",
    };
  });
}

function Timeline({ scenario, t }: { scenario: Scenario; t: StudioLabels }) {
  const items = buildTimeline(scenario);
  return (
    <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.timeline}</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex min-w-[120px] shrink-0 flex-col gap-1 rounded-lg border p-2 ${
              item.mine ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>#{item.index + 1}</span>
              <span>{item.at}{t.seconds}</span>
            </div>
            <span className="truncate text-xs" dir="auto">{item.preview}</span>
          </div>
        ))}
        {items.length === 0 && (
          <span className="py-3 text-xs text-muted-foreground">{t.empty}</span>
        )}
      </div>
    </div>
  );
}
