"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scales a fixed-size device down to fit the available width (and an optional
 * max height), so the phone mockup looks right on both mobile and desktop
 * without ever overflowing. The reserved box matches the scaled size so there
 * is no extra whitespace.
 */
export function FitDevice({
  width,
  height,
  maxScale = 1,
  maxHeight,
  children,
}: {
  width: number;
  height: number;
  maxScale?: number;
  maxHeight?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(maxScale);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const avail = el.clientWidth;
      let s = Math.min(maxScale, avail / width);
      if (maxHeight) s = Math.min(s, maxHeight / height);
      if (s > 0 && Number.isFinite(s)) setScale(s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, maxScale, maxHeight]);

  return (
    <div ref={ref} className="flex w-full justify-center" style={{ height: height * scale }}>
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
