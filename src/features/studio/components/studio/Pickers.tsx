"use client";

import { Check, Info } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import type { Device, Platform } from "../../types";
import { PLATFORMS } from "../platforms";
import type { StudioLabels } from "../labels";
import { DeviceGlyph, PlatformMark } from "./BrandMarks";

/** Display name of a platform on a device (iMessage → Samsung Messages on Samsung). */
export function platformName(platform: Platform, device: Device, t: StudioLabels): string {
  if (platform === "imessage" && device === "android") return t.samsungMessages;
  return PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
}

function CheckBadge({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-[opacity,transform] duration-200 ease-studio",
        show ? "scale-100 opacity-100" : "scale-50 opacity-0",
      )}
    >
      <Check className="size-2.5" strokeWidth={3.5} />
    </span>
  );
}

const tileBase =
  "relative flex cursor-pointer flex-col items-center rounded-xl border bg-card text-center outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 ease-studio focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-[0.98]";
const tileOn = "border-primary/70 bg-primary/[0.05] shadow-studio-card ring-1 ring-primary/30";
const tileOff = "border-border hover:border-foreground/20 hover:bg-accent/40";

export function PlatformPicker({
  value,
  device,
  onChange,
  t,
  labelId,
}: {
  value: Platform;
  device: Device;
  onChange: (p: Platform) => void;
  t: StudioLabels;
  labelId: string;
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = PLATFORMS.findIndex((p) => p.id === value);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let next = idx;
    if (e.key === "ArrowRight") next = idx + (rtl ? -1 : 1);
    else if (e.key === "ArrowLeft") next = idx + (rtl ? 1 : -1);
    else if (e.key === "ArrowDown") next = idx + 3;
    else if (e.key === "ArrowUp") next = idx - 3;
    else return;
    e.preventDefault();
    next = Math.min(Math.max(next, 0), PLATFORMS.length - 1);
    onChange(PLATFORMS[next].id);
    (e.currentTarget.querySelectorAll("button")[next] as HTMLButtonElement | undefined)?.focus();
  };

  return (
    <div>
      <div role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown} className="grid grid-cols-3 gap-2">
        {PLATFORMS.map((p) => {
          const active = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(p.id)}
              className={cn(tileBase, "gap-1.5 px-1 pt-3 pb-2.5", active ? tileOn : tileOff)}
            >
              <CheckBadge show={active} />
              <PlatformMark platform={p.id} device={device} size={34} />
              <span
                className={cn(
                  "line-clamp-2 text-[11.5px] leading-tight font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {platformName(p.id, device, t)}
              </span>
            </button>
          );
        })}
      </div>
      {value === "imessage" && device === "android" && (
        <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-muted/70 px-2.5 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {t.samsungMessagesNote}
        </p>
      )}
    </div>
  );
}

export function DevicePicker({
  value,
  onChange,
  t,
  labelId,
}: {
  value: Device;
  onChange: (d: Device) => void;
  t: StudioLabels;
  labelId: string;
}) {
  const options: { id: Device; name: string; model: string }[] = [
    { id: "iphone", name: t.iphone, model: t.iphoneModel },
    { id: "android", name: t.android, model: t.androidModel },
  ];
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className="grid grid-cols-2 gap-2"
      onKeyDown={(e) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault();
        const next = value === "iphone" ? "android" : "iphone";
        onChange(next);
        (e.currentTarget.querySelectorAll("button")[next === "iphone" ? 0 : 1] as HTMLButtonElement | undefined)?.focus();
      }}
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={cn(tileBase, "gap-2 px-2 pt-3.5 pb-2.5", active ? tileOn : tileOff)}
          >
            <CheckBadge show={active} />
            <DeviceGlyph
              device={o.id}
              className={cn("h-12 transition-colors", active ? "text-primary" : "text-muted-foreground")}
            />
            <span className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold text-foreground">{o.name}</span>
              <span className="mt-0.5 text-[11px] text-muted-foreground" dir="ltr">
                {o.model}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
