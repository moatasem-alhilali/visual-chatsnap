"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Video, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { PlaybackView } from "../../playback/usePlayback";
import type { Scenario } from "../../types";
import { useElementSize } from "../../hooks/useElementSize";
import { DeviceStage } from "../DeviceStage";
import { PlaybackControls } from "../PlaybackControls";
import type { StudioLabels } from "../labels";

/**
 * Recording mode: a clean, full-screen stage. Controls can be hidden (H) so
 * nothing but the phone is on screen; Esc exits. The phone keeps the same
 * size whether controls are visible or not.
 */
export function RecordingStage({
  scenario,
  playback,
  t,
  onExit,
}: {
  scenario: Scenario;
  playback: PlaybackView;
  t: StudioLabels;
  onExit: () => void;
}) {
  const [controls, setControls] = useState(true);
  const [ref, size] = useElementSize<HTMLDivElement>();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
      } else if (e.key.toLowerCase() === "h") {
        setControls((c) => !c);
      } else if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        if (playback.phase === "playing") playback.pause();
        else if (playback.phase === "paused") playback.resume();
        else playback.play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit, playback]);

  return (
    <div className="studio-canvas studio-motion fixed inset-0 z-[120]">
      <div ref={ref} className="absolute inset-x-4 top-16 bottom-28">
        <div className="flex h-full items-center justify-center">
          {size.height > 0 && <DeviceStage scenario={scenario} playback={playback} maxHeight={size.height} />}
        </div>
      </div>

      {controls ? (
        <>
          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 animate-in fade-in-0 duration-200">
            <span className="flex min-w-0 items-center gap-2 rounded-full border border-border/80 bg-popover/85 py-1.5 ps-2 pe-3 text-xs text-muted-foreground shadow-studio-float backdrop-blur-xl">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/60" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              <Video className="size-3.5 shrink-0" />
              <span className="truncate font-medium text-foreground">{t.recordHint}</span>
              <span className="hidden truncate md:inline">· {t.recordKeys}</span>
            </span>
            <Button variant="outline" size="sm" onClick={onExit} className="shrink-0 rounded-full bg-popover/85 shadow-studio-float backdrop-blur-xl">
              <X /> {t.exitRecord}
            </Button>
          </div>
          <div className="absolute inset-x-4 bottom-5 flex flex-col items-center gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <PlaybackControls playback={playback} messages={scenario.messages} composeTyping={scenario.composeTyping !== false} t={t} className="max-w-lg" />
            <button
              type="button"
              onClick={() => setControls(false)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <EyeOff className="size-3.5" />
              {t.hideControls}
              <kbd className="rounded border border-border px-1 font-sans text-[10px]">H</kbd>
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setControls(true)}
          aria-label={t.showControls}
          className={cn(
            "absolute end-4 bottom-4 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur",
            "opacity-0 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          )}
        >
          <Eye className="size-3.5" />
          {t.showControls}
        </button>
      )}
    </div>
  );
}
