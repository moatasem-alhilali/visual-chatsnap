"use client";

import { Pause, Play, RotateCcw, Square } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import type { PlaybackView } from "../playback/usePlayback";

interface Labels {
  play: string;
  pause: string;
  resume: string;
  restart: string;
  reset: string;
}

export function PlaybackControls({
  playback,
  labels,
  compact = false,
}: {
  playback: PlaybackView;
  labels: Labels;
  compact?: boolean;
}) {
  const { phase } = playback;
  const playing = phase === "playing";
  const paused = phase === "paused";

  return (
    <div className="flex items-center justify-center gap-2">
      {!playing ? (
        <Button
          size={compact ? "default" : "lg"}
          onClick={paused ? playback.resume : playback.play}
          className="gap-2 rounded-full px-6"
        >
          <Play className="size-4 fill-current" />
          {paused ? labels.resume : labels.play}
        </Button>
      ) : (
        <Button
          size={compact ? "default" : "lg"}
          variant="secondary"
          onClick={playback.pause}
          className="gap-2 rounded-full px-6"
        >
          <Pause className="size-4 fill-current" />
          {labels.pause}
        </Button>
      )}

      <Button
        size={compact ? "icon" : "lg"}
        variant="outline"
        onClick={playback.restart}
        className="rounded-full"
        title={labels.restart}
        aria-label={labels.restart}
      >
        <RotateCcw className="size-4" />
        {!compact && <span className="ms-2">{labels.restart}</span>}
      </Button>

      <Button
        size={compact ? "icon" : "lg"}
        variant="ghost"
        onClick={playback.reset}
        className="rounded-full"
        title={labels.reset}
        aria-label={labels.reset}
      >
        <Square className="size-4" />
      </Button>
    </div>
  );
}
