"use client"

import * as React from "react"
import { CircleAlert, CircleCheck, Info, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export type ToastVariant = "default" | "success" | "destructive"

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  action?: { label: string; onClick: () => void }
  /** ms before auto-dismiss (default 2600, 5000 when there is an action) */
  duration?: number
}

type ToastItem = ToastInput & { id: number }

let items: ToastItem[] = []
let seq = 0
const listeners = new Set<() => void>()
const timers = new Map<number, number>()

function emit() {
  listeners.forEach((l) => l())
}

function dismissToast(id: number) {
  const t = timers.get(id)
  if (t) window.clearTimeout(t)
  timers.delete(id)
  items = items.filter((i) => i.id !== id)
  emit()
}

/** Imperative toast API usable from anywhere on the client. */
function toast(input: ToastInput): number {
  const id = ++seq
  items = [...items.slice(-2), { ...input, id }]
  emit()
  const ms = input.duration ?? (input.action ? 5000 : 2600)
  timers.set(id, window.setTimeout(() => dismissToast(id), ms))
  return id
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

const EMPTY: ToastItem[] = []

function Toaster({ closeLabel, className }: { closeLabel: string; className?: string }) {
  const list = React.useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  )

  return (
    <div
      role="region"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[260] flex flex-col items-center gap-2 px-4",
        className,
      )}
    >
      {list.map((t) => {
        const Icon = t.variant === "destructive" ? CircleAlert : t.variant === "success" ? CircleCheck : Info
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-popover py-2.5 ps-3 pe-2 text-popover-foreground shadow-studio-pop animate-in fade-in-0 slide-in-from-bottom-3 zoom-in-95 duration-200"
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                t.variant === "destructive"
                  ? "text-destructive"
                  : t.variant === "success"
                    ? "text-primary"
                    : "text-muted-foreground",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{t.title}</p>
              {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
                  dismissToast(t.id)
                }}
                className="cursor-pointer rounded-md px-2 py-1 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label={closeLabel}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export { Toaster, toast, dismissToast }
