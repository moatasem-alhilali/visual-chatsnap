"use client";

// Placeholder until the Samsung Messages template lands (renders the iOS design meanwhile).
import { IMessage } from "./iMessage";
import type { PlatformProps } from "./types";

export function SamsungMessages(props: PlatformProps) {
  return <IMessage {...props} />;
}
