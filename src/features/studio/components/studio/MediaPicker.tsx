"use client";

import { useId, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Check, Trash2, Upload } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Popover } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import { MEDIA_AVATARS, MEDIA_PHOTOS, type MediaAsset, type MediaKind } from "../../data/media-library";
import type { StudioLabels } from "../labels";
import { readImageFile } from "./image-utils";

/** Arrow-key movement inside a grid of buttons (mirrored in RTL). */
function onGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>, cols: number) {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
  const idx = items.indexOf(document.activeElement as HTMLButtonElement);
  if (idx < 0) return;
  e.preventDefault();
  const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
  let next = idx;
  if (e.key === "Home") next = 0;
  else if (e.key === "End") next = items.length - 1;
  else if (e.key === "ArrowUp") next = idx - cols;
  else if (e.key === "ArrowDown") next = idx + cols;
  else next = idx + ((e.key === "ArrowRight") !== rtl ? 1 : -1);
  items[Math.min(Math.max(next, 0), items.length - 1)]?.focus();
}

function AssetGrid({
  title,
  assets,
  value,
  cols,
  round,
  lang,
  onPick,
}: {
  title: string;
  assets: MediaAsset[];
  value: string | null | undefined;
  cols: number;
  round: boolean;
  lang: "ar" | "en";
  onPick: (src: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <p id={id} className="mb-1.5 px-0.5 text-[11px] font-medium text-muted-foreground">
        {title}
      </p>
      <div
        role="group"
        aria-labelledby={id}
        onKeyDown={(e) => onGridKeyDown(e, cols)}
        className={cn("grid gap-1.5", cols === 5 ? "grid-cols-5" : "grid-cols-3")}
      >
        {assets.map((a) => {
          const active = value === a.src;
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={active}
              aria-label={a.label[lang]}
              title={a.label[lang]}
              onClick={() => onPick(a.src)}
              className={cn(
                "relative cursor-pointer overflow-hidden bg-muted outline-none transition-[box-shadow,transform] duration-150 ease-studio active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                round ? "aspect-square rounded-full" : "aspect-[4/3] rounded-lg",
                active ? "ring-2 ring-primary ring-offset-2 ring-offset-popover" : "ring-1 ring-border hover:ring-foreground/30",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL from the built-in library */}
              <img src={a.src} alt="" className="size-full object-cover" draggable={false} />
              {active && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                  <Check className="size-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Image chooser: upload from the device or pick a built-in asset (people,
 * logos, product photos). `children` renders the trigger and gets `toggle`.
 */
export function MediaPicker({
  value,
  onChange,
  t,
  label,
  prefer = "photo",
  maxDim = 1280,
  allowRemove = true,
  align = "start",
  children,
}: {
  value: string | null | undefined;
  onChange: (src: string | null) => void;
  t: StudioLabels;
  /** accessible name of the picker, e.g. "Group photo" */
  label: string;
  /** which library section comes first */
  prefer?: MediaKind;
  maxDim?: number;
  allowRemove?: boolean;
  align?: "start" | "center" | "end";
  children: (toggle: () => void, open: boolean) => React.ReactNode;
}) {
  const lang = useLocale() === "en" ? "en" : "ar";
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (src: string | null) => {
    onChange(src);
    setOpen(false);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    pick(await readImageFile(file, maxDim));
  };

  const photos = (
    <AssetGrid key="p" title={t.mediaPhotos} assets={MEDIA_PHOTOS} value={value} cols={3} round={false} lang={lang} onPick={pick} />
  );
  const avatars = (
    <AssetGrid key="a" title={t.mediaAvatars} assets={MEDIA_AVATARS} value={value} cols={5} round lang={lang} onPick={pick} />
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label={label}
      align={align}
      className="w-[min(18.5rem,calc(100vw-1.5rem))] p-2.5"
      trigger={children(() => setOpen((o) => !o), open)}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <p className="text-[13px] font-semibold">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{t.mediaHint}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mb-2.5 w-full justify-center"
        onClick={() => fileRef.current?.click()}
        data-autofocus
      >
        <Upload className="size-3.5" />
        {t.mediaUpload}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="space-y-2.5">{prefer === "avatar" ? [avatars, photos] : [photos, avatars]}</div>
      {allowRemove && value && (
        <Button
          variant="ghost"
          size="xs"
          className="mt-2 w-full justify-center hover:bg-destructive/10 hover:text-destructive"
          onClick={() => pick(null)}
        >
          <Trash2 className="size-3.5" />
          {t.mediaRemove}
        </Button>
      )}
    </Popover>
  );
}
