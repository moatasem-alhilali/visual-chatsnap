"use client";

import { useId } from "react";
import {
  Ban,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Link2,
  MapPin,
  Phone,
  PhoneMissed,
  Radio,
  Smile,
  Video,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input, Textarea } from "@/shared/components/ui/input";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { CallEntry, FileShare, LinkPreview, LocationShare, Message, Person } from "../../types";
import { draftLinkPreview, firstUrl, hostOf } from "../../services/link-preview";
import { graphemes } from "../../playback/compose";
import { Avatar } from "../shared";
import type { StudioLabels } from "../labels";
import { MediaPicker } from "./MediaPicker";
import type { MessagePatch } from "../../store";

type Update = (patch: MessagePatch) => void;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const EMOJI_RE = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Modifier}|‍|️|⃣|\s)+$/u;

/** 1–3 emoji (as user-perceived characters), nothing else. */
export function isStickerEmoji(text: string): boolean {
  const t = text.trim();
  if (!t || !EMOJI_RE.test(t) || /^[\d#*\s]+$/.test(t)) return false;
  return graphemes(t.replace(/\s+/g, "")).length <= 3;
}

export const STICKER_EMOJI = ["🎉", "😂", "❤️", "👍", "🔥", "🥳", "😍", "🙏"];

function MiniField({
  label,
  children,
  htmlFor,
  className,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Defaults a message gets when its type changes to one of the new kinds. */
export function kindDefaults(m: Message, type: Message["type"], t: StudioLabels): MessagePatch {
  switch (type) {
    case "voice":
      return { type, ...(m.voiceDuration ? {} : { voiceDuration: "0:08" }) };
    case "sticker":
      return { type, ...(m.imageSrc || isStickerEmoji(m.text) ? {} : { text: "🎉" }) };
    case "location":
      return { type, ...(m.location ? {} : { location: { title: t.locationDefaultTitle, subtitle: t.locationDefaultSubtitle } }) };
    case "file":
      return { type, ...(m.file ? {} : { file: { name: t.invoiceName, size: "245 KB", pages: t.invoicePages } }) };
    case "call":
      return { type, ...(m.call ? {} : { call: { video: false, missed: true } }), ...(m.sender === "them" ? { typingMs: 0 } : {}) };
    default:
      return { type };
  }
}

/* ------------------------------------------------------------------ */
/* Sticker                                                             */
/* ------------------------------------------------------------------ */

export function StickerFields({ m, t, update, label }: { m: Message; t: StudioLabels; update: Update; label: string }) {
  const id = useId();
  const valid = !!m.imageSrc || isStickerEmoji(m.text);
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-2">
      <MediaPicker value={m.imageSrc} onChange={(imageSrc) => update({ imageSrc })} t={t} label={t.stickerImage} prefer="photo" maxDim={512}>
        {(toggle, open) => (
          <button
            type="button"
            onClick={toggle}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`${t.stickerImage} — ${label}`}
            className="group/stk relative flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-border outline-none transition-shadow hover:ring-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {m.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL preview
              <img src={m.imageSrc} alt="" className="size-full object-contain" />
            ) : (
              <span className="text-[30px] leading-none" aria-hidden>
                {m.text.trim() || "🙂"}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover/stk:opacity-100 group-focus-visible/stk:opacity-100">
              <ImagePlus className="size-4" />
            </span>
          </button>
        )}
      </MediaPicker>
      <div className="min-w-0 flex-1">
        {m.imageSrc ? (
          <div className="flex h-full flex-col items-start gap-1.5">
            <p className="text-[11.5px] text-muted-foreground">{t.stickerImage}</p>
            <Button variant="outline" size="xs" onClick={() => update({ imageSrc: null, ...(isStickerEmoji(m.text) ? {} : { text: "🎉" }) })}>
              <Smile className="size-3.5" />
              {t.stickerUseEmoji}
            </Button>
          </div>
        ) : (
          <>
            <label htmlFor={id} className="sr-only">
              {t.stickerEmoji}
            </label>
            <Input
              id={id}
              value={m.text}
              onChange={(e) => update({ text: e.target.value })}
              aria-invalid={!valid || undefined}
              aria-describedby={`${id}-hint`}
              className="h-7 w-24 text-center text-base"
            />
            <div role="group" aria-label={t.stickerEmoji} className="mt-1.5 flex flex-wrap gap-0.5">
              {STICKER_EMOJI.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={m.text.trim() === e}
                  onClick={() => update({ text: e })}
                  className={cn(
                    "flex size-7 cursor-pointer items-center justify-center rounded-md text-base outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    m.text.trim() === e ? "bg-primary/12 ring-1 ring-primary/40" : "hover:bg-accent",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <p id={`${id}-hint`} className={cn("mt-1 text-[11px]", valid ? "text-muted-foreground" : "text-destructive")}>
              {valid ? t.stickerHint : t.stickerEmojiInvalid}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Location                                                            */
/* ------------------------------------------------------------------ */

export function LocationFields({ m, t, update }: { m: Message; t: StudioLabels; update: Update }) {
  const id = useId();
  const loc: LocationShare = m.location ?? { title: "" };
  const set = (p: Partial<LocationShare>) => update({ location: { ...loc, ...p } });
  return (
    <div className="space-y-2 rounded-lg bg-muted/60 p-2">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            loc.live ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-sky-500/15 text-sky-600 dark:text-sky-400",
          )}
        >
          {loc.live ? <Radio className="size-4" /> : <MapPin className="size-4" />}
        </span>
        <Input
          id={`${id}-t`}
          aria-label={t.locationTitle}
          value={loc.title}
          placeholder={t.locationTitle}
          onChange={(e) => set({ title: e.target.value })}
          dir="auto"
          className="h-8 flex-1 text-[13px] font-medium"
        />
      </div>
      <Input
        aria-label={t.locationSubtitle}
        value={loc.subtitle ?? ""}
        placeholder={t.locationSubtitle}
        onChange={(e) => set({ subtitle: e.target.value || undefined })}
        dir="auto"
        className="h-7 text-xs"
      />
      <div className="flex items-center gap-2 px-0.5">
        <label htmlFor={`${id}-live`} className="flex-1 cursor-pointer text-xs font-medium">
          {t.locationLive}
          <span className="block text-[11px] font-normal text-muted-foreground">{t.locationLiveHint}</span>
        </label>
        <Switch id={`${id}-live`} checked={!!loc.live} onCheckedChange={(live) => set({ live: live || undefined })} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* File                                                                */
/* ------------------------------------------------------------------ */

function fileTone(name: string): { icon: React.ReactNode; className: string; ext: string } {
  const ext = (/\.([a-z0-9]{1,5})$/i.exec(name.trim())?.[1] ?? "").toLowerCase();
  if (ext === "pdf") return { icon: <FileText className="size-4" />, className: "bg-red-500/12 text-red-600 dark:text-red-400", ext };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { icon: <FileSpreadsheet className="size-4" />, className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400", ext };
  return { icon: <FileText className="size-4" />, className: "bg-sky-500/12 text-sky-600 dark:text-sky-400", ext };
}

export function FileFields({ m, t, update }: { m: Message; t: StudioLabels; update: Update }) {
  const id = useId();
  const file: FileShare = m.file ?? { name: "" };
  const set = (p: Partial<FileShare>) => update({ file: { ...file, ...p } });
  const tone = fileTone(file.name);
  const presets: { label: string; value: FileShare }[] = [
    { label: t.presetInvoice, value: { name: t.invoiceName, size: "245 KB", pages: t.invoicePages } },
    { label: t.presetBrochure, value: { name: t.brochureName, size: "3.8 MB", pages: t.brochurePages } },
    { label: t.presetSheet, value: { name: t.sheetName, size: "86 KB" } },
  ];
  return (
    <div className="space-y-2 rounded-lg bg-muted/60 p-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className={cn("flex size-8 shrink-0 flex-col items-center justify-center rounded-lg", tone.className)}>
          {tone.icon}
        </span>
        <Input
          aria-label={t.fileName}
          value={file.name}
          placeholder={t.fileName}
          onChange={(e) => set({ name: e.target.value })}
          dir="auto"
          className="h-8 flex-1 text-[13px] font-medium"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniField label={t.fileSize} htmlFor={`${id}-s`}>
          <Input
            id={`${id}-s`}
            value={file.size ?? ""}
            placeholder="245 KB"
            onChange={(e) => set({ size: e.target.value || undefined })}
            dir="ltr"
            className="h-7 text-xs tabular-nums"
          />
        </MiniField>
        <MiniField label={t.filePages} htmlFor={`${id}-p`}>
          <Input
            id={`${id}-p`}
            value={file.pages ?? ""}
            placeholder={t.invoicePages}
            onChange={(e) => set({ pages: e.target.value || undefined })}
            dir="auto"
            className="h-7 text-xs"
          />
        </MiniField>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span className="me-0.5 text-[11px] text-muted-foreground">{t.filePresets}:</span>
        {presets.map((p) => (
          <Button key={p.label} variant="outline" size="xs" className="h-6 px-2 text-[11px]" onClick={() => update({ file: p.value })}>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Call                                                                */
/* ------------------------------------------------------------------ */

export function CallFields({ m, t, update }: { m: Message; t: StudioLabels; update: Update }) {
  const id = useId();
  const call: CallEntry = m.call ?? { video: false, missed: true };
  const set = (p: Partial<CallEntry>) => update({ call: { ...call, ...p } });
  return (
    <div className="space-y-2 rounded-lg bg-muted/60 p-2">
      <SegmentedControl<"voice" | "video">
        aria-label={t.callKind}
        size="sm"
        value={call.video ? "video" : "voice"}
        onChange={(v) => set({ video: v === "video" })}
        options={[
          { value: "voice", label: t.callVoice, icon: <Phone /> },
          { value: "video", label: t.callVideo, icon: <Video /> },
        ]}
      />
      <div className="flex items-center gap-3 px-0.5">
        <label htmlFor={`${id}-m`} className="flex flex-1 cursor-pointer items-center gap-1.5 text-xs font-medium">
          <PhoneMissed className={cn("size-3.5", call.missed ? "text-destructive" : "text-muted-foreground")} />
          {t.callMissed}
        </label>
        <Switch id={`${id}-m`} checked={call.missed} onCheckedChange={(missed) => set({ missed })} />
        <span aria-hidden className="h-5 w-px bg-border" />
        <label htmlFor={`${id}-d`} className={cn("text-xs font-medium", call.missed && "text-muted-foreground")}>
          {t.callDuration}
        </label>
        <Input
          id={`${id}-d`}
          value={call.duration ?? ""}
          placeholder="4:12"
          disabled={call.missed}
          onChange={(e) => set({ duration: e.target.value || undefined })}
          dir="ltr"
          className="h-7 w-16 text-center text-xs tabular-nums"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Deleted                                                             */
/* ------------------------------------------------------------------ */

export function DeletedPreview({ t }: { t: StudioLabels }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-2 text-muted-foreground">
      <Ban className="size-3.5 shrink-0" />
      <span className="text-[13px] italic">{t.deletedPreview}</span>
      <span className="ms-auto hidden text-[11px] sm:inline">{t.deletedHint}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Link preview                                                        */
/* ------------------------------------------------------------------ */

/** Compact read-only card under the text, so the preview is visible at a glance. */
export function LinkPreviewChip({ link }: { link: LinkPreview }) {
  return (
    <div className="mt-1 flex items-center gap-2 rounded-md border-s-[3px] border-primary/60 bg-muted/60 py-1 ps-2 pe-1">
      {link.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL preview
        <img src={link.image} alt="" className="size-8 shrink-0 rounded object-cover" />
      ) : (
        <Link2 aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 text-[11.5px] leading-tight">
        <span className="block truncate font-semibold" dir="auto">
          {link.title || hostOf(link.url)}
        </span>
        <span className="block truncate text-muted-foreground" dir="ltr">
          {link.siteName || hostOf(link.url)}
        </span>
      </span>
    </div>
  );
}

export function LinkPreviewFields({ m, t, update }: { m: Message; t: StudioLabels; update: Update }) {
  const id = useId();
  const url = firstUrl(m.text);
  const link = m.link ?? null;
  const set = (p: Partial<LinkPreview>) => link && update({ link: { ...link, ...p } });
  const canEnable = !!url || !!link;
  return (
    <div>
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-on`} className={cn("flex flex-1 items-center gap-1 text-xs font-medium", canEnable && "cursor-pointer")}>
          <Link2 className="size-3" /> {t.linkPreview}
        </label>
        <Switch
          id={`${id}-on`}
          checked={!!link}
          disabled={!canEnable}
          aria-describedby={`${id}-hint`}
          onCheckedChange={(on) => update({ link: on && url ? draftLinkPreview(url) : null })}
        />
      </div>
      <p id={`${id}-hint`} className="mt-1 text-[11px] text-muted-foreground">
        {canEnable ? t.linkPreviewHint : t.linkNoUrl}
      </p>
      {link && (
        <div className="mt-2 flex gap-2.5 rounded-lg border border-border p-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <MediaPicker value={link.image} onChange={(image) => set({ image })} t={t} label={t.linkImage} prefer="photo">
            {(toggle, open) => (
              <button
                type="button"
                onClick={toggle}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={t.linkImage}
                className="group/li relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-muted/40 text-muted-foreground outline-none hover:border-foreground/30 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {link.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL preview
                  <img src={link.image} alt="" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
              </button>
            )}
          </MediaPicker>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Input
              aria-label={t.linkTitle}
              value={link.title}
              placeholder={t.linkTitle}
              onChange={(e) => set({ title: e.target.value })}
              dir="auto"
              className="h-7 text-xs font-semibold"
            />
            <Textarea
              aria-label={t.linkDescription}
              value={link.description ?? ""}
              placeholder={t.linkDescription}
              onChange={(e) => set({ description: e.target.value })}
              dir="auto"
              rows={1}
              className="min-h-7 py-1 text-xs"
            />
            <Input
              aria-label={t.linkSite}
              value={link.siteName ?? ""}
              placeholder={hostOf(link.url)}
              onChange={(e) => set({ siteName: e.target.value })}
              dir="ltr"
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* People chips (author picker)                                        */
/* ------------------------------------------------------------------ */

export type PersonChip = { key: string; person: Person; label: string; tone: "me" | "them" };

/**
 * Single choice among people, drawn as avatar chips (radio-group pattern:
 * one tab stop, arrows move and select, mirrored in RTL). `compact` shows
 * avatars only (names in the accessible label / title).
 */
export function PersonChips({
  options,
  value,
  onChange,
  compact = false,
  className,
  ...aria
}: {
  options: PersonChip[];
  value: string;
  onChange: (key: string) => void;
  compact?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const idx = Math.max(0, options.findIndex((o) => o.key === value));
    let next = idx;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else {
      const forward = e.key === "ArrowDown" || (e.key === "ArrowRight") !== rtl;
      next = (idx + (forward ? 1 : -1) + options.length) % options.length;
    }
    onChange(options[next].key);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };
  return (
    <div role="radiogroup" onKeyDown={onKeyDown} className={cn("flex flex-wrap gap-1", className)} {...aria}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={compact ? o.label : undefined}
            title={compact ? o.label : undefined}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.key)}
            className={cn(
              "flex h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded-full text-xs font-medium outline-none transition-[background-color,box-shadow,color] duration-150 ease-studio focus-visible:ring-[3px] focus-visible:ring-ring/40",
              compact ? "p-0.5" : "py-0.5 ps-0.5 pe-2.5",
              active
                ? o.tone === "me"
                  ? "bg-studio-me/12 text-foreground ring-2 ring-studio-me/60"
                  : "bg-card text-foreground ring-2 ring-primary/60 shadow-studio-card"
                : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Avatar person={o.person} size={22} />
            {!compact && <span className="max-w-24 truncate">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
