"use client";

import { useRef, useState } from "react";

const DEFAULT_TOAST_MS = 1800;

export function useToast(timeoutMs = DEFAULT_TOAST_MS) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const show = (message: string) => {
    setMsg(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), timeoutMs);
  };

  return { msg, show };
}
