"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { ClipboardPaste, FileText, Image as ImageIcon, Mic, Sparkles } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/input";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { Message, Person, Scenario, Sender } from "../../types";
import { guessOwner, parseTranscript, transcriptToMessages } from "../../services/transcript";
import { nowClock } from "../../data/defaults";
import type { StudioLabels } from "../labels";
import { fmt } from "./timing";

export type TranscriptImport = {
  messages: Message[];
  mode: "append" | "replace";
  people?: Partial<Record<Sender, Person>>;
};

const EXAMPLE: Record<"ar" | "en", string> = {
  ar: "[10:41] خالد: السلام عليكم، العرض للحين شغال؟\n[10:41] أنا: وعليكم السلام! إيه شغال لين الجمعة 🎉\n[10:42] خالد: كم السعر بعد الخصم؟\n[10:42] أنا: ١٩٩ ريال بدل ٢٩٩ والتوصيل مجاني 🚚",
  en: "[10:41] Khalid: Hi! Is the weekend offer still on?\n[10:41] Me: Hey! Yes, until Friday 🎉\n[10:42] Khalid: What's the price after the discount?\n[10:42] Me: $49 instead of $79, with free delivery 🚚",
};

/** Paste a chat (script or WhatsApp export), check the preview, import it. */
export function TranscriptDialog({
  open,
  onOpenChange,
  t,
  locale,
  scenario,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: StudioLabels;
  locale: "ar" | "en";
  scenario: Scenario;
  onImport: (result: TranscriptImport) => void;
}) {
  const [raw, setRaw] = useState("");
  const [ownerChoice, setOwnerChoice] = useState<string | null>(null);
  const [mode, setMode] = useState<"append" | "replace">(scenario.messages.length ? "append" : "replace");
  const [useNames, setUseNames] = useState(true);
  const [clipboardError, setClipboardError] = useState(false);
  const ids = { text: useId(), owner: useId(), mode: useId(), names: useId(), help: useId() };

  const deferred = useDeferredValue(raw);
  const parsed = useMemo(() => parseTranscript(deferred), [deferred]);
  const owner =
    ownerChoice && parsed.names.includes(ownerChoice) ? ownerChoice : guessOwner(parsed.names, scenario.me.name);
  const startTime = scenario.messages.at(-1)?.time || nowClock();
  const messages = useMemo(() => transcriptToMessages(parsed, owner, startTime), [parsed, owner, startTime]);
  const otherName = parsed.names.find((n) => n !== owner) ?? null;
  const tooManyNames = parsed.names.length > 2;

  const reset = () => {
    setRaw("");
    setOwnerChoice(null);
    setClipboardError(false);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setRaw(text);
      setClipboardError(false);
    } catch {
      setClipboardError(true);
    }
  };

  const submit = () => {
    if (messages.length === 0) return;
    const people: Partial<Record<Sender, Person>> = {};
    if (useNames && owner && !/^(me|you|i|أنا|انا)$/i.test(owner)) people.me = { ...scenario.me, name: owner };
    if (useNames && otherName) people.them = { ...scenario.them, name: otherName };
    onImport({ messages, mode, people });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
      title={t.transcriptTitle}
      description={t.transcriptHint}
      icon={<FileText className="size-4" />}
      closeLabel={t.close}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={submit} disabled={messages.length === 0}>
            {messages.length
              ? fmt(mode === "replace" ? t.transcriptReplaceN : t.transcriptAddN, { count: messages.length })
              : t.transcriptImport}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={ids.text} className="text-xs font-medium text-muted-foreground">
              {t.transcriptLabel}
            </label>
            <div className="flex gap-1">
              <Button variant="ghost" size="xs" onClick={() => setRaw(EXAMPLE[locale])} className="gap-1">
                <Sparkles className="size-3.5" />
                {t.transcriptExample}
              </Button>
              <Button variant="ghost" size="xs" onClick={() => void pasteFromClipboard()} className="gap-1">
                <ClipboardPaste className="size-3.5" />
                {t.transcriptPasteClipboard}
              </Button>
            </div>
          </div>
          <Textarea
            id={ids.text}
            data-autofocus
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t.transcriptPlaceholder}
            aria-describedby={ids.help}
            dir="auto"
            rows={6}
            className="max-h-56 min-h-32 font-mono text-[12.5px]"
          />
          <p id={ids.help} className={cn("mt-1 text-[11px]", clipboardError ? "text-destructive" : "text-muted-foreground")}>
            {clipboardError ? t.transcriptClipboardDenied : t.transcriptFormats}
          </p>
        </div>

        {raw.trim() !== "" && messages.length === 0 && (
          <p role="status" className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            {t.transcriptNothing}
          </p>
        )}

        {messages.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p id={ids.owner} className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {t.transcriptOwner}
                </p>
                <SegmentedControl<string>
                  aria-labelledby={ids.owner}
                  size="sm"
                  value={owner ?? ""}
                  onChange={setOwnerChoice}
                  className="[&>button]:max-w-40"
                  options={parsed.names.slice(0, 4).map((n) => ({ value: n, label: n }))}
                />
                {tooManyNames && <p className="mt-1 text-[11px] text-muted-foreground">{t.transcriptManyNames}</p>}
              </div>
              <div>
                <p id={ids.mode} className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {t.transcriptMode}
                </p>
                <SegmentedControl<"append" | "replace">
                  aria-labelledby={ids.mode}
                  size="sm"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "append", label: t.transcriptAppend },
                    { value: "replace", label: t.transcriptReplace },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <label htmlFor={ids.names} className="cursor-pointer text-[13px]">
                {t.transcriptUseNames}
              </label>
              <Switch id={ids.names} checked={useNames} onCheckedChange={setUseNames} />
            </div>

            <div>
              <p className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{t.transcriptPreview}</span>
                <span className="tabular-nums">
                  {fmt(t.messagesCount, { count: messages.length })}
                  {parsed.skipped > 0 && ` · ${fmt(t.transcriptSkipped, { count: parsed.skipped })}`}
                </span>
              </p>
              <ol className="studio-scroll max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border bg-studio-canvas p-2">
                {messages.map((m, i) => {
                  const name = parsed.lines[i]?.name ?? "";
                  const mine = m.sender === "me";
                  return (
                    <li key={m.id} className="flex items-start gap-2 rounded-md bg-card px-2 py-1.5 text-xs ring-1 ring-border/70">
                      <span
                        className={cn(
                          "mt-px max-w-24 shrink-0 truncate rounded px-1.5 py-px text-[10.5px] font-semibold",
                          mine ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {name}
                      </span>
                      <span className="min-w-0 flex-1 break-words whitespace-pre-line" dir="auto">
                        {m.type === "voice" ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Mic className="size-3" /> {t.voiceMessage}
                          </span>
                        ) : m.type === "image" ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <ImageIcon className="size-3" /> {m.text || t.photo}
                          </span>
                        ) : (
                          m.text
                        )}
                      </span>
                      <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground" dir="ltr">
                        {m.time}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
