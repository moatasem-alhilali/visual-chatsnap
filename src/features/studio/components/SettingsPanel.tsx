"use client";

import { useId, useState } from "react";
import {
  ArrowUpDown,
  BatteryFull,
  BatteryLow,
  Clock,
  LayoutGrid,
  Moon,
  Palette,
  PanelTop,
  PenLine,
  Play,
  RotateCcw,
  Signal,
  Smartphone,
  Sun,
  TextCursorInput,
  Users,
  Wifi,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Slider } from "@/shared/components/ui/slider";
import { Switch } from "@/shared/components/ui/switch";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useStudioStore } from "../store";
import type { Device, PresenceStatus, Scenario } from "../types";
import { DEFAULT_STATUS_BAR } from "../types";
import { ANDROID_FONTS } from "../data/fonts";
import { nowClock } from "../data/defaults";
import { DEFAULT_DEVICE_FINISH, DEVICE_FINISHES } from "./devices/DeviceFrame";
import { STATUS_BAR_DEFAULTS } from "./devices/SamsungStatusBar";
import type { StudioLabels } from "./labels";
import { FieldLabel, PanelSection } from "./studio/PanelSection";
import { DevicePicker, PlatformPicker, platformName } from "./studio/Pickers";
import { ParticipantCard } from "./studio/ParticipantCard";

/** What each status bar shows when the user has not set a value (mirrors devices/*StatusBar). */
const DEVICE_DEFAULT_TIME: Record<Device, string> = {
  iphone: STATUS_BAR_DEFAULTS.iphone.time,
  android: STATUS_BAR_DEFAULTS.android.time,
};
const DEVICE_DEFAULT_BATTERY: Record<Device, number> = {
  iphone: STATUS_BAR_DEFAULTS.iphone.battery,
  android: STATUS_BAR_DEFAULTS.android.battery,
};
const TIME_RE = /^([01]?\d|2[0-3])[:.][0-5]\d$/;

/** Phone colour swatches (real retail finishes of the selected device). */
function FinishPicker({
  device,
  value,
  onChange,
  lang,
  labelId,
}: {
  device: Device;
  value: string | undefined;
  onChange: (id: string) => void;
  lang: "ar" | "en";
  labelId: string;
}) {
  const list = DEVICE_FINISHES[device];
  const current = list.find((f) => f.id === value)?.id ?? DEFAULT_DEVICE_FINISH[device];
  const currentLabel = list.find((f) => f.id === current)?.label[lang] ?? "";

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const idx = list.findIndex((f) => f.id === current);
    let next = idx;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else {
      const forward = e.key === "ArrowDown" || (e.key === "ArrowRight") !== rtl;
      next = (idx + (forward ? 1 : -1) + list.length) % list.length;
    }
    onChange(list[next].id);
    (e.currentTarget.querySelectorAll("button")[next] as HTMLButtonElement | undefined)?.focus();
  };

  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown} className="flex items-center gap-2">
        {list.map((f) => {
          const active = f.id === current;
          return (
            <Tooltip key={f.id} content={f.label[lang]}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={f.label[lang]}
                tabIndex={active ? 0 : -1}
                onClick={() => onChange(f.id)}
                className={cn(
                  "relative flex size-8 cursor-pointer items-center justify-center rounded-full transition-[box-shadow,transform] duration-150 ease-studio outline-none active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-border hover:ring-foreground/30",
                )}
              >
                {/* swatch colour comes from the device data, so it cannot be a utility class */}
                <span
                  aria-hidden
                  className="size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18),inset_0_1px_1px_rgb(255_255_255/0.35)]"
                  style={{ background: f.swatch }}
                />
              </button>
            </Tooltip>
          );
        })}
      </div>
      <span className="min-w-0 truncate text-xs text-muted-foreground" aria-live="polite">
        {currentLabel}
      </span>
    </div>
  );
}

/** Left zone: everything about the scenario's look (platform, device, people…). */
export function SettingsPanel({ scenario, t, lang }: { scenario: Scenario; t: StudioLabels; lang: "ar" | "en" }) {
  const setPlatform = useStudioStore((s) => s.setPlatform);
  const setDevice = useStudioStore((s) => s.setDevice);
  const setTheme = useStudioStore((s) => s.setTheme);
  const setPresence = useStudioStore((s) => s.setPresence);
  const setLastSeenText = useStudioStore((s) => s.setLastSeenText);
  const setAndroidFont = useStudioStore((s) => s.setAndroidFont);
  const setComposeTyping = useStudioStore((s) => s.setComposeTyping);
  const setDeviceColor = useStudioStore((s) => s.setDeviceColor);
  const updateStatusBar = useStudioStore((s) => s.updateStatusBar);
  const swapRoles = useStudioStore((s) => s.swapRoles);

  const ids = {
    platform: useId(),
    device: useId(),
    finish: useId(),
    font: useId(),
    theme: useId(),
    presence: useId(),
    lastSeen: useId(),
    time: useId(),
    timeError: useId(),
    battery: useId(),
    compose: useId(),
    composeHint: useId(),
  };
  const sb = scenario.statusBar ?? DEFAULT_STATUS_BAR;
  const presenceLabel = { online: t.online, typing: t.typing, lastseen: t.lastSeen }[scenario.presence];
  const composeOn = scenario.composeTyping !== false;
  const [timeDraft, setTimeDraft] = useState<string | null>(null);
  const timeValue = timeDraft ?? sb.time ?? "";
  // while typing, only flag what can no longer become a valid time
  const timeTrim = timeValue.trim();
  const timeInvalid =
    timeTrim !== "" && !TIME_RE.test(timeTrim) && (!/^\d{0,2}([:.]\d{0,2})?$/.test(timeTrim) || timeTrim.length >= 5);
  const battery = sb.battery ?? DEVICE_DEFAULT_BATTERY[scenario.device];
  const finishLabel =
    DEVICE_FINISHES[scenario.device].find((f) => f.id === scenario.deviceColor)?.label[lang] ??
    DEVICE_FINISHES[scenario.device].find((f) => f.id === DEFAULT_DEVICE_FINISH[scenario.device])?.label[lang];

  const sbRows: { key: "wifi" | "cellular" | "batteryPct"; label: string; icon: React.ReactNode }[] = [
    { key: "wifi", label: t.sbWifi, icon: <Wifi /> },
    { key: "cellular", label: t.sbCellular, icon: <Signal /> },
    { key: "batteryPct", label: t.sbBatteryPct, icon: <BatteryFull /> },
  ];

  const commitTime = (raw: string) => {
    const v = raw.trim().replace(".", ":");
    setTimeDraft(null);
    if (!v) updateStatusBar({ time: undefined });
    else if (TIME_RE.test(v)) updateStatusBar({ time: v });
  };

  return (
    <div>
      <PanelSection
        icon={<LayoutGrid />}
        title={t.platform}
        summary={platformName(scenario.platform, scenario.device, t)}
      >
        <p id={ids.platform} className="sr-only">
          {t.platform}
        </p>
        <PlatformPicker
          value={scenario.platform}
          device={scenario.device}
          onChange={setPlatform}
          t={t}
          labelId={ids.platform}
        />
      </PanelSection>

      <PanelSection
        icon={<Smartphone />}
        title={t.device}
        summary={`${scenario.device === "iphone" ? t.iphone : t.android}${finishLabel ? ` · ${finishLabel}` : ""}`}
      >
        <p id={ids.device} className="sr-only">
          {t.device}
        </p>
        <DevicePicker value={scenario.device} onChange={setDevice} t={t} labelId={ids.device} />
        <div className="mt-3.5">
          <FieldLabel id={ids.finish}>{t.deviceColor}</FieldLabel>
          <FinishPicker
            device={scenario.device}
            value={scenario.deviceColor}
            onChange={setDeviceColor}
            lang={lang}
            labelId={ids.finish}
          />
        </div>
        {scenario.device === "android" && (
          <div className="mt-3.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <FieldLabel id={ids.font}>{t.font}</FieldLabel>
            <SegmentedControl
              aria-labelledby={ids.font}
              value={scenario.androidFont}
              onChange={setAndroidFont}
              size="sm"
              options={ANDROID_FONTS.map((f) => ({
                value: f.id,
                label: f.label,
                style: { fontFamily: f.family },
              }))}
            />
          </div>
        )}
      </PanelSection>

      <PanelSection
        icon={<Palette />}
        title={t.appearance}
        summary={scenario.theme === "light" ? t.light : t.dark}
      >
        <FieldLabel id={ids.theme}>{t.chatTheme}</FieldLabel>
        <SegmentedControl
          aria-labelledby={ids.theme}
          value={scenario.theme}
          onChange={setTheme}
          options={[
            { value: "light", label: t.light, icon: <Sun /> },
            { value: "dark", label: t.dark, icon: <Moon /> },
          ]}
        />
      </PanelSection>

      <PanelSection
        icon={<Users />}
        title={t.people}
        summary={`${scenario.me.name || t.meShort} · ${scenario.them.name || t.themShort}`}
      >
        <div className="relative space-y-2">
          <ParticipantCard who="me" person={scenario.me} t={t} />
          <ParticipantCard who="them" person={scenario.them} t={t} />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-end pe-5">
            <Tooltip content={t.swapRoles}>
              <button
                type="button"
                onClick={swapRoles}
                aria-label={t.swapRoles}
                className="pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-studio-float transition-[color,transform] duration-200 ease-studio hover:rotate-180 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <ArrowUpDown className="size-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </PanelSection>

      <PanelSection icon={<PenLine />} title={t.presence} summary={presenceLabel}>
        <p id={ids.presence} className="sr-only">
          {t.presence}
        </p>
        <SegmentedControl<PresenceStatus>
          aria-labelledby={ids.presence}
          value={scenario.presence}
          onChange={setPresence}
          size="sm"
          options={[
            {
              value: "online",
              label: t.online,
              icon: <span className="size-1.5 rounded-full bg-emerald-500" />,
            },
            { value: "typing", label: t.typing },
            { value: "lastseen", label: t.lastSeen, icon: <Clock /> },
          ]}
        />
        {scenario.presence === "lastseen" && (
          <div className="mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <FieldLabel htmlFor={ids.lastSeen}>{t.lastSeenText}</FieldLabel>
            <Input
              id={ids.lastSeen}
              value={scenario.lastSeenText}
              onChange={(e) => setLastSeenText(e.target.value)}
              placeholder={t.lastSeenText}
              dir="auto"
            />
          </div>
        )}
      </PanelSection>

      <PanelSection icon={<Play />} title={t.playbackSection} summary={composeOn ? t.composeOnShort : t.composeOffShort}>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
          <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">
            <TextCursorInput />
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor={ids.compose} className="block cursor-pointer text-[13px] font-medium">
              {t.composeTyping}
            </label>
            <p id={ids.composeHint} className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
              {t.composeTypingHint}
            </p>
          </div>
          <Switch
            id={ids.compose}
            checked={composeOn}
            aria-describedby={ids.composeHint}
            onCheckedChange={setComposeTyping}
            className="mt-0.5"
          />
        </div>
      </PanelSection>

      <PanelSection icon={<PanelTop />} title={t.statusBarTitle} defaultOpen={false}>
        <p className="mb-2 text-xs text-muted-foreground">{t.statusBarHint}</p>
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <div>
            <FieldLabel htmlFor={ids.time}>{t.sbTime}</FieldLabel>
            <Input
              id={ids.time}
              value={timeValue}
              inputMode="numeric"
              dir="ltr"
              maxLength={5}
              placeholder={DEVICE_DEFAULT_TIME[scenario.device]}
              aria-invalid={timeInvalid || undefined}
              aria-describedby={timeInvalid ? ids.timeError : undefined}
              onChange={(e) => {
                const v = e.target.value;
                setTimeDraft(v);
                if (TIME_RE.test(v.trim()) || v.trim() === "") commitTime(v);
              }}
              onBlur={(e) => commitTime(e.target.value)}
              className="text-center tabular-nums"
            />
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => commitTime(nowClock())}>
              {t.sbTimeNow}
            </Button>
            <Tooltip content={t.sbDefault}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${t.sbDefault}: ${t.sbTime}`}
                disabled={!sb.time && timeDraft === null}
                onClick={() => commitTime("")}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </Tooltip>
          </div>
          {timeInvalid && (
            <p id={ids.timeError} role="alert" className="col-span-2 -mt-1 text-[11px] text-destructive">
              {t.sbTimeInvalid}
            </p>
          )}
        </div>

        <div className="mb-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label htmlFor={ids.battery} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {battery <= 20 ? <BatteryLow className="size-3.5 text-destructive" /> : <BatteryFull className="size-3.5" />}
              {t.sbBattery}
            </label>
            <span className="flex items-center gap-1.5">
              {sb.battery === undefined ? (
                <span className="text-[11px] text-muted-foreground">{t.sbDefault}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => updateStatusBar({ battery: undefined })}
                  className="cursor-pointer rounded text-[11px] font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {t.sbDefault}
                </button>
              )}
              <span className="w-9 text-end text-xs font-semibold tabular-nums" dir="ltr">
                {battery}%
              </span>
            </span>
          </div>
          <Slider
            id={ids.battery}
            min={1}
            max={100}
            step={1}
            value={battery}
            onValueChange={(v) => updateStatusBar({ battery: v })}
            aria-valuetext={`${battery}%`}
          />
        </div>

        <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-card">
          {sbRows.map((row) => {
            const id = `sb-${row.key}`;
            return (
              <li key={row.key} className="flex items-center gap-2.5 px-3 py-2.5">
                <span className="text-muted-foreground [&_svg]:size-4">{row.icon}</span>
                <label htmlFor={id} className="flex-1 cursor-pointer text-[13px] font-medium">
                  {row.label}
                </label>
                <Switch
                  id={id}
                  checked={sb[row.key]}
                  onCheckedChange={(v) => updateStatusBar({ [row.key]: v })}
                />
              </li>
            );
          })}
        </ul>
      </PanelSection>
    </div>
  );
}
