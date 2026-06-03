"use client";

import type { PlaybackView } from "../playback/usePlayback";
import type { Scenario } from "../types";
import { DeviceFrame } from "./devices/DeviceFrame";
import { PLATFORM_MAP } from "./platforms";

/** Renders the live conversation inside the selected phone shell. */
export function DeviceStage({
  scenario,
  playback,
}: {
  scenario: Scenario;
  playback: PlaybackView;
}) {
  const { Component } = PLATFORM_MAP[scenario.platform];
  return (
    <DeviceFrame device={scenario.device}>
      <Component scenario={scenario} playback={playback} />
    </DeviceFrame>
  );
}
