"use client";

import { useId } from "react";
import {
  ArrowUpDown,
  BatteryFull,
  Clock,
  LayoutGrid,
  Moon,
  Palette,
  PanelTop,
  PenLine,
  Signal,
  Smartphone,
  Sun,
  Users,
  Wifi,
} from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Switch } from "@/shared/components/ui/switch";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { useStudioStore } from "../store";
import type { PresenceStatus, Scenario, StatusBarConfig } from "../types";
import { DEFAULT_STATUS_BAR } from "../types";
import { ANDROID_FONTS } from "../data/fonts";
import type { StudioLabels } from "./labels";
import { FieldLabel, PanelSection } from "./studio/PanelSection";
import { DevicePicker, PlatformPicker, platformName } from "./studio/Pickers";
import { ParticipantCard } from "./studio/ParticipantCard";

/** Left zone: everything about the scenario's look (platform, device, people…). */
export function SettingsPanel({ scenario, t }: { scenario: Scenario; t: StudioLabels }) {
  const setPlatform = useStudioStore((s) => s.setPlatform);
  const setDevice = useStudioStore((s) => s.setDevice);
  const setTheme = useStudioStore((s) => s.setTheme);
  const setPresence = useStudioStore((s) => s.setPresence);
  const setLastSeenText = useStudioStore((s) => s.setLastSeenText);
  const setAndroidFont = useStudioStore((s) => s.setAndroidFont);
  const updateStatusBar = useStudioStore((s) => s.updateStatusBar);
  const swapRoles = useStudioStore((s) => s.swapRoles);

  const ids = {
    platform: useId(),
    device: useId(),
    font: useId(),
    theme: useId(),
    presence: useId(),
    lastSeen: useId(),
  };
  const sb = scenario.statusBar ?? DEFAULT_STATUS_BAR;
  const presenceLabel = { online: t.online, typing: t.typing, lastseen: t.lastSeen }[scenario.presence];

  const sbRows: { key: keyof StatusBarConfig; label: string; icon: React.ReactNode }[] = [
    { key: "wifi", label: t.sbWifi, icon: <Wifi /> },
    { key: "cellular", label: t.sbCellular, icon: <Signal /> },
    { key: "batteryPct", label: t.sbBatteryPct, icon: <BatteryFull /> },
  ];

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
        summary={scenario.device === "iphone" ? t.iphone : t.android}
      >
        <p id={ids.device} className="sr-only">
          {t.device}
        </p>
        <DevicePicker value={scenario.device} onChange={setDevice} t={t} labelId={ids.device} />
        {scenario.device === "android" && (
          <div className="mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
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

      <PanelSection icon={<PanelTop />} title={t.statusBarTitle} defaultOpen={false}>
        <p className="mb-2 text-xs text-muted-foreground">{t.statusBarHint}</p>
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
