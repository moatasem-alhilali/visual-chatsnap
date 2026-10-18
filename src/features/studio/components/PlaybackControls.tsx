"use client";

import { Pause, Play, RotateCcw, Square } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { PlaybackView } from "../playback/usePlayback";
import type { Message } from "../types";
import { usePlaybackClock } from "../hooks/usePlaybackClock";
import type { StudioLabels } from "./labels";
import { Timeline } from "./Timeline";
import { formatClock } from "./studio/timing";

/** Floating transport bar: play/pause, restart, reset and a segmented track. */
export function PlaybackControls({
  playback,
  messages,
  t,
  selectedId,
  composeTyping,
  onJump,
  className,
}: {
  playback: PlaybackView;
  messages: Message[];
  t: StudioLabels;
  selectedId?: string | null;
  composeTyping?: boolean;
  onJump?: (id: string) => void;
  className?: string;
}) {
  const { phase } = playback;
  const playing = phase === "playing";
  const paused = phase === "paused";
  const { elapsed, total, bounds } = usePlaybackClock(playback, messages, composeTyping);

  const primaryLabel = playing ? t.pause : paused ? t.resume : t.play;
  const onPrimary = playing ? playback.pause : paused ? playback.resume : playback.play;

  return (
    <div
      role="toolbar"
      aria-label={t.playback}
      className={cn(
        "flex w-full items-center gap-1 rounded-2xl border border-border/80 bg-popover/85 p-1.5 pe-3 shadow-studio-float backdrop-blur-xl supports-[backdrop-filter]:bg-popover/75",
        className,
      )}
    >
      <Tooltip content={primaryLabel} shortcut="Space">
        <Button
          size="icon"
          onClick={onPrimary}
          aria-label={primaryLabel}
          className="size-10 rounded-xl shadow-studio-card"
        >
          {playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 translate-x-px fill-current" />
          )}
        </Button>
      </Tooltip>
      <Tooltip content={t.restart} shortcut="R">
        <Button variant="ghost" size="icon-sm" onClick={playback.restart} aria-label={t.restart} className="rounded-lg">
          <RotateCcw className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={t.reset}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={playback.reset}
          aria-label={t.reset}
          disabled={phase === "idle"}
          className="rounded-lg"
        >
          <Square className="size-3.5" />
        </Button>
      </Tooltip>

      <span className="ms-1.5 w-8 shrink-0 text-end text-[11px] font-medium tabular-nums text-foreground" dir="ltr">
        {formatClock(elapsed)}
      </span>
      <div className="mx-1.5 flex min-w-0 flex-1">
        <Timeline
          messages={messages}
          bounds={bounds}
          elapsed={elapsed}
          selectedId={selectedId}
          onJump={onJump}
          t={t}
          interactive={!!onJump}
        />
      </div>
      <span className="w-8 shrink-0 text-[11px] tabular-nums text-muted-foreground" dir="ltr">
        {formatClock(total)}
      </span>
    </div>
  );
}
