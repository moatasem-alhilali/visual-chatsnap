"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Mic, SendHorizontal } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useStudioStore } from "../../store";
import type { Message, Scenario, Sender } from "../../types";
import { useStudioUi } from "../../hooks/useStudioUi";
import { Avatar } from "../shared";
import type { StudioLabels } from "../labels";
import { fmt } from "./timing";
import { readImageFile } from "./image-utils";
import { createBlankMessage } from "../../data/defaults";
import { naturalTiming } from "../../services/smart-timing";

/** Quick-add bar: pick who is talking, type, Enter. */
export function Composer({
  scenario,
  t,
  onAdded,
}: {
  scenario: Scenario;
  t: StudioLabels;
  onAdded: (id: string) => void;
}) {
  const addMessage = useStudioStore((s) => s.addMessage);
  const focusTick = useStudioUi((s) => s.composerFocusTick);

  const last = scenario.messages[scenario.messages.length - 1];
  const [sender, setSender] = useState<Sender>(last?.sender === "them" ? "me" : "them");
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusTick > 0) inputRef.current?.focus();
  }, [focusTick]);

  const person = sender === "me" ? scenario.me : scenario.them;
  const name = person.name || (sender === "me" ? t.meShort : t.themShort);

  const create = (patch: Partial<Message>) => {
    const prev = scenario.messages[scenario.messages.length - 1];
    const draft = { ...createBlankMessage(sender), ...patch };
    // natural pacing from the length (and the message before) as a start
    onAdded(addMessage(sender, { ...patch, ...naturalTiming(draft, prev) }));
  };

  const submit = (switchAfter: boolean) => {
    const body = text.trim();
    if (!body) return;
    create({ text: body });
    setText("");
    if (switchAfter) setSender((s) => (s === "me" ? "them" : "me"));
  };

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    const src = await readImageFile(file);
    create({ type: "image", imageSrc: src, text: text.trim() });
    setText("");
  };

  return (
    <div className="border-t border-border bg-studio-panel p-3">
      <div className="rounded-xl border border-input bg-card shadow-studio-card transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25 dark:bg-input/10">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit(e.ctrlKey || e.metaKey);
            }
          }}
          placeholder={fmt(t.composerPlaceholder, { name })}
          aria-label={fmt(t.composerPlaceholder, { name })}
          rows={1}
          dir="auto"
          className="studio-field-auto block max-h-36 min-h-11 w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/80"
        />
        <div className="flex items-center gap-1 px-1.5 pb-1.5">
          <SegmentedControl<Sender>
            aria-label={t.sendAs}
            size="sm"
            value={sender}
            onChange={setSender}
            className="w-auto min-w-0 [&>button]:max-w-36 [&>button]:flex-initial"
            options={(["them", "me"] as const).map((s) => {
              const p = s === "me" ? scenario.me : scenario.them;
              return {
                value: s,
                label: p.name || (s === "me" ? t.meShort : t.themShort),
                icon: <Avatar person={p} size={16} />,
              };
            })}
          />
          <span className="flex-1" />
          <Tooltip content={t.addVoice}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t.addVoice}
              onClick={() => create({ type: "voice", voiceDuration: "0:08" })}
            >
              <Mic />
            </Button>
          </Tooltip>
          <Tooltip content={t.addImage}>
            <Button variant="ghost" size="icon-sm" aria-label={t.addImage} onClick={() => imageRef.current?.click()}>
              <ImagePlus />
            </Button>
          </Tooltip>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            onChange={(e) => {
              void onImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Tooltip content={t.addMessage} shortcut="Enter">
            <Button
              size="icon-sm"
              aria-label={t.addMessage}
              disabled={!text.trim()}
              onClick={() => submit(false)}
              className={cn("rounded-lg", sender === "them" && "bg-foreground text-background hover:bg-foreground/85")}
            >
              <SendHorizontal className="rtl:-scale-x-100" />
            </Button>
          </Tooltip>
        </div>
      </div>
      <p className="mt-1.5 hidden px-1 text-[11px] text-muted-foreground sm:block">{t.composerHint}</p>
    </div>
  );
}
