"use client"

import * as React from "react"

import { cn } from "@/shared/lib/utils"

export type SegmentedOption<T extends string> = {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
  /** accessible name when the label is visual only */
  ariaLabel?: string
  title?: string
  style?: React.CSSProperties
}

/**
 * Segmented control (single choice). Implements the radio-group pattern:
 * one tab stop, arrow keys move + select, mirrored automatically in RTL.
 */
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  ...aria
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  size?: "sm" | "md"
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const idx = options.findIndex((o) => o.value === value)
    let next = idx
    if (e.key === "Home") next = 0
    else if (e.key === "End") next = options.length - 1
    else {
      const forward =
        e.key === "ArrowDown" || (e.key === "ArrowRight" && !rtl) || (e.key === "ArrowLeft" && rtl)
      next = (idx + (forward ? 1 : -1) + options.length) % options.length
    }
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      onKeyDown={onKeyDown}
      className={cn(
        "flex w-full gap-0.5 rounded-lg bg-muted p-0.5 ring-1 ring-inset ring-border/60",
        className,
      )}
      {...aria}
    >
      {options.map((o, i) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            title={o.title}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            style={o.style}
            className={cn(
              "inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ease-studio outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3.5 [&_svg]:shrink-0",
              size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-2.5 text-[13px]",
              active
                ? "bg-card text-foreground shadow-studio-card ring-1 ring-border/70 dark:bg-accent"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.icon}
            {o.label !== "" && <span className="truncate">{o.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
