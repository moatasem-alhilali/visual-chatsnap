"use client";

import { toast, type ToastInput } from "@/shared/components/ui/toast";

/**
 * Studio toast helper. `show(msg)` keeps the old one-liner API; `notify`
 * exposes the full toast options (variant, undo action, …).
 */
export function useToast() {
  const show = (message: string, variant: ToastInput["variant"] = "success") =>
    toast({ title: message, variant });
  return { show, notify: toast };
}
