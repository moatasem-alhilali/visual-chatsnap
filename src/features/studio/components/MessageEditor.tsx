"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Timer } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useStudioStore } from "../store";
import type { Scenario, Sender } from "../types";
import { useStudioUi } from "../hooks/useStudioUi";
import { useMessageActions } from "../hooks/useMessageActions";
import type { StudioLabels } from "./labels";
import { Composer } from "./studio/Composer";
import { MessageRow } from "./studio/MessageRow";
import { fmt, formatSeconds, stepBounds } from "./studio/timing";

function EmptyState({ t, onAdd }: { t: StudioLabels; onAdd: (s: Sender) => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div aria-hidden className="relative mb-5 h-16 w-24">
        <span className="absolute start-0 top-1 h-7 w-16 rounded-2xl rounded-ss-md border border-border bg-card shadow-studio-card" />
        <span className="absolute end-0 bottom-1 h-7 w-16 rounded-2xl rounded-ee-md bg-primary/15 ring-1 ring-primary/25" />
        <span className="absolute start-3 top-4 h-1 w-8 rounded-full bg-foreground/15" />
        <span className="absolute end-3 bottom-4 h-1 w-7 rounded-full bg-primary/40" />
      </div>
      <p className="text-sm font-semibold">{t.emptyTitle}</p>
      <p className="mt-1 max-w-64 text-xs leading-relaxed text-muted-foreground">{t.emptyBody}</p>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onAdd("them")}>
          {t.addFromThem}
        </Button>
        <Button size="sm" onClick={() => onAdd("me")}>
          {t.addFromMe}
        </Button>
      </div>
    </div>
  );
}

/** Right zone: the conversation script — compact rows + quick composer. */
export function MessageEditor({
  scenario,
  t,
  showHeader = true,
  liveId = null,
  following = false,
}: {
  scenario: Scenario;
  t: StudioLabels;
  /** the tabbed (narrow) layout shows the title + count in its tab instead */
  showHeader?: boolean;
  /** message most recently revealed by playback (highlighted + followed) */
  liveId?: string | null;
  following?: boolean;
}) {
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const addMessage = useStudioStore((s) => s.addMessage);
  const selectedId = useStudioUi((s) => s.selectedId);
  const select = useStudioUi((s) => s.select);
  const { remove, duplicate, move, moveTo } = useMessageActions(t);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [drag, setDrag] = useState<{ id: string | null; over: number | null }>({ id: null, over: null });
  const listRef = useRef<HTMLDivElement>(null);

  const messages = scenario.messages;
  const totalMs = useMemo(() => {
    const b = stepBounds(messages);
    return b[b.length - 1];
  }, [messages]);

  useEffect(() => {
    if (!following || !liveId) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-msg-id="${liveId}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [liveId, following]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reveal = useCallback(
    (id: string, focusText: boolean) => {
      select(id);
      requestAnimationFrame(() => {
        const row = listRef.current?.querySelector<HTMLElement>(`[data-msg-id="${id}"]`);
        row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        if (focusText) row?.querySelector<HTMLElement>("textarea, input")?.focus({ preventScroll: true });
      });
    },
    [select],
  );

  const addBlank = (sender: Sender) => {
    addMessage(sender);
    const list = useStudioStore.getState().scenario.messages;
    const created = list[list.length - 1];
    if (created) reveal(created.id, true);
  };

  const onDragStart = useCallback((id: string) => setDrag({ id, over: null }), []);
  const onDragOver = useCallback((index: number, after: boolean) => {
    setDrag((d) => {
      const over = after ? index + 1 : index;
      return d.over === over ? d : { ...d, over };
    });
  }, []);
  const onDragEnd = useCallback(() => setDrag({ id: null, over: null }), []);
  const dragRef = useRef(drag);
  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);
  const onDrop = useCallback(() => {
    const d = dragRef.current;
    if (d.id && d.over !== null) moveTo(d.id, d.over);
    setDrag({ id: null, over: null });
  }, [moveTo]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader && (
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <h2 className="text-[13px] font-semibold">{t.messages}</h2>
        <span
          className="rounded-full bg-muted px-1.5 py-px text-[11px] font-medium tabular-nums text-muted-foreground"
          aria-label={fmt(t.messagesCount, { count: messages.length })}
        >
          {messages.length}
        </span>
        <span className="ms-auto flex items-center gap-1 text-xs text-muted-foreground" title={t.totalLength}>
          <Timer className="size-3.5" />
          <span className="sr-only">{t.totalLength}:</span>
          <span className="tabular-nums" dir="ltr">
            {formatSeconds(totalMs)}
            {t.seconds}
          </span>
        </span>
      </div>
      )}

      <div ref={listRef} className="studio-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {messages.length === 0 ? (
          <EmptyState t={t} onAdd={addBlank} />
        ) : (
          <ol className="flex flex-col gap-2 p-3" onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag((d) => ({ ...d, over: null }));
          }}>
            {messages.map((m, i) => (
              <MessageRow
                key={m.id}
                m={m}
                index={i}
                total={messages.length}
                me={scenario.me}
                them={scenario.them}
                t={t}
                dir={dir}
                selected={selectedId === m.id}
                live={liveId === m.id}
                expanded={expanded.has(m.id)}
                dragging={drag.id === m.id}
                dropBefore={drag.id !== null && drag.over === i && drag.id !== m.id}
                dropAfter={drag.id !== null && drag.over === messages.length && i === messages.length - 1}
                onSelect={select}
                onToggleExpand={toggleExpand}
                onRemove={remove}
                onDuplicate={duplicate}
                onMove={move}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            ))}
          </ol>
        )}
      </div>

      <Composer scenario={scenario} t={t} onAdded={(id) => reveal(id, false)} />
    </div>
  );
}
