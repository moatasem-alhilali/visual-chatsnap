"use client";

/**
 * Real-time version of the export's auto-zoom camera, for the live stage /
 * recording mode. Wrap the phone with it:
 *
 *   <CameraRig enabled={zoomOn} active={playback.isLive} typing={playback.typing} intensity="medium">
 *     <DeviceFrame …><PlatformView … /></DeviceFrame>
 *   </CameraRig>
 *
 * It watches for newly inserted message rows (`[data-mid]`) and typing
 * indicators inside `.rcss-scroll`, frames them with the same `focusState`
 * rules as the exporter, and moves with the same critically-damped spring
 * (`springStep`), so the live preview and the exported video feel identical.
 * Everything is applied as one CSS transform on an inner wrapper; the outer
 * box clips, so layout around the rig never changes.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import {
  contentRect,
  focusState,
  springStep,
  ZOOM_LEVELS,
  type CameraOptions,
  type CameraScene,
  type CameraState,
  type Rect,
  type SpringCamera,
  type ZoomIntensity,
} from "./camera";

export interface CameraRigProps {
  /** master switch (off = children render untouched) */
  enabled: boolean;
  /** only follow messages while playing; when false the camera rests wide */
  active?: boolean;
  /** pass playback.typing so the indicator gets framed */
  typing?: boolean;
  intensity?: ZoomIntensity;
  followSides?: boolean;
  /** glide back out after this long without a new message (0 = never) */
  idleZoomOutMs?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function CameraRig({
  enabled,
  active = true,
  typing = false,
  intensity = "medium",
  followSides = true,
  idleZoomOutMs = 2600,
  className,
  style,
  children,
}: CameraRigProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const live = useRef({ active, typing });

  useEffect(() => {
    live.current = { active, typing };
  }, [active, typing]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (!enabled || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      inner.style.transform = "";
      return;
    }

    const opts: CameraOptions = { maxZoom: ZOOM_LEVELS[intensity], followSides, zoomOutAtEnd: true };
    let spring: SpringCamera | null = null;
    let focusEl: Element | null = null;
    let focusAt = 0;
    let raf = 0;
    let last = performance.now();

    const scene = (): CameraScene => {
      const W = outer.clientWidth;
      const H = outer.clientHeight;
      return { W, H, phone: { x: 0, y: 0, w: W, h: H } };
    };

    // un-transformed (local) rect of an element inside the rig
    const localRect = (el: Element, s: number, tx: number, ty: number): Rect | null => {
      const r = el instanceof HTMLElement && el.dataset.mid !== undefined ? contentRect(el) : el.getBoundingClientRect();
      if (!r || r.width < 1 || r.height < 1) return null;
      const o = outer.getBoundingClientRect();
      return { x: (r.left - o.left - tx) / s, y: (r.top - o.top - ty) / s, w: r.width / s, h: r.height / s };
    };

    const mo = new MutationObserver((records) => {
      if (!live.current.active) return;
      for (const rec of records) {
        rec.addedNodes.forEach((n) => {
          if (!(n instanceof Element) || !n.closest(".rcss-scroll")) return;
          const row = n.matches("[data-mid]") ? n : n.querySelector("[data-mid]");
          if (row) {
            focusEl = row;
            focusAt = performance.now();
          } else if (live.current.typing) {
            focusEl = n;
            focusAt = performance.now();
          }
        });
      }
    });
    mo.observe(inner, { subtree: true, childList: true });

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const sc = scene();
      if (!spring) spring = { ls: 0, x: sc.W / 2, y: sc.H / 2, vls: 0, vx: 0, vy: 0 };
      const s = Math.exp(spring.ls);
      const tx = sc.W / 2 - s * spring.x;
      const ty = sc.H / 2 - s * spring.y;

      let target: CameraState = { scale: 1, cx: sc.W / 2, cy: sc.H / 2 };
      const idle = idleZoomOutMs > 0 && now - focusAt > idleZoomOutMs && !live.current.typing;
      if (live.current.active && focusEl && focusEl.isConnected && !idle) {
        const r = localRect(focusEl, s, tx, ty);
        if (r) target = focusState(r, sc, opts);
      }
      spring = springStep(spring, target, dt);
      const s2 = Math.exp(spring.ls);
      const tx2 = sc.W / 2 - s2 * spring.x;
      const ty2 = sc.H / 2 - s2 * spring.y;
      inner.style.transform =
        s2 < 1.0005 ? "" : `translate(${tx2.toFixed(2)}px, ${ty2.toFixed(2)}px) scale(${s2.toFixed(4)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      inner.style.transform = "";
    };
  }, [enabled, intensity, followSides, idleZoomOutMs]);

  return (
    <div ref={outerRef} className={className} style={{ position: "relative", overflow: "hidden", ...style }}>
      <div ref={innerRef} style={{ transformOrigin: "0 0", willChange: enabled ? "transform" : undefined }}>
        {children}
      </div>
    </div>
  );
}
