"use client"

import * as React from "react"

import { cn } from "@/shared/lib/utils"

/** Styled native range input (keeps native keyboard + a11y behaviour). */
function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "min" | "max" | "step"> & {
  value: number
  min?: number
  max?: number
  step?: number
  onValueChange: (value: number) => void
}) {
  const pct = max > min ? ((Math.min(Math.max(value, min), max) - min) / (max - min)) * 100 : 0
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onValueChange(Number(e.target.value))}
      className={cn("studio-range", className)}
      style={{ "--fill": `${pct}%` } as React.CSSProperties}
      {...props}
    />
  )
}

export { Slider }
