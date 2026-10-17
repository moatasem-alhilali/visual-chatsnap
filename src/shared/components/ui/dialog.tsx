"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "@/shared/lib/utils"

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal dialog without extra dependencies: portal, overlay, Escape
 * to close, focus moved inside on open (and trapped), focus restored on close.
 */
function Dialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  closeLabel,
  className,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  closeLabel: string
  className?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}) {
  const titleId = React.useId()
  const descId = React.useId()
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onOpenChange(false)
        return
      }
      if (e.key !== "Tab" || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      previous?.focus?.()
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative w-full max-w-md rounded-xl border border-border bg-popover text-popover-foreground shadow-studio-pop",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200",
          className,
        )}
      >
        <div className="flex items-start gap-3 p-5 pb-0">
          {icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={titleId} className="text-[15px] font-semibold leading-6">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-[13px] leading-5 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            className="-me-1.5 -mt-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <X className="size-4" />
          </button>
        </div>
        {children && <div className="px-5 pt-4">{children}</div>}
        {footer ? (
          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border px-5 py-3.5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : (
          <div className="h-5" />
        )}
      </div>
    </div>,
    document.body,
  )
}

export { Dialog }
