"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Ban, FileText, ImagePlus, MapPin, Mic, Paperclip, PhoneMissed, SendHorizontal, Sticker, Video } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useStudioStore, type MessagePatch } from "../../store";
import type { Message, MessageType, Scenario, Sender } from "../../types";
import { useStudioUi } from "../../hooks/useStudioUi";
import { Avatar } from "../shared";
import type { StudioLabels } from "../labels";
import { fmt } from "./timing";
import { createBlankMessage } from "../../data/defaults";
import { naturalTiming } from "../../services/smart-timing";
import { MediaPicker } from "./MediaPicker";
import { PersonChips, isStickerEmoji, kindDefaults } from "./KindFields";

/** Speaker key: "me", "them" (1:1) or "g<index>" (group member). */
type Who = string;

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
  const dir = useLocale() === "ar" ? "rtl" : "ltr";

  const last = scenario.messages[scenario.messages.length - 1];
  const [rawWho, setWho] = useState<Who>(last?.sender === "them" ? "me" : "them");
  const lastThem = useRef<Who>("g0");
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusTick > 0) inputRef.current?.focus();
  }, [focusTick]);

  const members = scenario.group?.members ?? null;
  // normalise the key for the current chat type (1:1 ⇄ group can change under us)
  const who: Who = members
    ? rawWho === "me"
      ? "me"
      : rawWho.startsWith("g") && Number(rawWho.slice(1)) < members.length
        ? rawWho
        : "g0"
    : rawWho === "me"
      ? "me"
      : "them";
  const sender: Sender = who === "me" ? "me" : "them";
  const authorIndex = members && who !== "me" ? Number(who.slice(1)) : undefined;
  const person = sender === "me" ? scenario.me : members ? members[authorIndex ?? 0] : scenario.them;
  const name = person.name || (sender === "me" ? t.meShort : t.themShort);

  const choose = (next: Who) => {
    if (next !== "me") lastThem.current = next;
    setWho(next);
  };

  const create = (patch: MessagePatch) => {
    const prev = scenario.messages[scenario.messages.length - 1];
    const extra: Partial<Message> = authorIndex !== undefined ? { authorIndex } : {};
    const draft = { ...createBlankMessage(sender), ...extra, ...patch } as Message;
    // natural pacing from the length (and the message before) as a start
    onAdded(addMessage(sender, { ...extra, ...patch, ...naturalTiming(draft, prev) }));
  };

  const createKind = (type: MessageType, patch: MessagePatch = {}) => {
    const blank = { ...createBlankMessage(sender), text: "" };
    create({ ...kindDefaults(blank, type, t), ...patch });
  };

  const submit = (switchAfter: boolean) => {
    const body = text.trim();
    if (!body) return;
    create({ text: body });
    setText("");
    if (switchAfter) {
      if (members) choose(who === "me" ? lastThem.current : "me");
      else choose(who === "me" ? "them" : "me");
    }
  };

  const groupOptions = members
    ? [
        ...members.map((p, i) => ({
          key: `g${i}`,
          person: p,
          label: p.name || fmt(t.memberName, { n: i + 1 }),
          tone: "them" as const,
        })),
        { key: "me", person: scenario.me, label: scenario.me.name || t.meShort, tone: "me" as const },
      ]
    : [];

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
          {members ? (
            <PersonChips
              aria-label={t.sendAs}
              options={groupOptions}
              value={who}
              onChange={choose}
              compact={members.length > 2}
              className="min-w-0 flex-nowrap overflow-x-auto [scrollbar-width:none]"
            />
          ) : (
            <SegmentedControl<Sender>
              aria-label={t.sendAs}
              size="sm"
              value={sender}
              onChange={(s) => choose(s)}
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
          )}
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
          <MediaPicker
            value={null}
            allowRemove={false}
            align="end"
            label={t.addImage}
            t={t}
            onChange={(src) => {
              if (!src) return;
              create({ type: "image", imageSrc: src, text: text.trim() });
              setText("");
            }}
          >
            {(toggle, open) => (
              <Tooltip content={t.addImage}>
                <Button variant="ghost" size="icon-sm" aria-label={t.addImage} aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
                  <ImagePlus />
                </Button>
              </Tooltip>
            )}
          </MediaPicker>
          <DropdownMenu dir={dir} modal={false}>
            <Tooltip content={t.addAttachment}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t.addAttachment}>
                  <Paperclip />
                </Button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onSelect={() => {
                  // emoji typed in the box become the sticker
                  if (isStickerEmoji(text)) {
                    createKind("sticker", { text: text.trim() });
                    setText("");
                  } else createKind("sticker");
                }}
              >
                <Sticker /> {t.typeSticker}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => createKind("location")}>
                <MapPin /> {t.typeLocation}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => createKind("file")}>
                <FileText /> {t.presetInvoice}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => createKind("call", { call: { video: false, missed: true } })}>
                <PhoneMissed /> {t.callMissedVoice}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => createKind("call", { call: { video: true, missed: false, duration: "4:12" } })}>
                <Video /> {t.callVideo}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => createKind("deleted")}>
                <Ban /> {t.typeDeleted}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
