"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/shared/lib/utils"

type Side = "top" | "bottom"

type TriggerProps = {
  onPointerEnter?: (e: React.PointerEvent<HTMLElement>) => void
  onPointerLeave?: (e: React.PointerEvent<HTMLElement>) => void
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLElement>) => void
  "aria-describedby"?: string
}

/**
 * Lightweight tooltip: portalled + fixed-positioned so it is never clipped by
 * scrolling panels. Mouse/keyboard only (no tooltips on touch), flips to the
 * bottom near the top edge and clamps inside the viewport.
 */
function Tooltip({
  content,
  shortcut,
  side = "top",
  delay = 380,
  children,
}: {
  content: React.ReactNode
  shortcut?: string
  side?: Side
  delay?: number
  children: React.ReactElement<TriggerProps>
}) {
  const id = React.useId()
  const [pos, setPos] = React.useState<{ x: number; y: number; side: Side } | null>(null)
  const timer = React.useRef<number | null>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }

  const open = (el: HTMLElement, wait: number) => {
    clear()
    timer.current = window.setTimeout(() => {
      const r = el.getBoundingClientRect()
      let s = side
      if (s === "top" && r.top < 48) s = "bottom"
      if (s === "bottom" && window.innerHeight - r.bottom < 48) s = "top"
      setPos({ x: r.left + r.width / 2, y: s === "top" ? r.top - 8 : r.bottom + 8, side: s })
    }, wait)
  }

  const close = React.useCallback(() => {
    clear()
    setPos(null)
  }, [])

  React.useEffect(() => {
    if (!pos) return
    const onScroll = () => close()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
    }
  }, [pos, close])

  React.useEffect(() => clear, [])

  // Clamp horizontally once the tooltip has a measurable width.
  React.useLayoutEffect(() => {
    const el = tipRef.current
    if (!el || !pos) return
    const w = el.offsetWidth
    const min = 8 + w / 2
    const max = window.innerWidth - 8 - w / 2
    const x = Math.min(Math.max(pos.x, min), max)
    el.style.left = `${x}px`
  }, [pos])

  const child = React.Children.only(children)
  const p = child.props

  const trigger = React.cloneElement(child, {
    "aria-describedby": pos ? id : p["aria-describedby"],
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      p.onPointerEnter?.(e)
      if (e.pointerType === "mouse") open(e.currentTarget, delay)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      p.onPointerLeave?.(e)
      close()
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      p.onPointerDown?.(e)
      close()
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      p.onFocus?.(e)
      if (e.currentTarget.matches(":focus-visible")) open(e.currentTarget, 120)
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      p.onBlur?.(e)
      close()
    },
  })

  return (
    <>
      {trigger}
      {pos &&
        createPortal(
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-[300] flex max-w-64 items-center gap-2 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-studio-pop",
              "animate-in fade-in-0 zoom-in-95 duration-150",
            )}
            style={{
              left: pos.x,
              top: pos.y,
              transform: pos.side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }}
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="rounded bg-background/15 px-1 font-sans text-[10px] font-semibold tracking-wide text-background/80">
                {shortcut}
              </kbd>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

export { Tooltip }
