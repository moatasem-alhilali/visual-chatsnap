"use client";

import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { Message } from "../types";
import type { StudioLabels } from "./labels";
import { fmt } from "./studio/timing";
import { messageSnippet } from "./studio/snippet";

const preview = (m: Message, t: StudioLabels): string => messageSnippet(m, t, 36);

/**
 * Segmented playback track: one segment per message, sized by its duration
 * and tinted by sender. Fills with progress; clicking jumps to the message in
 * the editor. Mirrors naturally in RTL.
 */
export function Timeline({
  messages,
  bounds,
  elapsed,
  selectedId,
  onJump,
  t,
  interactive = true,
}: {
  messages: Message[];
  bounds: number[];
  elapsed: number;
  selectedId?: string | null;
  onJump?: (id: string) => void;
  t: StudioLabels;
  interactive?: boolean;
}) {
  if (messages.length === 0) {
    return <div className="h-1.5 flex-1 rounded-full bg-muted" aria-hidden />;
  }

  return (
    <div role="group" aria-label={t.timeline} className="flex h-6 min-w-0 flex-1 items-center gap-[3px]">
      {messages.map((m, i) => {
        const start = bounds[i] ?? 0;
        const end = bounds[i + 1] ?? start;
        const dur = Math.max(1, end - start);
        const pct = Math.min(1, Math.max(0, (elapsed - start) / dur)) * 100;
        const mine = m.sender === "me";
        const selected = selectedId === m.id;
        const bar = (
          <span
            className={cn(
              "relative block h-1.5 w-full overflow-hidden rounded-full transition-[height] duration-150 ease-studio group-hover/seg:h-2.5",
              mine ? "bg-studio-me/25" : "bg-studio-them/30",
              selected && "h-2.5",
            )}
          >
            <span
              className={cn("absolute inset-y-0 start-0 rounded-full", mine ? "bg-studio-me" : "bg-studio-them")}
              style={{ width: `${pct}%` }}
            />
          </span>
        );
        const style = { flexGrow: dur, flexBasis: 0 };
        if (!interactive || !onJump) {
          return (
            <span key={m.id} className="flex h-full min-w-[3px] items-center" style={style}>
              {bar}
            </span>
          );
        }
        return (
          <Tooltip key={m.id} content={`#${i + 1} · ${preview(m, t)}`}>
            <button
              type="button"
              onClick={() => onJump(m.id)}
              aria-label={`${fmt(t.jumpTo, { n: i + 1 })}: ${preview(m, t)}`}
              className={cn(
                "group/seg flex h-full min-w-[4px] cursor-pointer items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              )}
              style={style}
            >
              {bar}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
