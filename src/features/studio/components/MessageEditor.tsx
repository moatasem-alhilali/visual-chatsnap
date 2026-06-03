"use client";

import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useStudioStore } from "../store";
import type { DeliveryStatus, Message, MessageType, Scenario } from "../types";
import type { StudioLabels } from "./labels";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

function MessageRow({
  m,
  index,
  total,
  scenario,
  t,
}: {
  m: Message;
  index: number;
  total: number;
  scenario: Scenario;
  t: StudioLabels;
}) {
  const update = useStudioStore((s) => s.updateMessage);
  const del = useStudioStore((s) => s.deleteMessage);
  const move = useStudioStore((s) => s.moveMessage);
  const duplicate = useStudioStore((s) => s.duplicateMessage);

  const mine = m.sender === "me";
  const who = mine ? scenario.me.name || t.me : scenario.them.name || t.them;
  const accent = mine ? "bg-primary/15 text-primary" : "bg-muted text-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => update(m.id, { sender: mine ? "them" : "me" })}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${accent}`}
          title={t.sender}
        >
          {who}
        </button>
        <span className="text-[11px] text-muted-foreground">#{index + 1}</span>
        <div className="ms-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7" disabled={index === 0} onClick={() => move(m.id, -1)} title={t.moveUp}>
            <ChevronUp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" disabled={index === total - 1} onClick={() => move(m.id, 1)} title={t.moveDown}>
            <ChevronDown className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => duplicate(m.id)} title={t.duplicate}>
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => del(m.id)} title={t.delete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {m.type !== "voice" ? (
        <textarea
          value={m.text}
          onChange={(e) => update(m.id, { text: e.target.value })}
          placeholder={t.messagePlaceholder}
          rows={2}
          dir="auto"
          className={`${inputCls} mb-2 resize-y`}
        />
      ) : (
        <div className="mb-2 rounded-md border border-dashed border-input px-2 py-2 text-center text-xs text-muted-foreground">
          🎤 {t.typeVoice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label={t.type}>
          <select
            value={m.type}
            onChange={(e) => update(m.id, { type: e.target.value as MessageType })}
            className={inputCls}
          >
            <option value="text">{t.typeText}</option>
            <option value="voice">{t.typeVoice}</option>
          </select>
        </Field>
        <Field label={t.time}>
          <input value={m.time} onChange={(e) => update(m.id, { time: e.target.value })} className={inputCls} />
        </Field>
        <Field label={t.delay}>
          <input
            type="number"
            min={0}
            step={0.1}
            value={(m.delayMs / 1000).toString()}
            onChange={(e) => update(m.id, { delayMs: Math.max(0, Number(e.target.value) * 1000) })}
            className={inputCls}
          />
        </Field>
        {m.sender === "them" ? (
          <Field label={t.typingDur}>
            <input
              type="number"
              min={0}
              step={0.1}
              value={(m.typingMs / 1000).toString()}
              onChange={(e) => update(m.id, { typingMs: Math.max(0, Number(e.target.value) * 1000) })}
              className={inputCls}
            />
          </Field>
        ) : (
          <Field label={t.status}>
            <select
              value={m.status}
              onChange={(e) => update(m.id, { status: e.target.value as DeliveryStatus })}
              className={inputCls}
            >
              <option value="sent">{t.sent}</option>
              <option value="delivered">{t.delivered}</option>
              <option value="read">{t.read}</option>
            </select>
          </Field>
        )}
        {m.type === "voice" && (
          <Field label={t.voiceLen}>
            <input
              value={m.voiceDuration ?? ""}
              placeholder="0:08"
              onChange={(e) => update(m.id, { voiceDuration: e.target.value })}
              className={inputCls}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

export function MessageEditor({ scenario, t }: { scenario: Scenario; t: StudioLabels }) {
  const addMessage = useStudioStore((s) => s.addMessage);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.messages}</h2>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => addMessage("them")}>
            {t.addFromThem}
          </Button>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => addMessage("me")}>
            {t.addFromMe}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pe-1">
        {scenario.messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t.empty}</p>
        )}
        {scenario.messages.map((m, i) => (
          <MessageRow key={m.id} m={m} index={i} total={scenario.messages.length} scenario={scenario} t={t} />
        ))}
      </div>
    </div>
  );
}
