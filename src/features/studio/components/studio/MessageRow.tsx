"use client";

import { memo, useId, useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  Ellipsis,
  FileText,
  GripVertical,
  Hourglass,
  ImagePlus,
  Image as ImageIcon,
  Lock,
  LockOpen,
  MapPin,
  Mic,
  PenLine,
  Phone,
  PhoneMissed,
  Reply,
  Sticker,
  Trash2,
  Type,
  Video,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Slider } from "@/shared/components/ui/slider";
import { Switch } from "@/shared/components/ui/switch";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useShallow } from "zustand/react/shallow";

import { useStudioStore, type MessagePatch } from "../../store";
import type { DeliveryStatus, Message, MessageType, Person } from "../../types";
import { firstUrl, syncLinkPreview } from "../../services/link-preview";
import { isTimeLocked } from "../../services/auto-times";
import { Avatar } from "../shared";
import type { StudioLabels } from "../labels";
import { fmt, formatSeconds } from "./timing";
import { ReactionPicker } from "./ReactionPicker";
import { messageSnippet } from "./snippet";
import { MediaPicker } from "./MediaPicker";
import {
  CallFields,
  DeletedPreview,
  FileFields,
  LinkPreviewChip,
  LinkPreviewFields,
  LocationFields,
  PersonChips,
  StickerFields,
  kindDefaults,
} from "./KindFields";

/** Small glyph for the message kind in the row header. */
function KindIcon({ m }: { m: Message }) {
  switch (m.type) {
    case "voice":
      return <Mic className="size-3" />;
    case "image":
      return <ImageIcon className="size-3" />;
    case "sticker":
      return <Sticker className="size-3" />;
    case "location":
      return <MapPin className="size-3" />;
    case "file":
      return <FileText className="size-3" />;
    case "call":
      return m.call?.missed ? (
        <PhoneMissed className="size-3 text-destructive" />
      ) : m.call?.video ? (
        <Video className="size-3" />
      ) : (
        <Phone className="size-3" />
      );
    case "deleted":
      return <Ban className="size-3" />;
    default:
      return null;
  }
}

/** Display person for a message: me, the 1:1 contact, or the group member who wrote it. */
export function authorOf(m: Message, me: Person, them: Person, members: Person[] | null): Person {
  if (m.sender === "me") return me;
  if (!members || members.length === 0) return them;
  return members[m.authorIndex ?? 0] ?? members[0];
}

export type DragState = { dragId: string | null; overIndex: number | null };

type RowProps = {
  m: Message;
  index: number;
  total: number;
  me: Person;
  them: Person;
  /** group chat members (null for a 1:1 chat) */
  members: Person[] | null;
  t: StudioLabels;
  dir: "rtl" | "ltr";
  /** compose typing is on (my text messages are typed into the composer) */
  composeTyping: boolean;
  selected: boolean;
  live?: boolean;
  expanded: boolean;
  dragging: boolean;
  dropBefore: boolean;
  dropAfter: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDragStart: (id: string) => void;
  onDragOver: (index: number, after: boolean) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onAutoTiming: (id: string) => void;
};

function StatusIcon({ status, className }: { status: DeliveryStatus; className?: string }) {
  if (status === "sent") return <Check className={className} />;
  return <CheckCheck className={cn(className, status === "read" && "text-sky-500")} />;
}

function MetaChip({
  icon,
  children,
  onClick,
  label,
  active,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active: boolean;
}) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={typeof children === "string" && children ? `${label}: ${children}` : label}
        className={cn(
          "inline-flex h-6 cursor-pointer items-center gap-1 rounded-md px-1.5 text-[11px] font-medium tabular-nums transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3",
          active ? "bg-primary/10 text-primary" : "bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        {icon}
        {children}
      </button>
    </Tooltip>
  );
}

function TimingSlider({
  label,
  hint,
  valueMs,
  onChange,
  unit,
  autoLabel,
}: {
  label: string;
  hint: string;
  valueMs: number;
  onChange: (ms: number) => void;
  unit: string;
  /** shown instead of "0.0 s" when 0 means automatic */
  autoLabel?: string;
}) {
  const id = useId();
  const seconds = Math.round(valueMs / 100) / 10;
  const auto = !!autoLabel && valueMs <= 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
        </label>
        {auto ? (
          <span className="rounded bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">{autoLabel}</span>
        ) : (
          <span className="text-xs font-semibold tabular-nums text-foreground" dir="ltr">
            {seconds.toFixed(1)}
            <span className="ms-0.5 font-normal text-muted-foreground">{unit}</span>
          </span>
        )}
      </div>
      <Slider
        id={id}
        min={0}
        max={8}
        step={0.1}
        value={Math.min(seconds, 8)}
        onValueChange={(v) => onChange(Math.round(v * 1000))}
        aria-valuetext={auto ? autoLabel : `${seconds.toFixed(1)} ${unit}`}
      />
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

const NO_REPLY = "__none";

/** "Reply to…" picker: any earlier message of the conversation. */
function ReplyField({
  m,
  index,
  t,
  dir,
  me,
  them,
  members,
  onChange,
}: {
  m: Message;
  index: number;
  t: StudioLabels;
  dir: "rtl" | "ltr";
  me: Person;
  them: Person;
  members: Person[] | null;
  onChange: (id: string | null) => void;
}) {
  const id = useId();
  const earlier = useStudioStore(useShallow((s) => s.scenario.messages.slice(0, index)));
  const value = m.replyToId && earlier.some((x) => x.id === m.replyToId) ? m.replyToId : NO_REPLY;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground">
        <Reply className="size-3 rtl:-scale-x-100" /> {t.replyTo}
      </label>
      <Select dir={dir} value={value} onValueChange={(v) => onChange(v === NO_REPLY ? null : v)} disabled={index === 0}>
        <SelectTrigger id={id} size="sm" data-reply-trigger="" className="w-full min-w-0 text-xs [&>span]:truncate">
          <SelectValue placeholder={t.noReply} />
        </SelectTrigger>
        <SelectContent className="max-w-[min(22rem,calc(100vw-2rem))]">
          <SelectItem value={NO_REPLY} className="text-xs">
            {t.noReply}
          </SelectItem>
          {earlier.map((x, i) => (
            <SelectItem key={x.id} value={x.id} className="text-xs">
              <span className="truncate">
                #{i + 1} · <bdi>{authorOf(x, me, them, members).name || (x.sender === "me" ? t.meShort : t.themShort)}</bdi>: <bdi>{messageSnippet(x, t, 40)}</bdi>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {index === 0 && <p className="mt-1 text-[11px] text-muted-foreground">{t.replyFirstHint}</p>}
    </div>
  );
}

function MessageRowImpl({
  m,
  index,
  total,
  me,
  them,
  members,
  t,
  dir,
  composeTyping,
  selected,
  live = false,
  expanded,
  dragging,
  dropBefore,
  dropAfter,
  onSelect,
  onToggleExpand,
  onRemove,
  onDuplicate,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onAutoTiming,
}: RowProps) {
  const updateMessage = useStudioStore((s) => s.updateMessage);
  const update = (id: string, patch: MessagePatch) => updateMessage(id, patch);
  const patchThis = (patch: MessagePatch) => updateMessage(m.id, patch);
  const quoted = useStudioStore((s) => (m.replyToId ? (s.scenario.messages.find((x) => x.id === m.replyToId) ?? null) : null));
  const quotedIndex = useStudioStore((s) => (m.replyToId ? s.scenario.messages.findIndex((x) => x.id === m.replyToId) : -1));
  const rowRef = useRef<HTMLLIElement>(null);
  const armed = useRef(false);
  const detailsId = useId();
  const timeId = useId();
  const editedId = useId();

  const mine = m.sender === "me";
  const group = !!members && members.length > 0;
  const person = authorOf(m, me, them, members);
  const who = person.name || (mine ? t.meShort : t.themShort);
  const locked = isTimeLocked(m);
  const authorKey = mine ? "me" : `m${Math.min(m.authorIndex ?? 0, (members?.length ?? 1) - 1)}`;
  const setAuthor = (key: string) => {
    if (key === "me") updateMessage(m.id, { sender: "me", authorIndex: undefined });
    else updateMessage(m.id, { sender: "them", authorIndex: Number(key.slice(1)) });
  };
  const authorChips = group
    ? (members ?? []).map((p, i) => ({ key: `m${i}`, person: p, label: p.name || fmt(t.memberName, { n: i + 1 }), tone: "them" as const }))
    : [];
  const n = index + 1;
  const messageLabel = fmt(t.jumpTo, { n });
  const replyState: "none" | "ok" | "missing" | "later" = !m.replyToId
    ? "none"
    : !quoted
      ? "missing"
      : quotedIndex > index
        ? "later"
        : "ok";
  const composes = mine && m.type === "text" && composeTyping;

  const requestReply = () => {
    if (!expanded) onToggleExpand(m.id);
    window.setTimeout(() => rowRef.current?.querySelector<HTMLElement>("[data-reply-trigger]")?.focus(), 60);
  };

  const onText = (text: string) => {
    // keep a link preview pointing at the (edited) first URL of the text
    const url = m.link ? firstUrl(text) : null;
    const link = m.link && url ? syncLinkPreview(m.link, url) : m.link;
    update(m.id, link !== m.link ? { text, link } : { text });
  };

  const typeOptions: { value: MessageType; label: string; icon: React.ReactNode }[] = [
    { value: "text", label: t.typeText, icon: <Type /> },
    { value: "voice", label: t.typeVoice, icon: <Mic /> },
    { value: "image", label: t.typeImage, icon: <ImageIcon /> },
    { value: "sticker", label: t.typeSticker, icon: <Sticker /> },
    { value: "location", label: t.typeLocation, icon: <MapPin /> },
    { value: "file", label: t.typeFile, icon: <FileText /> },
    { value: "call", label: t.typeCall, icon: <Phone /> },
    { value: "deleted", label: t.typeDeleted, icon: <Ban /> },
  ];
  const hasText = m.type === "text" || m.type === "image";

  return (
    <li
      ref={rowRef}
      data-msg-id={m.id}
      draggable={false}
      onFocusCapture={() => onSelect(m.id)}
      onDragStart={(e) => {
        if (!armed.current) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", m.id);
        onDragStart(m.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        onDragOver(index, e.clientY > r.top + r.height / 2);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={() => {
        armed.current = false;
        rowRef.current?.setAttribute("draggable", "false");
        onDragEnd();
      }}
      className={cn(
        "group/row relative rounded-xl border bg-card transition-[border-color,box-shadow,opacity] duration-150 ease-studio",
        selected
          ? "border-primary/45 shadow-studio-card ring-[3px] ring-primary/10"
          : "border-border hover:border-foreground/15",
        live && !selected && "border-primary/30 bg-primary/[0.035]",
        dragging && "opacity-40",
      )}
    >
      {dropBefore && <span aria-hidden className="absolute inset-x-2 -top-[5px] h-0.5 rounded-full bg-primary" />}
      {dropAfter && <span aria-hidden className="absolute inset-x-2 -bottom-[5px] h-0.5 rounded-full bg-primary" />}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 start-0 w-[3px] rounded-e-full",
          mine ? "bg-studio-me" : "bg-studio-them",
        )}
      />

      {/* Header */}
      <div className="flex items-center gap-1 ps-1 pe-1.5 pt-1.5">
        <Tooltip content={t.dragToReorder}>
          <button
            type="button"
            aria-label={`${t.dragToReorder} — ${fmt(t.jumpTo, { n })}`}
            onPointerDown={() => {
              armed.current = true;
              rowRef.current?.setAttribute("draggable", "true");
            }}
            onPointerUp={() => {
              armed.current = false;
              rowRef.current?.setAttribute("draggable", "false");
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" && index > 0) {
                e.preventDefault();
                onMove(m.id, -1);
              } else if (e.key === "ArrowDown" && index < total - 1) {
                e.preventDefault();
                onMove(m.id, 1);
              }
            }}
            className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-opacity outline-none group-hover/row:opacity-100 group-focus-within/row:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 active:cursor-grabbing [@media(hover:none)]:opacity-100"
          >
            <GripVertical className="size-3.5" />
          </button>
        </Tooltip>

        {group ? (
          <DropdownMenu dir={dir} modal={false}>
            <Tooltip content={t.sentBy}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${t.sentBy}: ${who}`}
                  className={cn(
                    "flex h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded-full py-0.5 ps-0.5 pe-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    mine ? "bg-studio-me/10 text-foreground hover:bg-studio-me/15" : "bg-muted text-foreground hover:bg-accent",
                  )}
                >
                  <Avatar person={person} size={20} />
                  <span className="max-w-24 truncate">{who}</span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.sentBy}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={authorKey} onValueChange={setAuthor}>
                {authorChips.map((o) => (
                  <DropdownMenuRadioItem key={o.key} value={o.key}>
                    <Avatar person={o.person} size={20} />
                    <span className="truncate">{o.label}</span>
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="me">
                  <Avatar person={me} size={20} />
                  <span className="truncate">{me.name || t.meShort}</span>
                  <span className="ms-auto text-[11px] text-muted-foreground">{t.meShort}</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip content={t.switchSender}>
            <button
              type="button"
              onClick={() => update(m.id, { sender: mine ? "them" : "me" })}
              aria-label={`${t.sender}: ${who}. ${t.switchSender}`}
              className={cn(
                "flex h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded-full py-0.5 ps-0.5 pe-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                mine
                  ? "bg-studio-me/10 text-foreground hover:bg-studio-me/15"
                  : "bg-muted text-foreground hover:bg-accent",
              )}
            >
              <Avatar person={person} size={20} />
              <span className="max-w-28 truncate">{who}</span>
            </button>
          </Tooltip>
        )}

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={`${expanded ? t.hideDetails : t.details} — ${fmt(t.jumpTo, { n })}`}
          onClick={() => onToggleExpand(m.id)}
          className="flex h-7 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-[11px] text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {live ? (
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          ) : (
            <span className="font-mono tabular-nums opacity-70">#{n}</span>
          )}
          <KindIcon m={m} />
          {m.edited && <PenLine aria-label={t.edited} className="size-3 opacity-70" />}
        </button>

        {/* Meta chips (hidden behind the action bar while hovering on desktop) */}
        <div className="flex shrink-0 items-center gap-1">
          <MetaChip icon={<Hourglass />} label={t.delay} active={expanded} onClick={() => onToggleExpand(m.id)}>
            {`${formatSeconds(m.delayMs)}${t.seconds}`}
          </MetaChip>
          {!mine ? (
            <MetaChip icon={<PenLine />} label={t.typingDur} active={expanded} onClick={() => onToggleExpand(m.id)}>
              {`${formatSeconds(m.typingMs)}${t.seconds}`}
            </MetaChip>
          ) : (
            <MetaChip
              icon={<StatusIcon status={m.status} />}
              label={`${t.status}: ${m.status === "sent" ? t.sent : m.status === "delivered" ? t.delivered : t.read}`}
              active={expanded}
              onClick={() => onToggleExpand(m.id)}
            >
              {""}
            </MetaChip>
          )}
          <span className="flex min-w-9 items-center justify-end gap-0.5 text-[11px] tabular-nums text-muted-foreground" dir="ltr">
            {locked && <Lock aria-label={t.timeLockedHint} className="size-2.5 opacity-70" />}
            {m.time}
          </span>
        </div>

        <div
          className={cn(
            "absolute end-1.5 top-1.5 flex items-center rounded-lg bg-card p-px shadow-studio-card ring-1 ring-border transition-[opacity,visibility] duration-150",
            "invisible opacity-0 group-hover/row:visible group-hover/row:opacity-100 group-focus-within/row:visible group-focus-within/row:opacity-100",
            "[@media(hover:none)]:visible [@media(hover:none)]:static [@media(hover:none)]:opacity-100 [@media(hover:none)]:shadow-none [@media(hover:none)]:ring-0",
          )}
        >
          <ReactionPicker
            value={m.reaction}
            mine={mine}
            onChange={(reaction) => update(m.id, { reaction })}
            t={t}
            variant="icon"
            messageLabel={messageLabel}
          />
          <Tooltip content={t.duplicate} shortcut="Ctrl D">
            <Button variant="ghost" size="icon-xs" aria-label={t.duplicate} onClick={() => onDuplicate(m.id)} className="[@media(hover:none)]:hidden">
              <Copy className="size-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content={t.delete} shortcut="Del">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t.delete}
              onClick={() => onRemove(m.id)}
              className="hover:bg-destructive/10 hover:text-destructive [@media(hover:none)]:hidden"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </Tooltip>
          <DropdownMenu dir={dir} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={t.moreActions}>
                <Ellipsis className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(m.id, -1)}>
                <ArrowUp /> {t.moveUp}
                <span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">Alt ↑</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={index === total - 1} onSelect={() => onMove(m.id, 1)}>
                <ArrowDown /> {t.moveDown}
                <span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">Alt ↓</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={index === 0} onSelect={requestReply}>
                <Reply className="rtl:-scale-x-100" /> {t.replyTo}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAutoTiming(m.id)}>
                <Wand2 /> {t.autoTimingOne}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onDuplicate(m.id)}>
                <Copy /> {t.duplicate}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onRemove(m.id)}>
                <Trash2 /> {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pt-0.5 pb-2">
        {replyState !== "none" && (
          <div
            className={cn(
              "mb-1.5 flex items-center gap-2 rounded-md border-s-[3px] py-1 ps-2 pe-1 text-[11.5px]",
              replyState === "ok"
                ? quoted?.sender === "me"
                  ? "border-studio-me bg-studio-me/[0.07]"
                  : "border-studio-them bg-muted/70"
                : "border-amber-500 bg-amber-500/10",
            )}
          >
            <Reply aria-hidden className="size-3 shrink-0 text-muted-foreground rtl:-scale-x-100" />
            <span className="min-w-0 flex-1">
              {replyState === "ok" && quoted ? (
                <>
                  <span className="sr-only">{t.replyingTo}: </span>
                  <span className="block truncate font-semibold text-foreground">
                    <bdi>{authorOf(quoted, me, them, members).name || (quoted.sender === "me" ? t.meShort : t.themShort)}</bdi>
                    <span className="ms-1 font-normal text-muted-foreground">#{quotedIndex + 1}</span>
                  </span>
                  <span className="block truncate text-muted-foreground" dir="auto">
                    {messageSnippet(quoted, t)}
                  </span>
                </>
              ) : (
                <span className="block text-amber-700 dark:text-amber-400">
                  {replyState === "missing" ? t.replyMissing : t.replyLater}
                </span>
              )}
            </span>
            <Tooltip content={t.removeReply}>
              <button
                type="button"
                onClick={() => update(m.id, { replyToId: null })}
                aria-label={`${t.removeReply} — ${messageLabel}`}
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <X className="size-3" />
              </button>
            </Tooltip>
          </div>
        )}
        {m.type === "voice" ? (
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/70 px-2.5 py-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-studio-me/15 text-primary">
              <Mic className="size-3.5" />
            </span>
            <span aria-hidden className="flex h-5 flex-1 items-center gap-[3px] overflow-hidden">
              {Array.from({ length: 22 }, (_, i) => (
                <span
                  key={i}
                  className="w-[3px] shrink-0 rounded-full bg-foreground/25"
                  style={{ height: `${30 + ((i * 37) % 70)}%` }}
                />
              ))}
            </span>
            <Input
              aria-label={t.voiceLen}
              value={m.voiceDuration ?? ""}
              placeholder="0:08"
              dir="ltr"
              onChange={(e) => update(m.id, { voiceDuration: e.target.value })}
              className="h-7 w-16 text-center text-xs tabular-nums"
            />
          </div>
        ) : m.type === "sticker" ? (
          <StickerFields m={m} t={t} update={patchThis} label={messageLabel} />
        ) : m.type === "location" ? (
          <LocationFields m={m} t={t} update={patchThis} />
        ) : m.type === "file" ? (
          <FileFields m={m} t={t} update={patchThis} />
        ) : m.type === "call" ? (
          <CallFields m={m} t={t} update={patchThis} />
        ) : m.type === "deleted" ? (
          <DeletedPreview t={t} />
        ) : (
          <>
            {m.type === "image" && (
              <div className="mb-1.5">
                <MediaPicker value={m.imageSrc} onChange={(imageSrc) => update(m.id, { imageSrc })} t={t} label={m.imageSrc ? t.replaceImage : t.uploadImage}>
                  {(toggle, open) => (
                    <button
                      type="button"
                      onClick={toggle}
                      aria-haspopup="dialog"
                      aria-expanded={open}
                      aria-label={`${m.imageSrc ? t.replaceImage : t.uploadImage} — ${messageLabel}`}
                      className={cn(
                        "group/img relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                        m.imageSrc ? "max-h-40 bg-muted" : "h-20 border border-dashed border-input bg-muted/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {m.imageSrc ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.imageSrc} alt="" className="max-h-40 w-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 text-xs font-medium text-white opacity-0 transition-opacity group-hover/img:opacity-100 group-focus-visible/img:opacity-100">
                            <ImagePlus className="size-4" /> {t.replaceImage}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                          <ImagePlus className="size-4" /> {t.imageDrop}
                        </span>
                      )}
                    </button>
                  )}
                </MediaPicker>
              </div>
            )}
            <textarea
              value={m.text}
              onChange={(e) => onText(e.target.value)}
              placeholder={m.type === "image" ? t.imageCaption : t.messagePlaceholder}
              aria-label={`${m.type === "image" ? t.imageCaption : t.text} — ${fmt(t.jumpTo, { n })}`}
              rows={1}
              dir="auto"
              className="studio-field-auto block max-h-44 min-h-7 w-full resize-none rounded-md bg-transparent px-1 py-1 text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 hover:bg-muted/50 focus-visible:bg-muted/50"
            />
            {m.type === "text" && m.link && <LinkPreviewChip link={m.link} />}
          </>
        )}
        {m.reaction && (
          <div className="mt-1 flex justify-end">
            <ReactionPicker
              value={m.reaction}
              mine={mine}
              onChange={(reaction) => update(m.id, { reaction })}
              t={t}
              variant="badge"
              messageLabel={messageLabel}
            />
          </div>
        )}
      </div>

      {/* Details */}
      <div
        id={detailsId}
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-studio",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        inert={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3.5 border-t border-border/70 px-3 pt-3 pb-3.5">
            <div>
              <p className="mb-1.5 text-xs font-medium text-foreground" id={`${detailsId}-type`}>
                {t.type}
              </p>
              <SegmentedControl<MessageType>
                aria-labelledby={`${detailsId}-type`}
                size="sm"
                value={m.type}
                onChange={(type) => update(m.id, kindDefaults(m, type, t))}
                options={typeOptions}
                className="grid grid-cols-4 [&>button]:px-1"
              />
            </div>

            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <div>
                <label htmlFor={timeId} className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground">
                  <Clock className="size-3" /> {t.time}
                </label>
                <div className="flex items-center gap-1">
                  <Input
                    id={timeId}
                    value={m.time}
                    dir="ltr"
                    onChange={(e) => update(m.id, { time: e.target.value, timeLocked: true })}
                    aria-describedby={locked ? `${timeId}-lock` : undefined}
                    className="h-7 w-[5.25rem] text-center text-xs tabular-nums"
                  />
                  <Tooltip content={locked ? t.timeUnlock : t.timeLock}>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-pressed={locked}
                      aria-label={t.timeLock}
                      onClick={() => update(m.id, { timeLocked: !locked })}
                      className={cn(locked && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary")}
                    >
                      {locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                    </Button>
                  </Tooltip>
                </div>
                {locked && (
                  <p id={`${timeId}-lock`} className="mt-1 text-[11px] text-muted-foreground">
                    {t.timeLockedHint}
                  </p>
                )}
              </div>
              {hasText && (
                <div className="flex min-h-7 items-center gap-2 pb-px">
                  <Switch id={editedId} checked={!!m.edited} onCheckedChange={(edited) => update(m.id, { edited: edited || undefined })} aria-describedby={`${editedId}-hint`} />
                  <label htmlFor={editedId} className="cursor-pointer text-xs font-medium">
                    {t.edited}
                    <span id={`${editedId}-hint`} className="block text-[11px] font-normal text-muted-foreground">
                      {t.editedHint}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {group && !mine && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground" id={`${detailsId}-author`}>
                  {t.sentBy}
                </p>
                <PersonChips aria-labelledby={`${detailsId}-author`} options={authorChips} value={authorKey} onChange={setAuthor} />
              </div>
            )}

            {m.type === "text" && <LinkPreviewFields m={m} t={t} update={patchThis} />}

            <ReplyField
              m={m}
              index={index}
              t={t}
              dir={dir}
              me={me}
              them={them}
              members={members}
              onChange={(replyToId) => update(m.id, { replyToId })}
            />

            {mine && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground" id={`${detailsId}-status`}>
                  {t.status}
                </p>
                <SegmentedControl<DeliveryStatus>
                  aria-labelledby={`${detailsId}-status`}
                  size="sm"
                  value={m.status}
                  onChange={(status) => update(m.id, { status })}
                  options={[
                    { value: "sent", label: t.sent, icon: <Check /> },
                    { value: "delivered", label: t.delivered, icon: <CheckCheck /> },
                    { value: "read", label: t.read, icon: <CheckCheck className="text-sky-500" /> },
                  ]}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
              <p className="text-xs font-semibold text-foreground">{t.timing}</p>
              <Button variant="soft" size="xs" onClick={() => onAutoTiming(m.id)} className="gap-1">
                <Wand2 className="size-3.5" />
                {t.autoTimingOne}
              </Button>
            </div>
            <TimingSlider
              label={t.delay}
              hint={t.delayHint}
              valueMs={m.delayMs}
              unit={t.seconds}
              onChange={(delayMs) => update(m.id, { delayMs })}
            />
            {!mine && (
              <TimingSlider
                label={t.typingDur}
                hint={t.typingHint}
                valueMs={m.typingMs}
                unit={t.seconds}
                onChange={(typingMs) => update(m.id, { typingMs })}
              />
            )}
            {composes && (
              <TimingSlider
                label={t.composeDur}
                hint={t.composeDurHint}
                valueMs={m.typingMs}
                unit={t.seconds}
                autoLabel={t.auto}
                onChange={(typingMs) => update(m.id, { typingMs })}
              />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export const MessageRow = memo(MessageRowImpl);
