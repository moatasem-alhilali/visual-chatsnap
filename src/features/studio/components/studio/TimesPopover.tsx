"use client";

import { useId, useState } from "react";
import { ArrowRight, Clock4, Lock } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover } from "@/shared/components/ui/popover";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { toast } from "@/shared/components/ui/toast";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { useStudioStore } from "../../store";
import { undoTo } from "../../hooks/useMessageActions";
import {
  formatClock,
  generateTimes,
  isTimeLocked,
  parseClock,
  type ClockStyle,
  type TimePace,
} from "../../services/auto-times";
import type { StudioLabels } from "../labels";
import { fmt } from "./timing";

const DEFAULT_STYLE: ClockStyle = { h24: false, pad: false, suffix: null, arabicDigits: false };

/** "Generate times": start clock + pace → every message's time label (one undo step). */
export function TimesPopover({ t, disabled = false }: { t: StudioLabels; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("10:41");
  const [pace, setPace] = useState<TimePace>("natural");
  const startId = useId();
  const errId = useId();
  const paceId = useId();
  const messages = useStudioStore((s) => s.scenario.messages);
  const composeTyping = useStudioStore((s) => s.scenario.composeTyping);
  const setMessageTimes = useStudioStore((s) => s.setMessageTimes);

  const parsed = parseClock(start);
  const preview = open && parsed ? generateTimes({ messages, composeTyping }, parsed, pace) : null;
  const lockedCount = messages.filter(isTimeLocked).length;

  const toggle = () => {
    if (!open) {
      // start from the chat's current first time when it is a valid clock
      const first = messages[0] ? parseClock(messages[0].time) : null;
      setStart(first ? messages[0].time.trim() : "10:41");
    }
    setOpen((o) => !o);
  };

  const now = () => {
    const d = new Date();
    setStart(formatClock(d.getHours() * 60 + d.getMinutes(), parsed?.style ?? DEFAULT_STYLE));
  };

  const apply = () => {
    if (!parsed || !preview) return;
    const before = useStudioStore.getState().scenario;
    setMessageTimes(Object.fromEntries(messages.map((m, i) => [m.id, preview[i]])));
    const after = useStudioStore.getState().scenario;
    setOpen(false);
    if (after === before) {
      toast({ title: t.genDone });
      return;
    }
    toast({
      title: t.genDone,
      description: lockedCount ? fmt(t.genLocked, { count: lockedCount }) : undefined,
      variant: "success",
      action: { label: t.undo, onClick: () => undoTo(before, after) },
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label={t.genTimes}
      align="end"
      className="w-[min(19rem,calc(100vw-1.5rem))] p-3"
      trigger={
        <Tooltip content={t.genTimesHint}>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t.genTimes}
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={disabled}
            onClick={toggle}
          >
            <Clock4 className="size-3.5" />
          </Button>
        </Tooltip>
      }
    >
      <p className="text-[13px] font-semibold">{t.genTimes}</p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{t.genTimesHint}</p>

      <label htmlFor={startId} className="mt-3 mb-1.5 block text-xs font-medium text-muted-foreground">
        {t.genStart}
      </label>
      <div className="flex items-center gap-1.5">
        <Input
          id={startId}
          value={start}
          dir="ltr"
          maxLength={12}
          data-autofocus
          aria-invalid={!parsed || undefined}
          aria-describedby={parsed ? undefined : errId}
          onChange={(e) => setStart(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          className="h-8 w-28 text-center tabular-nums"
        />
        <Button variant="outline" size="xs" onClick={now}>
          {t.sbTimeNow}
        </Button>
        <Button variant="outline" size="xs" onClick={() => setStart("10:41")}>
          <span dir="ltr">10:41</span>
        </Button>
      </div>
      {parsed ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{t.genStyleHint}</p>
      ) : (
        <p id={errId} role="alert" className="mt-1 text-[11px] text-destructive">
          {t.genInvalid}
        </p>
      )}

      <p id={paceId} className="mt-3 mb-1.5 text-xs font-medium text-muted-foreground">
        {t.genPace}
      </p>
      <SegmentedControl<TimePace>
        aria-labelledby={paceId}
        size="sm"
        value={pace}
        onChange={setPace}
        options={[
          { value: "quick", label: t.paceQuick },
          { value: "natural", label: t.paceNatural },
          { value: "slow", label: t.paceSlow },
        ]}
      />

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/70 px-2.5 py-2 text-xs" aria-live="polite">
        <Clock4 aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        {preview && preview.length > 0 ? (
          <span className="font-semibold tabular-nums">
            <bdi dir="ltr">{preview[0]}</bdi>
            <ArrowRight aria-hidden className="mx-1.5 inline size-3 text-muted-foreground rtl:-scale-x-100" />
            <span className="sr-only"> – </span>
            <bdi dir="ltr">{preview[preview.length - 1]}</bdi>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {lockedCount > 0 && (
          <span className="ms-auto flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="size-3" />
            {lockedCount}
          </span>
        )}
      </div>

      <Button size="sm" className="mt-3 w-full" disabled={!parsed || messages.length === 0} onClick={apply}>
        {t.genApply}
      </Button>
    </Popover>
  );
}
