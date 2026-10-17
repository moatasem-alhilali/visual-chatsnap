"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  Check,
  Clock,
  Download,
  Film,
  Loader2,
  Palette,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { DeviceFrame } from "./devices/DeviceFrame";
import { PLATFORM_MAP, PlatformView, resolvePlatformMotion } from "./platforms";
import { deviceFontFamily } from "../data/fonts";
import { buildTimeline, type FrameState } from "../export/schedule";
import { canExportVideo, exportToMp4, ExportAbortedError, pickVideoCodec, type PickedCodec } from "../export/exportVideo";
import { computeLayout, estimateBytes, PRESETS, type PhoneSize, type PresetId } from "../export/layout";
import { BACKGROUNDS, paintBackground, ScreenBackdrop, type BackgroundId, type PaintOptions } from "../export/backgrounds";
import {
  captureStage,
  FrameRenderer,
  measureDevice,
  paintPreview,
  stripOuterShadow,
  type StageController,
} from "../export/renderer";
import { pickAudioCodec, renderSoundTrack, type AudioCodec } from "../export/audio";
import {
  canShareVideoFile,
  createVideoFile,
  downloadVideoFile,
  isTouchDevice,
  saveVideoFile,
} from "../services/video-file";
import type { PlaybackView } from "../playback/usePlayback";
import type { Scenario } from "../types";
import type { StudioLabels } from "./labels";

/* ------------------------------------------------------------------ copy */

type Lang = "ar" | "en";

const COPY: Record<
  Lang,
  {
    subtitle: string;
    preview: string;
    format: string;
    presets: Record<PresetId, { name: string; hint: string }>;
    phoneSize: string;
    sizes: Record<PhoneSize, string>;
    background: string;
    bgs: Record<BackgroundId, string>;
    pickColor: string;
    fps: string;
    quality: string;
    qualities: Record<Quality, string>;
    timing: string;

    intro: string;
    outro: string;
    sec: (n: number) => string;
    sound: string;
    soundHint: string;
    soundUnsupported: string;
    start: string;
    rendering: string;
    frameOf: (a: number, b: number) => string;
    eta: (s: string) => string;
    estimating: string;
    elapsed: (s: string) => string;
    cancel: string;
    done: string;
    savedHint: string;
    download: string;
    share: string;
    again: string;
    close: string;
    codecFallback: (c: string) => string;
    noAudio: string;
    errors: Record<string, string>;
    privacy: string;
    size: string;
    duration: string;
  }
> = {
  en: {
    subtitle: "MP4 for Reels, TikTok, Stories and feeds",
    preview: "Preview",
    format: "Format",
    presets: {
      story: { name: "Story · Reels", hint: "TikTok · Reels · Shorts" },
      portrait: { name: "Feed portrait", hint: "Instagram · Facebook" },
      square: { name: "Square", hint: "Feed · X · LinkedIn" },
      landscape: { name: "Landscape", hint: "YouTube · Web" },
      device: { name: "Phone only", hint: "Just the device" },
    },
    phoneSize: "Phone size",
    sizes: { s: "Small", m: "Medium", l: "Large" },
    background: "Background",
    bgs: {
      studio: "Studio",
      aurora: "Aurora",
      brand: "Brand",
      sunset: "Sunset",
      screen: "Blurred screen",
      mist: "Mist",
      mint: "Mint",
      white: "White",
      black: "Black",
      custom: "Custom colour",
    },
    pickColor: "Pick a colour",
    fps: "Frame rate",
    quality: "Quality",
    qualities: { standard: "Standard", high: "High", max: "Max" },
    timing: "Output",
    intro: "Hold at start",
    outro: "Hold at end",
    sec: (n) => `${n}s`,
    sound: "Message sounds",
    soundHint: "Subtle send and receive sounds",
    soundUnsupported: "This browser can't encode audio",
    start: "Export video",
    rendering: "Rendering video…",
    frameOf: (a, b) => `Frame ${a} of ${b}`,
    eta: (s) => `About ${s} left`,
    estimating: "Estimating time…",
    elapsed: (s) => `Took ${s}`,
    cancel: "Cancel",
    done: "Your video is ready",
    savedHint: "The download started automatically. You can save it again below.",
    download: "Download MP4",
    share: "Share / Save",
    again: "Change settings",
    close: "Close",
    codecFallback: (c) =>
      `This browser has no H.264 encoder, so the video was encoded as ${c}. Some apps may not play it; Chrome or Edge on a computer produce H.264.`,
    noAudio: "This browser can't encode audio, so the video has no sound.",
    errors: {
      VIDEO_UNSUPPORTED: "This browser can't encode video. Use Chrome or Edge, or Recording Mode to capture your screen.",
      CODEC_UNSUPPORTED: "This browser has no video encoder for this size. Try a smaller format or 30 fps.",
      CANVAS_UNAVAILABLE: "Couldn't create a drawing surface. Close other tabs and try again.",
      generic: "Something went wrong while rendering.",
    },
    privacy: "Rendered entirely in your browser. Nothing is uploaded.",
    size: "Size",
    duration: "Length",
  },
  ar: {
    subtitle: "فيديو MP4 جاهز للريلز وتيك توك والستوري والمنشورات",
    preview: "معاينة",
    format: "المقاس",
    presets: {
      story: { name: "ستوري · ريلز", hint: "تيك توك · ريلز · شورتس" },
      portrait: { name: "منشور طولي", hint: "إنستغرام · فيسبوك" },
      square: { name: "مربع", hint: "منشور · X · لينكدإن" },
      landscape: { name: "عرضي", hint: "يوتيوب · الويب" },
      device: { name: "الجهاز فقط", hint: "بدون مساحة حوله" },
    },
    phoneSize: "حجم الجوال",
    sizes: { s: "صغير", m: "متوسط", l: "كبير" },
    background: "الخلفية",
    bgs: {
      studio: "استوديو",
      aurora: "شفق",
      brand: "ألوان المنصة",
      sunset: "غروب",
      screen: "شاشة مموّهة",
      mist: "ضبابي",
      mint: "نعناعي",
      white: "أبيض",
      black: "أسود",
      custom: "لون مخصص",
    },
    pickColor: "اختر لوناً",
    fps: "معدل الإطارات",
    quality: "الجودة",
    qualities: { standard: "عادية", high: "عالية", max: "قصوى" },
    timing: "الإخراج",
    intro: "ثبات في البداية",
    outro: "ثبات في النهاية",
    sec: (n) => `${n.toLocaleString("ar-EG")} ث`,
    sound: "أصوات الرسائل",
    soundHint: "صوت خفيف عند الإرسال والاستلام",
    soundUnsupported: "المتصفح لا يدعم ترميز الصوت",
    start: "تصدير الفيديو",
    rendering: "جارٍ توليد الفيديو…",
    frameOf: (a, b) => `الإطار ${a.toLocaleString("ar-EG")} من ${b.toLocaleString("ar-EG")}`,
    eta: (s) => `متبقٍ حوالي ${s}`,
    estimating: "جارٍ حساب الوقت…",
    elapsed: (s) => `استغرق ${s}`,
    cancel: "إلغاء",
    done: "الفيديو جاهز",
    savedHint: "بدأ التنزيل تلقائياً، ويمكنك حفظه مرة أخرى من هنا.",
    download: "تنزيل MP4",
    share: "مشاركة / حفظ",
    again: "تعديل الإعدادات",
    close: "إغلاق",
    codecFallback: (c) =>
      `متصفحك لا يدعم ترميز H.264، لذلك تم ترميز الفيديو بصيغة ${c}. قد لا تشغّله بعض التطبيقات؛ استخدم Chrome أو Edge على الكمبيوتر للحصول على H.264.`,
    noAudio: "المتصفح لا يدعم ترميز الصوت، لذلك الفيديو بدون صوت.",
    errors: {
      VIDEO_UNSUPPORTED: "متصفحك لا يدعم توليد الفيديو. استخدم Chrome أو Edge، أو وضع التسجيل وسجّل شاشتك.",
      CODEC_UNSUPPORTED: "لا يوجد مرمّز فيديو لهذا المقاس في متصفحك. جرّب مقاساً أصغر أو ٣٠ إطاراً.",
      CANVAS_UNAVAILABLE: "تعذّر إنشاء مساحة الرسم. أغلق بعض التبويبات وحاول مجدداً.",
      generic: "حدث خطأ أثناء توليد الفيديو.",
    },
    privacy: "يتم التوليد بالكامل داخل متصفحك دون رفع أي بيانات.",
    size: "الحجم",
    duration: "المدة",
  },
};

/* ------------------------------------------------------------------ prefs */

type Quality = "standard" | "high" | "max";

interface Prefs {
  preset: PresetId;
  size: PhoneSize;
  bg: BackgroundId;
  custom: string;
  fps: 30 | 60;
  quality: Quality;
  introMs: number;
  outroMs: number;
  sound: boolean;
}

const DEFAULT_PREFS: Prefs = {
  preset: "story",
  size: "m",
  bg: "studio",
  custom: "#1e293b",
  fps: 30,
  quality: "high",
  introMs: 500,
  outroMs: 2000,
  sound: false,
};

const PREFS_KEY = "scenora.export.prefs";
const INTRO_OPTIONS = [0, 500, 1000, 2000];
const OUTRO_OPTIONS = [1000, 2000, 3000, 5000];

function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
    if (!PRESETS.some((x) => x.id === p.preset)) p.preset = DEFAULT_PREFS.preset;
    if (!BACKGROUNDS.some((x) => x.id === p.bg)) p.bg = DEFAULT_PREFS.bg;
    if (!["s", "m", "l"].includes(p.size)) p.size = DEFAULT_PREFS.size;
    if (p.fps !== 30 && p.fps !== 60) p.fps = 30;
    if (!["standard", "high", "max"].includes(p.quality)) p.quality = DEFAULT_PREFS.quality;
    if (!INTRO_OPTIONS.includes(p.introMs)) p.introMs = DEFAULT_PREFS.introMs;
    if (!OUTRO_OPTIONS.includes(p.outroMs)) p.outroMs = DEFAULT_PREFS.outroMs;
    if (!/^#[0-9a-f]{6}$/i.test(p.custom)) p.custom = DEFAULT_PREFS.custom;
    p.sound = !!p.sound;
    return p;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* private mode / quota */
  }
}

/** Target bitrate: bits per pixel per frame, a bit less per frame at 60 fps. */
function bitrateFor(W: number, H: number, fps: number, q: Quality): number {
  const bpp = q === "standard" ? 0.12 : q === "high" ? 0.2 : 0.34;
  const temporal = fps > 30 ? 0.75 : 1;
  return Math.round(W * H * fps * bpp * temporal);
}

const CODEC_NAMES: Record<PickedCodec["id"], string> = { avc: "H.264", hevc: "HEVC (H.265)", vp9: "VP9", av1: "AV1" };

/* ---------------------------------------------------------------- helpers */

function fmtClock(ms: number, lang: Lang): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const str = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return lang === "ar" ? str.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : str;
}

function fmtMB(bytes: number, lang: Lang): string {
  const mb = bytes / 1_048_576;
  const v = mb < 10 ? mb.toFixed(1) : String(Math.round(mb));
  return lang === "ar" ? `${Number(v).toLocaleString("ar-EG")} م.ب` : `${v} MB`;
}

/** Yield to the event loop without timers (timers are throttled in background tabs). */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      ch.port1.close();
      resolve();
    };
    ch.port2.postMessage(0);
  });
}

function makeView(scenario: Scenario, st: FrameState | null, clockMs?: number): PlaybackView {
  const noop = () => {};
  if (!st) {
    return {
      phase: "idle",
      isLive: false,
      messages: scenario.messages,
      typing: false,
      statusOf: (m) => m.status,
      play: noop,
      pause: noop,
      resume: noop,
      restart: noop,
      reset: noop,
    };
  }
  return {
    phase: "playing",
    isLive: false,
    messages: scenario.messages.filter((m) => st.visibleIds.has(m.id)),
    typing: st.typing,
    clockMs,
    statusOf: (m) => st.statuses.get(m.id) ?? m.status,
    play: noop,
    pause: noop,
    resume: noop,
    restart: noop,
    reset: noop,
  };
}

/* ------------------------------------------------------------------ stage */

/**
 * The phone that gets rasterised, rendered off-screen. Memoised so progress
 * updates in the dialog never re-render the (heavy) platform template; frames
 * are pushed imperatively through `controllerRef.render` with flushSync.
 */
const ExportStage = memo(function ExportStage({
  scenario,
  lang,
  rtl,
  controllerRef,
}: {
  scenario: Scenario;
  lang: Lang;
  rtl: boolean;
  controllerRef: React.RefObject<StageController | null>;
}) {
  const [st, setSt] = useState<{ frame: FrameState | null; clock?: number }>({ frame: null });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    controllerRef.current = {
      node,
      render: (frame, clock) => flushSync(() => setSt({ frame, clock })),
    };
    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef]);

  const view = useMemo(() => makeView(scenario, st.frame, st.clock), [scenario, st]);

  return (
    <div
      aria-hidden
      data-export-stage=""
      // Off-screen but laid out: never display:none / visibility:hidden (that blanks the capture).
      style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none", contain: "layout style" }}
    >
      <style>{`
        [data-export-stage] *, [data-export-stage] *::before, [data-export-stage] *::after {
          animation: none !important; transition: none !important; caret-color: transparent !important;
        }
        [data-export-stage] .rcss-scroll { scroll-behavior: auto !important; overflow-anchor: none !important; }
      `}</style>
      <div ref={boxRef} style={{ display: "inline-block", padding: 6, background: "transparent" }}>
        <DeviceFrame
          device={scenario.device}
          dir={rtl ? "rtl" : "ltr"}
          fontFamily={deviceFontFamily(scenario.device, scenario.androidFont)}
        >
          <PlatformView scenario={scenario} playback={view} lang={lang} rtl={rtl} />
        </DeviceFrame>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------- controls */

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  attr,
  disabled,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  attr: string;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            {...{ [`data-export-${attr}`]: String(o.value) }}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium tabular-nums transition-colors disabled:opacity-50",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function AspectGlyph({ ratio }: { ratio: string }) {
  const [a, b] = ratio ? ratio.split(":").map(Number) : [9, 19.5];
  const max = 18;
  const w = a >= b ? max : (max * a) / b;
  const h = a >= b ? (max * b) / a : max;
  return (
    <span className="flex size-5 items-center justify-center">
      <span
        className={cn("block border-[1.5px] border-current", ratio ? "rounded-[3px]" : "rounded-[4px]")}
        style={{ width: w, height: h }}
      />
    </span>
  );
}

function BackgroundSwatch({
  id,
  paint,
  phone,
  active,
  label,
  onSelect,
  onCustom,
}: {
  id: BackgroundId;
  paint: PaintOptions;
  phone: HTMLCanvasElement | null;
  active: boolean;
  label: string;
  onSelect: () => void;
  onCustom?: (hex: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const def = BACKGROUNDS.find((b) => b.id === id)!;
    if (def.dynamic && phone) {
      new ScreenBackdrop().paint(ctx, c.width, c.height, phone, phone.width, phone.height);
    } else {
      paintBackground(ctx, c.width, c.height, def, paint);
    }
  }, [id, paint, phone]);

  return (
    <button
      type="button"
      onClick={onSelect}
      title={label}
      aria-label={label}
      aria-pressed={active}
      data-export-bg={id}
      className={cn(
        "group relative aspect-[3/4] overflow-hidden rounded-lg ring-offset-2 ring-offset-background transition-shadow",
        active ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-foreground/30",
      )}
    >
      <canvas ref={ref} width={60} height={80} className="absolute inset-0 size-full" />
      {id === "custom" && (
        <>
          <Palette className="absolute inset-0 m-auto size-4 text-white mix-blend-difference" />
          <input
            type="color"
            aria-label={label}
            value={paint.custom}
            onChange={(e) => onCustom?.(e.target.value)}
            onClick={onSelect}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </>
      )}
      {active && (
        <span className="absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ dialog */

type Phase = "idle" | "rendering" | "done" | "error";

interface ExportResult {
  file: File;
  url: string;
  codec: PickedCodec;
  audio: AudioCodec | null;
  soundRequested: boolean;
  W: number;
  H: number;
  fps: number;
  durationMs: number;
  tookMs: number;
}

interface Progress {
  done: number;
  total: number;
  etaMs: number | null;
}

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
  const lang: Lang = locale === "en" ? "en" : "ar";
  const rtl = lang === "ar";
  const c = COPY[lang];
  const [supported] = useState(canExportVideo);

  const [prefs, setPrefs] = useState<Prefs>(() => (typeof window === "undefined" ? DEFAULT_PREFS : loadPrefs()));
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0, etaMs: null });
  const [errKey, setErrKey] = useState<string>("");
  const [errDetail, setErrDetail] = useState("");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [device, setDevice] = useState<{ w: number; h: number; radius: number } | null>(null);
  const [previewPhone, setPreviewPhone] = useState<{ canvas: HTMLCanvasElement; scale: number } | null>(null);
  const [audioCodec, setAudioCodec] = useState<AudioCodec | null | undefined>(undefined);

  const stageRef = useRef<StageController | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const backdropRef = useRef<ScreenBackdrop | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  const timeline = useMemo(() => buildTimeline(scenario), [scenario]);
  const totalMs = prefs.introMs + timeline.contentMs + prefs.outroMs;
  const preset = PRESETS.find((p) => p.id === prefs.preset) ?? PRESETS[0];
  const bgDef = BACKGROUNDS.find((b) => b.id === prefs.bg) ?? BACKGROUNDS[0];
  const accent = PLATFORM_MAP[scenario.platform]?.accent ?? "#25d366";
  const paint = useMemo<PaintOptions>(() => ({ accent, custom: prefs.custom }), [accent, prefs.custom]);
  const layout = useMemo(
    () => computeLayout(preset, device ?? { w: 393, h: 852, radius: 68 }, prefs.size),
    [preset, device, prefs.size],
  );
  const bitrate = bitrateFor(layout.W, layout.H, prefs.fps, prefs.quality);

  // Preview canvas pixel size: long side 720px (crisp on HiDPI, cheap to paint).
  const pk = 720 / Math.max(layout.W, layout.H);
  const previewW = Math.round(layout.W * pk);
  const previewH = Math.round(layout.H * pk);

  // One-time: settle fonts, snapshot the finished conversation for the live
  // layout preview (this also warms snapdom's font/style caches for export).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ac = await pickAudioCodec();
      if (!cancelled) setAudioCodec(ac);
      if (document.fonts?.ready) await document.fonts.ready;
      await yieldToEventLoop();
      const stage = stageRef.current;
      if (!stage || cancelled) return;
      stage.render(null);
      stage.node.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => {
        el.scrollTop = el.scrollHeight;
      });
      stripOuterShadow(stage);
      const dims = measureDevice(stage);
      try {
        const scale = 0.8;
        const canvas = await captureStage(stage, scale);
        if (cancelled) return;
        setDevice(dims);
        setPreviewPhone({ canvas, scale });
      } catch {
        if (!cancelled) setDevice(dims);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Repaint the layout preview whenever a setting changes (not while rendering:
  // the renderer streams real frames into the same canvas then).
  useEffect(() => {
    if (phase === "rendering" || phase === "done") return;
    const cv = previewRef.current;
    if (!cv) return;
    backdropRef.current ??= new ScreenBackdrop();
    paintPreview(cv, layout, bgDef, paint, previewPhone?.canvas ?? null, previewPhone?.scale ?? 1, backdropRef.current);
  }, [layout, bgDef, paint, previewPhone, phase, previewW, previewH]);

  // Abort on unmount; free the result URL.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const close = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "rendering") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, phase]);

  const runExport = async () => {
    const stage = stageRef.current;
    if (!stage || phase === "rendering") return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase("rendering");
    setProgress({ done: 0, total: Math.round((totalMs / 1000) * prefs.fps), etaMs: null });
    setErrKey("");
    setErrDetail("");
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);

    let renderer: FrameRenderer | null = null;
    const started = performance.now();
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      stripOuterShadow(stage);
      const dims = measureDevice(stage);
      const lay = computeLayout(preset, dims, prefs.size);
      const fps = prefs.fps;
      const totalFrames = Math.max(1, Math.round((totalMs / 1000) * fps));
      const br = bitrateFor(lay.W, lay.H, fps, prefs.quality);

      const codec = await pickVideoCodec(lay.W, lay.H, fps, br);
      if (!codec) throw new Error("CODEC_UNSUPPORTED");

      let audio: { buffer: AudioBuffer; codec: AudioCodec } | null = null;
      if (prefs.sound) {
        const ac = audioCodec ?? (await pickAudioCodec());
        if (ac) {
          const cues = timeline.reveals.map((r) => ({
            at: r.at + prefs.introMs,
            kind: r.sender === "me" ? ("send" as const) : ("receive" as const),
          }));
          audio = { buffer: await renderSoundTrack(cues, totalMs), codec: ac };
        }
      }

      renderer = new FrameRenderer({
        stage,
        timeline,
        motion: resolvePlatformMotion(scenario.platform, scenario.device),
        rtl,
        layout: lay,
        background: bgDef,
        paint,
        fps,
        introMs: prefs.introMs,
      });
      const r = renderer;
      const pv = previewRef.current;
      const pctx = pv?.getContext("2d") ?? null;

      let lastUi = 0;
      const blob = await exportToMp4({
        width: lay.W,
        height: lay.H,
        fps,
        totalFrames,
        bitrate: br,
        keyframeSeconds: 2,
        codec,
        audio,
        signal: ctrl.signal,
        drawFrame: async (i) => {
          const out = await r.frame(i);
          // keep the UI breathing even through long runs of unchanged frames
          if (i % 6 === 0) await yieldToEventLoop();
          return out;
        },
        onProgress: (done, total) => {
          const now = performance.now();
          if (now - lastUi < 120 && done < total) return;
          lastUi = now;
          if (pv && pctx) pctx.drawImage(r.canvas, 0, 0, pv.width, pv.height);
          const elapsed = now - started;
          const etaMs = done / total > 0.04 && elapsed > 1500 ? (elapsed / done) * (total - done) : null;
          setProgress({ done, total, etaMs });
        },
      });

      if (process.env.NODE_ENV !== "production") {
        console.info("[export] " + JSON.stringify({
          codec: codec.codec,
          audio: audio?.codec ?? null,
          size: `${lay.W}x${lay.H}@${fps}`,
          frames: totalFrames,
          captured: r.stats.captured,
          reused: r.stats.reused,
          msPerCapture: Math.round(r.stats.captureMs / Math.max(1, r.stats.captured)),
          totalMs: Math.round(performance.now() - started),
          bytes: blob.size,
        }));
      }

      const file = createVideoFile(blob, scenario.platform, scenario.device);
      const url = URL.createObjectURL(file);
      resultUrlRef.current = url;
      setResult({
        file,
        url,
        codec,
        audio: audio?.codec ?? null,
        soundRequested: prefs.sound,
        W: lay.W,
        H: lay.H,
        fps,
        durationMs: (totalFrames * 1000) / fps,
        tookMs: performance.now() - started,
      });
      setPhase("done");
      if (!isTouchDevice()) downloadVideoFile(file);
    } catch (e) {
      if (e instanceof ExportAbortedError || ctrl.signal.aborted) {
        setPhase("idle");
      } else {
        const msg = (e as Error)?.message ?? "";
        setErrKey(c.errors[msg] ? msg : "generic");
        setErrDetail(c.errors[msg] ? "" : msg);
        setPhase("error");
      }
    } finally {
      renderer?.dispose();
      if (abortRef.current === ctrl) abortRef.current = null;
      // back to the static, fully revealed thread for the next preview
      stageRef.current?.render(null);
    }
  };

  const cancel = () => abortRef.current?.abort();

  const [saving, setSaving] = useState(false);
  const save = async (share: boolean) => {
    if (!result) return;
    if (!share) {
      downloadVideoFile(result.file);
      return;
    }
    setSaving(true);
    try {
      await saveVideoFile(result.file, { preferShare: true });
    } finally {
      setSaving(false);
    }
  };

  const busy = phase === "rendering";
  const pct = progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
  const canShare = result ? canShareVideoFile(result.file) : false;
  const summary = `${layout.W}×${layout.H} · ${prefs.fps} fps · ${fmtClock(totalMs, lang)}`;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        dir={rtl ? "rtl" : "ltr"}
        className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Film className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 id="export-title" className="text-[15px] font-semibold leading-tight">
              {t.exportVideo}
            </h2>
            <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="ms-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={c.close}
          >
            <X className="size-5" />
          </button>
        </div>

        {!supported ? (
          <div className="space-y-4 p-6">
            <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p>{c.errors.VIDEO_UNSUPPORTED}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={close}>
              {c.close}
            </Button>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_360px] md:overflow-hidden">
            {/* preview */}
            <div className="relative flex min-h-[300px] flex-col bg-muted/50 p-4 md:min-h-[560px]">
              <div className="relative flex min-h-0 flex-1 items-center justify-center">
                {phase === "done" && result ? (
                  <video
                    key={result.url}
                    src={result.url}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="max-h-[min(62dvh,540px)] max-w-full rounded-lg bg-black shadow-lg"
                    style={{ aspectRatio: `${result.W}/${result.H}` }}
                  />
                ) : (
                  <canvas
                    ref={previewRef}
                    width={previewW}
                    height={previewH}
                    className={cn(
                      "max-h-[min(56dvh,520px)] max-w-full rounded-lg shadow-lg ring-1 ring-black/5 transition-opacity",
                      !previewPhone && "animate-pulse",
                    )}
                    style={{ aspectRatio: `${layout.W}/${layout.H}` }}
                  />
                )}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground tabular-nums" dir="ltr">
                <span>{phase === "done" && result ? `${result.W}×${result.H} · ${result.fps} fps` : summary}</span>
                {preset.ratio && <span className="rounded bg-background px-1.5 py-0.5 ring-1 ring-border">{preset.ratio}</span>}
              </div>
            </div>

            {/* side panel */}
            <div className="flex min-h-0 flex-col border-t border-border md:border-s md:border-t-0">
              {phase === "rendering" ? (
                <div className="flex flex-1 flex-col justify-center gap-5 p-6">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      {c.rendering}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.privacy}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-semibold tabular-nums">
                        {lang === "ar" ? `${pct.toLocaleString("ar-EG")}٪` : `${pct}%`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {progress.etaMs === null ? c.estimating : c.eta(fmtClock(progress.etaMs + 999, lang))}
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">{c.frameOf(progress.done, progress.total)}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={cancel} data-export-cancel="">
                    {c.cancel}
                  </Button>
                </div>
              ) : phase === "done" && result ? (
                <div className="flex flex-1 flex-col gap-4 p-6" data-export-done="">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                      <Check className="size-5" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{c.done}</p>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {result.file.name}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-center">
                    {[
                      [c.duration, fmtClock(result.durationMs, lang)],
                      [c.size, fmtMB(result.file.size, lang)],
                      ["", `${CODEC_NAMES[result.codec.id]}${result.audio ? ` + ${result.audio.toUpperCase()}` : ""}`],
                    ].map(([k, v], i) => (
                      <div key={i} className="rounded-lg bg-muted px-2 py-2">
                        <dt className="text-[10px] text-muted-foreground">{k || (lang === "ar" ? "الترميز" : "Codec")}</dt>
                        <dd className="text-xs font-semibold tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {result.codec.id !== "avc" && (
                    <p className="flex gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="size-4 shrink-0" />
                      {c.codecFallback(CODEC_NAMES[result.codec.id])}
                    </p>
                  )}
                  {result.soundRequested && !result.audio && (
                    <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{c.noAudio}</p>
                  )}
                  {!isTouchDevice() && <p className="text-xs text-muted-foreground">{c.savedHint}</p>}
                  {isTouchDevice() && <p className="text-xs text-muted-foreground">{t.exportSaveHint}</p>}
                  <div className="mt-auto space-y-2">
                    {canShare && isTouchDevice() ? (
                      <Button className="h-11 w-full gap-2" onClick={() => save(true)} disabled={saving}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                        {c.share}
                      </Button>
                    ) : null}
                    <Button
                      variant={canShare && isTouchDevice() ? "outline" : "default"}
                      className="h-11 w-full gap-2"
                      onClick={() => save(false)}
                    >
                      <Download className="size-4" />
                      {c.download}
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-1.5" onClick={() => setPhase("idle")}>
                        <RotateCcw className="size-4" />
                        {c.again}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={close}>
                        {c.close}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 space-y-5 p-5 md:overflow-y-auto">
                    {phase === "error" && (
                      <div
                        className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                        data-export-error=""
                      >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                          {c.errors[errKey] ?? c.errors.generic}
                          {errDetail && <span className="block text-xs opacity-80" dir="ltr">{errDetail}</span>}
                        </p>
                      </div>
                    )}

                    <Section title={c.format}>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESETS.map((p) => {
                          const active = p.id === prefs.preset;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              data-export-preset={p.id}
                              aria-pressed={active}
                              onClick={() => update({ preset: p.id })}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-start transition-colors",
                                p.id === "device" && "col-span-2",
                                active
                                  ? "border-primary bg-primary/[0.07] text-foreground"
                                  : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                              )}
                            >
                              <span className={cn(active ? "text-primary" : "")}>
                                <AspectGlyph ratio={p.ratio} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-baseline justify-between gap-1">
                                  <span className="truncate text-xs font-semibold text-foreground">{c.presets[p.id].name}</span>
                                  {p.ratio && (
                                    <span className="text-[10px] tabular-nums text-muted-foreground" dir="ltr">
                                      {p.ratio}
                                    </span>
                                  )}
                                </span>
                                <span className="block truncate text-[10px] text-muted-foreground">
                                  {c.presets[p.id].hint}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </Section>

                    {preset.w !== null && (
                      <Section title={c.phoneSize}>
                        <Segmented
                          attr="size"
                          value={prefs.size}
                          onChange={(v) => update({ size: v })}
                          options={(["s", "m", "l"] as PhoneSize[]).map((v) => ({ value: v, label: c.sizes[v] }))}
                        />
                      </Section>
                    )}

                    <Section title={c.background} aside={<span className="text-[11px] text-muted-foreground">{c.bgs[prefs.bg]}</span>}>
                      <div className="grid grid-cols-5 gap-2">
                        {BACKGROUNDS.map((b) => (
                          <BackgroundSwatch
                            key={b.id}
                            id={b.id}
                            paint={paint}
                            phone={previewPhone?.canvas ?? null}
                            active={prefs.bg === b.id}
                            label={b.id === "custom" ? c.pickColor : c.bgs[b.id]}
                            onSelect={() => update({ bg: b.id })}
                            onCustom={(hex) => update({ bg: "custom", custom: hex })}
                          />
                        ))}
                      </div>
                    </Section>

                    <Section title={c.timing}>
                      <div className="space-y-2">
                        {(
                          [
                            [c.fps, <Segmented
                              key="fps"
                              attr="fps"
                              value={prefs.fps}
                              onChange={(v) => update({ fps: v })}
                              options={[
                                { value: 30 as const, label: lang === "ar" ? "٣٠" : "30" },
                                { value: 60 as const, label: lang === "ar" ? "٦٠" : "60" },
                              ]}
                            />],
                            [c.quality, <Segmented
                              key="quality"
                              attr="quality"
                              value={prefs.quality}
                              onChange={(v) => update({ quality: v })}
                              options={(["standard", "high", "max"] as Quality[]).map((v) => ({ value: v, label: c.qualities[v] }))}
                            />],
                            [c.intro, <Segmented
                              key="intro"
                              attr="intro"
                              value={prefs.introMs}
                              onChange={(v) => update({ introMs: v })}
                              options={INTRO_OPTIONS.map((v) => ({ value: v, label: c.sec(v / 1000) }))}
                            />],
                            [c.outro, <Segmented
                              key="outro"
                              attr="outro"
                              value={prefs.outroMs}
                              onChange={(v) => update({ outroMs: v })}
                              options={OUTRO_OPTIONS.map((v) => ({ value: v, label: c.sec(v / 1000) }))}
                            />],
                          ] as [string, React.ReactNode][]
                        ).map(([label, control]) => (
                          <div key={label} className="grid grid-cols-[96px_1fr] items-center gap-2">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            {control}
                          </div>
                        ))}
                      </div>
                    </Section>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs.sound && !!audioCodec}
                      disabled={audioCodec === null}
                      data-export-sound={prefs.sound ? "on" : "off"}
                      onClick={() => update({ sound: !prefs.sound })}
                      className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-start transition-colors hover:bg-muted/60 disabled:opacity-60"
                    >
                      {prefs.sound && audioCodec ? (
                        <Volume2 className="size-4 text-primary" />
                      ) : (
                        <VolumeX className="size-4 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{c.sound}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {audioCodec === null ? c.soundUnsupported : c.soundHint}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                          prefs.sound && audioCodec ? "bg-primary" : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-[inset-inline-start]",
                            prefs.sound && audioCodec ? "start-[18px]" : "start-0.5",
                          )}
                        />
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-border p-4">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                      <span dir="ltr">{summary}</span>
                      <span>~{fmtMB(estimateBytes(bitrate, totalMs), lang)}</span>
                    </div>
                    <Button className="h-11 w-full gap-2 text-sm" onClick={runExport} disabled={!device} data-export-start="">
                      {device ? <Download className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
                      {c.start}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">{c.privacy}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {supported && <ExportStage scenario={scenario} lang={lang} rtl={rtl} controllerRef={stageRef} />}
    </div>
  );
}
