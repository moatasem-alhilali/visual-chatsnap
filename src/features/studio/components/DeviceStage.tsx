"use client";

import { useLocale } from "next-intl";

import type { PlaybackView } from "../playback/usePlayback";
import type { Scenario } from "../types";
import { DeviceFrame, deviceOuter } from "./devices/DeviceFrame";
import { FitDevice } from "./devices/FitDevice";
import { PlatformView } from "./platforms";
import { deviceFontFamily } from "../data/fonts";

/** Renders the live conversation inside the selected phone shell, scaled to fit. */
export function DeviceStage({
  scenario,
  playback,
  maxHeight,
}: {
  scenario: Scenario;
  playback: PlaybackView;
  maxHeight?: number;
}) {
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const rtl = lang === "ar";
  const outer = deviceOuter(scenario.device);
  const fontFamily = deviceFontFamily(scenario.device, scenario.androidFont);

  return (
    <FitDevice width={outer.w} height={outer.h} maxScale={1} maxHeight={maxHeight}>
      <DeviceFrame device={scenario.device} dir={rtl ? "rtl" : "ltr"} fontFamily={fontFamily}>
        <PlatformView scenario={scenario} playback={playback} lang={lang} rtl={rtl} />
      </DeviceFrame>
    </FitDevice>
  );
}
