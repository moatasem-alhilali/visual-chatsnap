"use client";

import { useId, useRef, useState } from "react";
import { SmilePlus, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover } from "@/shared/components/ui/popover";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { StudioLabels } from "../labels";

/** The six reactions every chat app offers first. */
export const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** Accepts one short emoji (a ZWJ sequence or flag counts as one). */
export function isReactionEmoji(text: string): boolean {
  const v = text.trim();
  if (!v || v.length > 16 || !EMOJI.test(v)) return false;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const n = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(v)).length;
    return n <= 2;
  }
  return true;
}

/**
 * Per-message reaction: a popover with the six common emojis, a custom emoji
 * field and "remove". On my messages it is the other person's reaction, on
 * theirs it is mine — the heading says which.
 */
export function ReactionPicker({
  value,
  mine,
  onChange,
  t,
  variant,
  messageLabel,
}: {
  value: string | null | undefined;
  /** the message is mine → the reaction comes from them */
  mine: boolean;
  onChange: (reaction: string | null) => void;
  t: StudioLabels;
  variant: "icon" | "badge";
  /** e.g. "Message 3", appended to accessible names */
  messageLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const customId = useId();
  const errorId = useId();
  const names = [t.reactLike, t.reactLove, t.reactHaha, t.reactWow, t.reactSad, t.reactThanks];
  const heading = mine ? t.reactionFromThem : t.reactionFromMe;

  const pick = (emoji: string | null) => {
    onChange(emoji);
    setOpen(false);
    setCustom("");
    setError(false);
  };

  const submitCustom = () => {
    if (!isReactionEmoji(custom)) {
      setError(true);
      return;
    }
    pick(custom.trim());
  };

  const onRowKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const buttons = Array.from(rowRef.current?.querySelectorAll("button") ?? []);
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const forward = (e.key === "ArrowRight") !== rtl;
    let next = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : idx + (forward ? 1 : -1);
    next = (next + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };

  const triggerLabel = `${value ? `${heading}: ${value}` : t.addReaction} — ${messageLabel}`;
  const trigger =
    variant === "icon" ? (
      <Tooltip content={t.addReaction}>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <SmilePlus className="size-3.5" />
        </Button>
      </Tooltip>
    ) : (
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-1.5 text-sm leading-none shadow-studio-card transition-transform outline-none hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {value}
      </button>
    );

  return (
    <Popover open={open} onOpenChange={setOpen} trigger={trigger} label={heading} align="end" className="w-64">
      <p className="px-1 pb-1.5 text-[11px] font-medium text-muted-foreground">{heading}</p>
      <div ref={rowRef} role="group" aria-label={t.commonReactions} onKeyDown={onRowKey} className="flex justify-between gap-1">
        {COMMON_REACTIONS.map((emoji, i) => {
          const active = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              aria-label={names[i]}
              aria-pressed={active}
              title={names[i]}
              data-autofocus={(active || (!value && i === 0)) || undefined}
              onClick={() => pick(active ? null : emoji)}
              className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-full text-xl leading-none transition-[transform,background-color] duration-150 ease-studio outline-none hover:scale-110 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40",
                active && "bg-primary/12 ring-1 ring-primary/40",
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      <form
        className="mt-2 flex items-start gap-1.5 border-t border-border/70 px-0.5 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submitCustom();
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor={customId} className="sr-only">
            {t.customReaction}
          </label>
          <Input
            id={customId}
            value={custom}
            maxLength={16}
            onChange={(e) => {
              setCustom(e.target.value);
              setError(false);
            }}
            placeholder={t.customReaction}
            aria-invalid={error || undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-8 text-center text-base"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={!custom.trim()}>
          {t.setReaction}
        </Button>
      </form>
      {error && (
        <p id={errorId} role="alert" className="px-1 pt-1 text-[11px] text-destructive">
          {t.reactionInvalid}
        </p>
      )}
      {value && (
        <button
          type="button"
          onClick={() => pick(null)}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <X className="size-3.5" />
          {t.removeReaction}
        </button>
      )}
    </Popover>
  );
}
