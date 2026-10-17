"use client";

import { Check, ChevronDown, Moon, Sun, ZoomIn } from "lucide-react";

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
import { useLiveZoom } from "../../export/zoomPrefs";
import { useStudioStore } from "../../store";
import type { ChatTheme, Device, Scenario } from "../../types";
import { PLATFORMS } from "../platforms";
import type { StudioLabels } from "../labels";
import { PlatformMark } from "./BrandMarks";
import { platformName } from "./Pickers";

/** Quick toggles floating above the phone: platform, device, chat theme. */
export function StageToolbar({ scenario, t, dir }: { scenario: Scenario; t: StudioLabels; dir: "rtl" | "ltr" }) {
  const setPlatform = useStudioStore((s) => s.setPlatform);
  const setDevice = useStudioStore((s) => s.setDevice);
  const setTheme = useStudioStore((s) => s.setTheme);
  const zoomOn = useLiveZoom((s) => s.hydrated && s.enabled);
  const setZoom = useLiveZoom((s) => s.setEnabled);

  return (
    <div
      role="toolbar"
      aria-label={t.setup}
      className="flex items-center gap-1 rounded-xl border border-border/80 bg-popover/85 p-1 shadow-studio-float backdrop-blur-xl supports-[backdrop-filter]:bg-popover/75"
    >
      <DropdownMenu dir={dir}>
        <Tooltip content={t.quickPlatform}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 ps-1.5 pe-2 text-foreground" aria-label={`${t.quickPlatform}: ${platformName(scenario.platform, scenario.device, t)}`}>
              <PlatformMark platform={scenario.platform} device={scenario.device} size={18} />
              <span className="text-[13px]">{platformName(scenario.platform, scenario.device, t)}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="center" className="w-52">
          {PLATFORMS.map((p) => (
            <DropdownMenuItem key={p.id} onSelect={() => setPlatform(p.id)}>
              <PlatformMark platform={p.id} device={scenario.device} size={20} />
              {platformName(p.id, scenario.device, t)}
              {scenario.platform === p.id && <Check className="ms-auto size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span aria-hidden className="h-5 w-px bg-border" />

      <SegmentedControl<Device>
        aria-label={t.quickDevice}
        size="sm"
        value={scenario.device}
        onChange={setDevice}
        className="w-auto bg-transparent ring-0 [&>button]:flex-none"
        options={[
          { value: "iphone", label: t.iphone },
          { value: "android", label: t.android },
        ]}
      />

      <span aria-hidden className="h-5 w-px bg-border" />

      <SegmentedControl<ChatTheme>
        aria-label={t.quickTheme}
        size="sm"
        value={scenario.theme}
        onChange={setTheme}
        className="w-auto bg-transparent ring-0 [&>button]:flex-none"
        options={[
          { value: "light", label: "", icon: <Sun />, ariaLabel: t.light, title: t.light },
          { value: "dark", label: "", icon: <Moon />, ariaLabel: t.dark, title: t.dark },
        ]}
      />

      <span aria-hidden className="h-5 w-px bg-border" />

      <Tooltip content={t.autoZoomHint}>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={zoomOn}
          aria-label={t.autoZoom}
          onClick={() => setZoom(!zoomOn)}
          className={cn("h-7 gap-1.5 px-2", zoomOn ? "bg-primary/12 text-primary hover:bg-primary/18" : "text-muted-foreground")}
        >
          <ZoomIn className="size-4" />
          <span className="hidden text-[13px] lg:inline">{t.autoZoom}</span>
        </Button>
      </Tooltip>
    </div>
  );
}
