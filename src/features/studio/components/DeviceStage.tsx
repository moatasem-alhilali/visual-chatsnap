"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { CameraRig } from "../export/CameraRig";
import { useLiveZoom } from "../export/zoomPrefs";
import type { PlaybackView } from "../playback/usePlayback";
import type { Scenario } from "../types";
import { DEVICE_SPEC, DeviceFrame, deviceOuter } from "./devices/DeviceFrame";
import { FitDevice } from "./devices/FitDevice";
import { PlatformView } from "./platforms";
import { deviceFontFamily } from "../data/fonts";

/**
 * Renders the live conversation inside the selected phone shell, scaled to fit.
 * While playing, the same auto-zoom camera as the exported video follows each
 * new message (toggle in the stage toolbar / export dialog).
 */
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
  const zoom = useLiveZoom();
  const hydrate = zoom.hydrate;
  useEffect(() => hydrate(), [hydrate]);

  return (
    <FitDevice width={outer.w} height={outer.h} maxScale={1} maxHeight={maxHeight}>
      <CameraRig
        enabled={zoom.hydrated && zoom.enabled}
        active={playback.isLive}
        typing={playback.typing}
        intensity={zoom.intensity}
        followSides={zoom.followSides}
        // rounded like the phone body, so the zoomed crop keeps the phone silhouette
        style={{ width: outer.w, height: outer.h, borderRadius: DEVICE_SPEC[scenario.device].outerRadius }}
      >
        <DeviceFrame device={scenario.device} dir={rtl ? "rtl" : "ltr"} fontFamily={fontFamily}>
          <PlatformView scenario={scenario} playback={playback} lang={lang} rtl={rtl} />
        </DeviceFrame>
      </CameraRig>
    </FitDevice>
  );
}
