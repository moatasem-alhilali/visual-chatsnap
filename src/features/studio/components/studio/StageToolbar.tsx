"use client";

import { useEffect } from "react";
import { Check, ChevronDown, Moon, PauseCircle, Sparkles, Sun } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useLiveZoom } from "../../export/zoomPrefs";
import { usePreviewMotion } from "../../hooks/usePreviewMotion";
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
  const animOn = usePreviewMotion((s) => s.animations);
  const setAnimations = usePreviewMotion((s) => s.setAnimations);
  const hydrateMotion = usePreviewMotion((s) => s.hydrate);
  useEffect(() => hydrateMotion(), [hydrateMotion]);
  const setComposeTyping = useStudioStore((s) => s.setComposeTyping);
  const setKeyboard = useStudioStore((s) => s.setKeyboard);
  const composeOn = scenario.composeTyping !== false;
  const keyboardOn = composeOn && scenario.keyboard !== false;
  const motionCount = Number(animOn) + Number(zoomOn) + Number(composeOn) + Number(keyboardOn);

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

      <DropdownMenu dir={dir}>
        <Tooltip content={t.motionHint}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`${t.motion}: ${motionCount}/4`}
              className={cn(
                "h-7 gap-1.5 px-2",
                motionCount > 0 ? "bg-primary/12 text-primary hover:bg-primary/18" : "text-muted-foreground",
              )}
            >
              {motionCount > 0 ? <Sparkles className="size-4" /> : <PauseCircle className="size-4" />}
              <span className="hidden text-[13px] lg:inline">{motionCount > 0 ? t.motion : t.motionOff}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.motionHint}</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={animOn} onCheckedChange={setAnimations} onSelect={(e) => e.preventDefault()}>
            {t.motionAnimations}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={zoomOn} onCheckedChange={setZoom} onSelect={(e) => e.preventDefault()}>
            {t.autoZoom}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={composeOn} onCheckedChange={setComposeTyping} onSelect={(e) => e.preventDefault()}>
            {t.motionCompose}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={keyboardOn}
            disabled={!composeOn}
            onCheckedChange={setKeyboard}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="flex min-w-0 flex-col">
              <span>{t.keyboard}</span>
              {!composeOn && <span className="text-[11px] text-muted-foreground">{t.keyboardNeedsCompose}</span>}
            </span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              const next = motionCount === 0;
              setAnimations(next);
              setZoom(next);
              setComposeTyping(next);
              setKeyboard(next);
            }}
          >
            {motionCount === 0 ? <Sparkles className="size-4" /> : <PauseCircle className="size-4" />}
            {motionCount === 0 ? t.motionAllOn : t.motionAllOff}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
