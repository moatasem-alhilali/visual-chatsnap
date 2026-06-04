"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocale } from "next-intl";
import { snapdom } from "@zumer/snapdom";
import { Download, Film, Loader2, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { deviceOuter, DeviceFrame } from "./devices/DeviceFrame";
import { PLATFORM_MAP } from "./platforms";
import { buildTimeline, type FrameState } from "../export/schedule";
import { canExportVideo, exportToMp4 } from "../export/exportVideo";
import type { PlaybackView } from "../playback/usePlayback";
import type { Scenario } from "../types";
import type { StudioLabels } from "./labels";

const PADDING = 40;
const BACKGROUNDS: { id: string; label: string; css: string }[] = [
  { id: "studio", label: "استوديو", css: "linear-gradient(160deg,#1b2735,#0b1118)" },
  { id: "white", label: "أبيض", css: "#ffffff" },
  { id: "black", label: "أسود", css: "#000000" },
  { id: "green", label: "أخضر", css: "linear-gradient(160deg,#0f766e,#042f2a)" },
];

function even(n: number) {
  const r = Math.round(n);
  return r % 2 === 0 ? r : r + 1;
}

function emptyState(): FrameState {
  return { visibleIds: new Set(), typing: false, statuses: new Map() };
}

function makeView(scenario: Scenario, st: FrameState): PlaybackView {
  const messages = scenario.messages.filter((m) => st.visibleIds.has(m.id));
  return {
    phase: "playing",
    isLive: false,
    messages,
    typing: st.typing,
    statusOf: (m) => st.statuses.get(m.id) ?? m.status,
    play: () => {},
    pause: () => {},
    resume: () => {},
    restart: () => {},
    reset: () => {},
  };
}

// A short yield that keeps firing even when the tab is backgrounded (rAF can
// pause entirely off-screen, which would stall the export).
const settle = () => new Promise<void>((r) => setTimeout(r, 12));

export function ExportDialog({
  scenario,
  t,
  onClose,
}: {
  scenario: Scenario;
  t: StudioLabels;
  onClose: () => void;
}) {
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const rtl = lang === "ar";
  const supported = canExportVideo();

  const [frame, setFrame] = useState<FrameState>(emptyState);
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [fps, setFps] = useState(30);
  const [phase, setPhase] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const offscreenRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { Component } = PLATFORM_MAP[scenario.platform];
  const outer = deviceOuter(scenario.device);
  const wrapperW = outer.w + PADDING * 2;
  const wrapperH = outer.h + PADDING * 2;

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const runExport = async () => {
    const node = offscreenRef.current;
    if (!node) return;
    setPhase("rendering");
    setProgress(0);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const timeline = buildTimeline(scenario);
    const pixelRatio = 2;
    const W = even(wrapperW * pixelRatio);
    const H = even(wrapperH * pixelRatio);

    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const ctx = out.getContext("2d");
    if (!ctx) {
      setErrMsg("canvas");
      setPhase("error");
      return;
    }

    try {
      // make sure web fonts are ready, settle the first frame
      if (document.fonts?.ready) await document.fonts.ready;
      flushSync(() => setFrame(timeline.stateAt(0)));
      await settle();
      // warm-up capture so snapdom embeds fonts/styles into its cache
      await snapdom.toCanvas(node, { scale: 1, embedFonts: true });

      const drawFrame = async (timeMs: number) => {
        flushSync(() => setFrame(timeline.stateAt(timeMs)));
        // keep the latest messages in view in every frame
        node.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => {
          el.scrollTop = el.scrollHeight;
        });
        await settle();
        const snap = await snapdom.toCanvas(node, {
          scale: pixelRatio,
          embedFonts: true,
          backgroundColor: "#000000",
        });
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(snap, 0, 0, W, H);
        return out;
      };

      const blob = await exportToMp4({
        width: W,
        height: H,
        fps,
        durationMs: timeline.durationMs,
        drawFrame,
        onProgress: (done, total) => setProgress(Math.round((done / total) * 100)),
        signal: ctrl.signal,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${scenario.platform}.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setPhase("done");
    } catch (e) {
      if ((e as Error).message === "ABORTED") {
        setPhase("idle");
      } else {
        setErrMsg((e as Error).message || "error");
        setPhase("error");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  const view = makeView(scenario, frame);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Film className="size-5 text-primary" />
          <h2 className="text-base font-bold">{t.exportVideo}</h2>
          <button onClick={onClose} className="ms-auto rounded-md p-1 hover:bg-muted" aria-label={t.exitRecord}>
            <X className="size-5" />
          </button>
        </div>

        {!supported ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t.exportUnsupported}</p>
            <Button variant="outline" className="w-full" onClick={onClose}>
              {t.exitRecord}
            </Button>
          </div>
        ) : phase === "rendering" ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t.exportRendering} {progress}%
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{t.exportHint}</p>
            <Button variant="outline" className="w-full" onClick={cancel}>
              {t.exportCancel}
            </Button>
          </div>
        ) : phase === "done" ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm font-medium text-foreground">{t.exportDone}</p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={runExport}>{t.exportAgain}</Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>{t.exitRecord}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {phase === "error" && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t.exportError} {errMsg}
              </p>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t.exportBackground}</p>
              <div className="grid grid-cols-4 gap-2">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBg(b)}
                    className={`h-10 rounded-lg border-2 ${bg.id === b.id ? "border-primary" : "border-transparent"}`}
                    style={{ background: b.css }}
                    title={b.label}
                    aria-label={b.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t.exportFps}</p>
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                {[24, 30, 60].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFps(f)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                      fps === f ? "bg-background shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t.exportHint}</p>

            <Button className="w-full gap-2" onClick={runExport}>
              <Download className="size-4" />
              {t.exportStart}
            </Button>
          </div>
        )}
      </div>

      {/* Off-screen WRAPPER (carries the off-screen positioning) … */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -100000,
          top: 0,
          pointerEvents: "none",
          // never display:none / visibility:hidden — that blanks the capture
        }}
      >
        {/* … and the CAPTURE NODE which stays in normal/static flow at the SVG
            origin, so html-to-image rasterises it instead of an empty frame. */}
        <div
          ref={offscreenRef}
          style={{
            position: "static",
            width: wrapperW,
            height: wrapperH,
            padding: PADDING,
            background: bg.css,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <DeviceFrame device={scenario.device} dir={rtl ? "rtl" : "ltr"}>
            <Component scenario={scenario} playback={view} lang={lang} rtl={rtl} />
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}
