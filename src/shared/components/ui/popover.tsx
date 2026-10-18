"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/shared/lib/utils"

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Side = "top" | "bottom"
type Align = "start" | "center" | "end"

/**
 * Small anchored popover (non-modal dialog): portalled + fixed so scrolling
 * panels never clip it, flips above/below to stay on screen, closes on
 * Escape, outside press or when focus leaves, and returns focus to the
 * trigger. `align` is logical (start = inline-start, mirrored in RTL).
 */
function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  label,
  side = "bottom",
  align = "center",
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** the element that toggles the popover (rendered in place) */
  trigger: React.ReactNode
  children: React.ReactNode
  /** accessible name of the popover */
  label: string
  side?: Side
  align?: Align
  className?: string
}) {
  const anchorRef = React.useRef<HTMLSpanElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null)

  const place = React.useCallback(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return
    const r = anchor.getBoundingClientRect()
    const w = panel.offsetWidth
    const h = panel.offsetHeight
    const rtl = getComputedStyle(anchor).direction === "rtl"
    const margin = 8
    let s = side
    if (s === "bottom" && r.bottom + 6 + h > window.innerHeight - margin && r.top - 6 - h > margin) s = "top"
    if (s === "top" && r.top - 6 - h < margin) s = "bottom"
    const top = s === "bottom" ? r.bottom + 6 : r.top - 6 - h
    const physical = align === "center" ? "center" : (align === "start") !== rtl ? "left" : "right"
    let left = physical === "center" ? r.left + r.width / 2 - w / 2 : physical === "left" ? r.left : r.right - w
    left = Math.min(Math.max(left, margin), window.innerWidth - w - margin)
    setPos({ top: Math.max(margin, top), left })
  }, [side, align])

  React.useLayoutEffect(() => {
    if (!open) return
    place()
    const onMove = () => place()
    window.addEventListener("resize", onMove)
    window.addEventListener("scroll", onMove, true)
    return () => {
      window.removeEventListener("resize", onMove)
      window.removeEventListener("scroll", onMove, true)
      setPos(null)
    }
  }, [open, place])

  React.useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const anchor = anchorRef.current
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus({ preventScroll: true })

    const close = (refocus: boolean) => {
      onOpenChange(false)
      if (refocus) anchor?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        e.preventDefault()
        close(true)
      }
    }
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (panel?.contains(target) || anchor?.contains(target)) return
      close(false)
    }
    const onFocus = (e: FocusEvent) => {
      const target = e.target as Node
      if (panel?.contains(target) || anchor?.contains(target)) return
      close(false)
    }
    document.addEventListener("keydown", onKey, true)
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("focusin", onFocus)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      document.removeEventListener("pointerdown", onDown, true)
      document.removeEventListener("focusin", onFocus)
    }
  }, [open, onOpenChange])

  return (
    <>
      <span ref={anchorRef} className="inline-flex">
        {trigger}
      </span>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            data-popover=""
            className={cn(
              "fixed z-[280] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-studio-pop outline-none",
              pos ? "animate-in fade-in-0 zoom-in-95 duration-150" : "invisible",
              className,
            )}
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0 }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}

export { Popover }
