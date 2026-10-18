"use client";

import { memo, useCallback, useEffect, useEffectEvent, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  BellRing,
  Captions,
  Check,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  Download,
  Film,
  Gauge,
  Image as ImageIcon,
  Layers,
  Loader2,
  Music,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Scan,
  Share2,
  Sparkles,
  Stamp,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { DEVICE_SIZE, DeviceFrame } from "./devices/DeviceFrame";
import { PhoneScreen } from "./devices/PhoneScreen";
import { PLATFORM_MAP, PLATFORMS, PlatformView, preloadPlatform, resolvePlatformMotion } from "./platforms";
import { PlatformMark } from "./studio/BrandMarks";
import { deviceFontFamily } from "../data/fonts";
import { buildTimeline, type FrameState, type Timeline } from "../export/schedule";
import { scaleTimeline, SPEEDS, type Speed } from "../export/speed";
import { SAFE_ZONE_IDS, SAFE_ZONES, safeInset, type SafeZoneId } from "../export/safezones";
import { canExportVideo, exportToMp4, ExportAbortedError, pickVideoCodec, type PickedCodec } from "../export/exportVideo";
import {
  computeLayout,
  estimateBytes,
  FALLBACK_DEVICE,
  PRESETS,
  supportsCaption,
  type DeviceGeometry,
  type PhoneSize,
  type PresetId,
} from "../export/layout";
import { BACKGROUNDS, paintBackground, ScreenBackdrop, type BackgroundId, type PaintOptions } from "../export/backgrounds";
import {
  captureStage,
  FrameRenderer,
  measureDevice,
  paintPreview,
  stripOuterShadow,
  scrollChat,
  waitForTemplate,
  yieldToEventLoop,
  type StageController,
} from "../export/renderer";
import { ZOOM_LEVELS, type CameraOptions, type ZoomIntensity } from "../export/camera";
import { decodeMusic, pickAudioCodec, renderSoundTrack, type AudioCodec, type MusicBed, type SoundCue } from "../export/audio";
import {
  captionBandFraction,
  NOTIF,
  outputTimeOf,
  pageFontFamily,
  sceneTiming,
  type CaptionConfig,
  type CaptionPosition,
  type CaptionSize,
  type EndCardConfig,
  type SceneTiming,
  type WatermarkConfig,
  type WatermarkCorner,
  type WatermarkSize,
} from "../export/scenes";
import { buildPalette, estimateGifBytes, fitGifWidth, GifWriter } from "../export/gif";
import { introChatStyle, NotificationIntro, type NoticeInfo } from "../export/NotificationIntro";
import {
  canShareFiles,
  canShareVideoFile,
  createExportFile,
  downloadFiles,
  downloadVideoFile,
  isTouchDevice,
  saveVideoFile,
  shareFiles,
} from "../services/video-file";
import { syncLiveZoom } from "../export/zoomPrefs";
import type { PlaybackView } from "../playback/usePlayback";
import type { Device, Platform, Scenario } from "../types";
import type { StudioLabels } from "./labels";

/* ------------------------------------------------------------------ copy */

type Lang = "ar" | "en";
type OutputKind = "video" | "gif" | "image";
type Quality = "standard" | "high" | "max";
type ImageFormat = "png" | "jpeg";
type Peek = "intro" | "end";
type BatchStatus = "pending" | "rendering" | "done" | "error" | "cancelled";
type SafeChoice = SafeZoneId | "off";

const COPY = {
  en: {
    subtitle: "MP4, GIF or image for Reels, TikTok, Stories and feeds",
    output: "Output",
    kinds: { video: "Video", gif: "GIF", image: "Image" } as Record<OutputKind, string>,
    kindHints: { video: "MP4 · sound", gif: "Loops anywhere", image: "PNG · JPEG" } as Record<OutputKind, string>,
    videoOff: "This browser can't encode video — GIF and image export still work.",
    preview: "Preview",
    format: "Format",
    presets: {
      story: { name: "Story · Reels", hint: "TikTok · Reels · Shorts" },
      portrait: { name: "Feed portrait", hint: "Instagram · Facebook" },
      square: { name: "Square", hint: "Feed · X · LinkedIn" },
      landscape: { name: "Landscape", hint: "YouTube · Web" },
      device: { name: "Phone only", hint: "Just the device" },
    } as Record<PresetId, { name: string; hint: string }>,
    phoneSize: "Phone size",
    sizes: { s: "Small", m: "Medium", l: "Large" } as Record<PhoneSize, string>,
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
    } as Record<BackgroundId, string>,
    pickColor: "Pick a colour",
    fps: "Frame rate",
    quality: "Quality",
    qualities: { standard: "Standard", high: "High", max: "Max" } as Record<Quality, string>,
    timing: "Output",
    intro: "Hold at start",
    outro: "Hold at end",
    sec: (n: number) => `${n}s`,
    sound: "Message sounds",
    soundHint: "Subtle send and receive sounds",
    soundUnsupported: "This browser can't encode audio",
    zoom: "Auto-zoom",
    zoomHint: "The camera glides to each new message and the composer while typing",
    zoomLevels: { subtle: "Subtle", medium: "Medium", strong: "Strong" } as Record<ZoomIntensity, string>,
    followSides: "Follow both sides",
    zoomOutEnd: "Zoom out at the end",
    scenes: "Scenes",
    notif: "Notification intro",
    notifHint: "Starts on the lock screen with the first message as a notification, then opens the chat",
    notifNone: "Needs at least one incoming message",
    peek: "Preview",
    peekBack: "Back to layout",
    showing: { intro: "Notification intro", end: "End card" } as Record<Peek, string>,
    caption: "Caption",
    captionHint: "A headline that stays above or below the phone",
    captionOnlyTall: "Available for 9:16 and 4:5 formats",
    captionText: "Caption text",
    captionDefault: "Order in 2 taps",
    position: "Position",
    positions: { top: "Above", bottom: "Below" } as Record<CaptionPosition, string>,
    textSize: "Text size",
    textColor: "Text colour",
    pill: "Background pill",
    pillColor: "Pill colour",
    endCard: "End card",
    endHint: "Logo, headline and a call to action after the chat",
    logo: "Logo",
    uploadLogo: "Upload logo",
    replaceLogo: "Replace",
    removeLogo: "Remove",
    logoError: "Couldn't read this image.",
    headline: "Headline",
    headlineDefault: "Your order, one message away",
    cta: "Button text",
    ctaDefault: "Order now",
    colors: { bg: "Background", fg: "Headline", ctaBg: "Button", ctaFg: "Button text" },
    endLength: "Length",
    audio: "Audio",
    music: "Background music",
    musicHint: "MP3, M4A, WAV or OGG — trimmed or looped to the video",
    chooseMusic: "Choose audio file",
    replaceMusic: "Replace",
    removeMusic: "Remove",
    musicError: "Couldn't read this audio file.",
    trimStart: "Start at",
    volume: "Volume",
    fadeIn: "Fade in",
    fadeOut: "Fade out",
    loop: "Loop if shorter than the video",
    play: "Play preview",
    stop: "Stop preview",
    gifSettings: "GIF",
    gifWidth: "Width",
    gifFps: "Frame rate",
    gifCap: "Max size",
    gifHint: "Palette-optimised and size-capped; best for quick sharing",
    imageSettings: "Image",
    imageType: "File type",
    resolution: "Resolution",
    moment: "Moment",
    finalFrame: "Final frame",
    start: { video: "Export video", gif: "Export GIF", image: "Export image" } as Record<OutputKind, string>,
    rendering: { video: "Rendering video…", gif: "Rendering GIF…", image: "Rendering image…" } as Record<OutputKind, string>,
    gifRetry: "Over the size limit — rendering it smaller…",
    frameOf: (a: number, b: number) => `Frame ${a} of ${b}`,
    eta: (s: string) => `About ${s} left`,
    estimating: "Estimating time…",
    elapsed: (s: string) => `Took ${s}`,
    cancel: "Cancel",
    done: { video: "Your video is ready", gif: "Your GIF is ready", image: "Your image is ready" } as Record<OutputKind, string>,
    savedHint: "The download started automatically. You can save it again below.",
    download: { video: "Download MP4", gif: "Download GIF", png: "Download PNG", jpeg: "Download JPEG" },
    share: "Share / Save",
    again: "Change settings",
    close: "Close",
    codecFallback: (c: string) =>
      `This browser has no H.264 encoder, so the video was encoded as ${c}. Some apps may not play it; Chrome or Edge on a computer produce H.264.`,
    noAudio: "This browser can't encode audio, so the video has no sound.",
    errors: {
      VIDEO_UNSUPPORTED: "This browser can't encode video. Use Chrome or Edge, or Recording Mode to capture your screen.",
      CODEC_UNSUPPORTED: "This browser has no video encoder for this size. Try a smaller format or 30 fps.",
      CANVAS_UNAVAILABLE: "Couldn't create a drawing surface. Close other tabs and try again.",
      IMAGE_FAILED: "Couldn't encode the image. Try a lower resolution.",
      generic: "Something went wrong while rendering.",
    } as Record<string, string>,
    privacy: "Rendered entirely in your browser. Nothing is uploaded.",
    size: "Size",
    duration: "Length",
    codec: "Codec",
    dims: "Dimensions",
    frames: "Frames",
    max: (s: string) => `max ${s}`,
    speed: "Speed",
    speedHint: "Plays the whole conversation faster or slower",
    speedValue: (v: number) => `${v}×`,
    batch: "Batch export",
    batchHint: "The same chat for several apps and phones, one file each",
    batchCount: (n: number) => `${n} selected`,
    batchAll: "All",
    batchCurrent: "Only this one",
    app: "App",
    devices: { iphone: "iPhone", android: "Android" } as Record<Device, string>,
    startBatch: (k: OutputKind, n: number) =>
      `Export ${n} ${k === "video" ? (n === 1 ? "video" : "videos") : k === "gif" ? (n === 1 ? "GIF" : "GIFs") : n === 1 ? "image" : "images"}`,
    batchOf: (i: number, n: number) => `File ${i} of ${n}`,
    itemStatus: {
      pending: "Waiting",
      rendering: "Rendering",
      done: "Ready",
      error: "Failed",
      cancelled: "Cancelled",
    } as Record<BatchStatus, string>,
    batchDone: (n: number, total: number) => (n === total ? `All ${total} files are ready` : `${n} of ${total} files are ready`),
    batchSaved: "Each file downloaded as it finished (your browser may ask once to allow several downloads).",
    downloadAll: "Download all",
    shareAll: "Share all",
    downloadOne: "Download",
    showItem: "Show in preview",
    safe: "Safe zone",
    safeHint: "Shows where the app's buttons and captions cover the frame — in this preview only, never in the file",
    safeOnlyStory: "For the 9:16 format",
    safeZones: { off: "Off", tiktok: "TikTok", reels: "Reels", shorts: "Shorts", stories: "Stories" } as Record<SafeZoneId | "off", string>,
    safeFit: "Fit the phone and caption inside the safe zone",
    zoneTop: "Top bar",
    zoneBottom: "Caption & sound",
    zoneBottomStories: "Reply bar",
    zoneRail: "Buttons",
    wm: "Watermark",
    wmHint: "Your logo or handle in a corner of every frame",
    wmText: "Text",
    wmTextDefault: "@yourbrand",
    wmCorner: "Corner",
    corners: { tl: "Top left", tr: "Top right", bl: "Bottom left", br: "Bottom right" } as Record<WatermarkCorner, string>,
    wmSize: "Size",
    wmOpacity: "Opacity",
    wmColor: "Text colour",
  },
  ar: {
    subtitle: "فيديو MP4 أو GIF أو صورة للريلز وتيك توك والستوري والمنشورات",
    output: "نوع الملف",
    kinds: { video: "فيديو", gif: "GIF", image: "صورة" } as Record<OutputKind, string>,
    kindHints: { video: "MP4 · بصوت", gif: "يتكرر في أي مكان", image: "PNG · JPEG" } as Record<OutputKind, string>,
    videoOff: "متصفحك لا يدعم توليد الفيديو، لكن تصدير GIF والصور يعمل.",
    preview: "معاينة",
    format: "المقاس",
    presets: {
      story: { name: "ستوري · ريلز", hint: "تيك توك · ريلز · شورتس" },
      portrait: { name: "منشور طولي", hint: "إنستغرام · فيسبوك" },
      square: { name: "مربع", hint: "منشور · X · لينكدإن" },
      landscape: { name: "عرضي", hint: "يوتيوب · الويب" },
      device: { name: "الجهاز فقط", hint: "بدون مساحة حوله" },
    } as Record<PresetId, { name: string; hint: string }>,
    phoneSize: "حجم الجوال",
    sizes: { s: "صغير", m: "متوسط", l: "كبير" } as Record<PhoneSize, string>,
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
    } as Record<BackgroundId, string>,
    pickColor: "اختر لوناً",
    fps: "معدل الإطارات",
    quality: "الجودة",
    qualities: { standard: "عادية", high: "عالية", max: "قصوى" } as Record<Quality, string>,
    timing: "الإخراج",
    intro: "ثبات في البداية",
    outro: "ثبات في النهاية",
    sec: (n: number) => `${n.toLocaleString("ar-EG")} ث`,
    sound: "أصوات الرسائل",
    soundHint: "صوت خفيف عند الإرسال والاستلام",
    soundUnsupported: "المتصفح لا يدعم ترميز الصوت",
    zoom: "تكبير تلقائي",
    zoomHint: "الكاميرا تنتقل بسلاسة إلى كل رسالة جديدة وإلى خانة الكتابة أثناء الكتابة",
    zoomLevels: { subtle: "خفيف", medium: "متوسط", strong: "قوي" } as Record<ZoomIntensity, string>,
    followSides: "تتبّع الطرفين",
    zoomOutEnd: "تصغير في النهاية",
    scenes: "المشاهد",
    notif: "مقدمة الإشعار",
    notifHint: "يبدأ بشاشة القفل وإشعار بأول رسالة واردة ثم تُفتح المحادثة",
    notifNone: "يحتاج رسالة واردة واحدة على الأقل",
    peek: "معاينة",
    peekBack: "العودة للتخطيط",
    showing: { intro: "مقدمة الإشعار", end: "البطاقة الختامية" } as Record<Peek, string>,
    caption: "عنوان ثابت",
    captionHint: "نص يبقى فوق الجوال أو تحته طوال الفيديو",
    captionOnlyTall: "متاح لمقاسي ٩:١٦ و٤:٥",
    captionText: "نص العنوان",
    captionDefault: "اطلب بضغطتين",
    position: "الموضع",
    positions: { top: "فوق", bottom: "تحت" } as Record<CaptionPosition, string>,
    textSize: "حجم النص",
    textColor: "لون النص",
    pill: "خلفية للنص",
    pillColor: "لون الخلفية",
    endCard: "البطاقة الختامية",
    endHint: "شعار وعنوان وزر دعوة بعد المحادثة",
    logo: "الشعار",
    uploadLogo: "رفع شعار",
    replaceLogo: "استبدال",
    removeLogo: "إزالة",
    logoError: "تعذّرت قراءة الصورة.",
    headline: "العنوان",
    headlineDefault: "طلبك على بُعد رسالة",
    cta: "نص الزر",
    ctaDefault: "اطلب الآن",
    colors: { bg: "الخلفية", fg: "العنوان", ctaBg: "الزر", ctaFg: "نص الزر" },
    endLength: "المدة",
    audio: "الصوت",
    music: "موسيقى خلفية",
    musicHint: "MP3 أو M4A أو WAV أو OGG — تُقص أو تُكرَّر حسب طول الفيديو",
    chooseMusic: "اختر ملفاً صوتياً",
    replaceMusic: "استبدال",
    removeMusic: "إزالة",
    musicError: "تعذّرت قراءة الملف الصوتي.",
    trimStart: "البداية من",
    volume: "مستوى الصوت",
    fadeIn: "ظهور تدريجي",
    fadeOut: "اختفاء تدريجي",
    loop: "تكرار إذا كانت أقصر من الفيديو",
    play: "تشغيل المعاينة",
    stop: "إيقاف المعاينة",
    gifSettings: "GIF",
    gifWidth: "العرض",
    gifFps: "معدل الإطارات",
    gifCap: "الحد الأقصى",
    gifHint: "ألوان محسّنة وحجم محدود، مناسب للمشاركة السريعة",
    imageSettings: "الصورة",
    imageType: "نوع الملف",
    resolution: "الدقة",
    moment: "اللحظة",
    finalFrame: "الإطار الأخير",
    start: { video: "تصدير الفيديو", gif: "تصدير GIF", image: "تصدير الصورة" } as Record<OutputKind, string>,
    rendering: { video: "جارٍ توليد الفيديو…", gif: "جارٍ توليد GIF…", image: "جارٍ توليد الصورة…" } as Record<OutputKind, string>,
    gifRetry: "تجاوز الحد المسموح — جارٍ التوليد بحجم أصغر…",
    frameOf: (a: number, b: number) => `الإطار ${a.toLocaleString("ar-EG")} من ${b.toLocaleString("ar-EG")}`,
    eta: (s: string) => `متبقٍ حوالي ${s}`,
    estimating: "جارٍ حساب الوقت…",
    elapsed: (s: string) => `استغرق ${s}`,
    cancel: "إلغاء",
    done: { video: "الفيديو جاهز", gif: "ملف GIF جاهز", image: "الصورة جاهزة" } as Record<OutputKind, string>,
    savedHint: "بدأ التنزيل تلقائياً، ويمكنك حفظه مرة أخرى من هنا.",
    download: { video: "تنزيل MP4", gif: "تنزيل GIF", png: "تنزيل PNG", jpeg: "تنزيل JPEG" },
    share: "مشاركة / حفظ",
    again: "تعديل الإعدادات",
    close: "إغلاق",
    codecFallback: (c: string) =>
      `متصفحك لا يدعم ترميز H.264، لذلك تم ترميز الفيديو بصيغة ${c}. قد لا تشغّله بعض التطبيقات؛ استخدم Chrome أو Edge على الكمبيوتر للحصول على H.264.`,
    noAudio: "المتصفح لا يدعم ترميز الصوت، لذلك الفيديو بدون صوت.",
    errors: {
      VIDEO_UNSUPPORTED: "متصفحك لا يدعم توليد الفيديو. استخدم Chrome أو Edge، أو وضع التسجيل وسجّل شاشتك.",
      CODEC_UNSUPPORTED: "لا يوجد مرمّز فيديو لهذا المقاس في متصفحك. جرّب مقاساً أصغر أو ٣٠ إطاراً.",
      CANVAS_UNAVAILABLE: "تعذّر إنشاء مساحة الرسم. أغلق بعض التبويبات وحاول مجدداً.",
      IMAGE_FAILED: "تعذّر ترميز الصورة. جرّب دقة أقل.",
      generic: "حدث خطأ أثناء التوليد.",
    } as Record<string, string>,
    privacy: "يتم التوليد بالكامل داخل متصفحك دون رفع أي بيانات.",
    size: "الحجم",
    duration: "المدة",
    codec: "الترميز",
    dims: "الأبعاد",
    frames: "الإطارات",
    max: (s: string) => `الحد ${s}`,
    speed: "السرعة",
    speedHint: "تشغيل المحادثة كاملة بسرعة أعلى أو أبطأ",
    speedValue: (v: number) => `${v.toLocaleString("ar-EG")}×`,
    batch: "تصدير دفعة واحدة",
    batchHint: "المحادثة نفسها لعدة تطبيقات وأجهزة، ملف لكل منها",
    batchCount: (n: number) => `${n.toLocaleString("ar-EG")} محدد`,
    batchAll: "الكل",
    batchCurrent: "الحالي فقط",
    app: "التطبيق",
    devices: { iphone: "آيفون", android: "أندرويد" } as Record<Device, string>,
    startBatch: (k: OutputKind, n: number) =>
      `تصدير ${n.toLocaleString("ar-EG")} ${k === "video" ? "فيديو" : k === "gif" ? "GIF" : n === 1 ? "صورة" : "صور"}`,
    batchOf: (i: number, n: number) => `الملف ${i.toLocaleString("ar-EG")} من ${n.toLocaleString("ar-EG")}`,
    itemStatus: {
      pending: "بالانتظار",
      rendering: "جارٍ التوليد",
      done: "جاهز",
      error: "فشل",
      cancelled: "أُلغي",
    } as Record<BatchStatus, string>,
    batchDone: (n: number, total: number) =>
      n === total ? `الملفات الـ${total.toLocaleString("ar-EG")} جاهزة` : `${n.toLocaleString("ar-EG")} من ${total.toLocaleString("ar-EG")} ملفات جاهزة`,
    batchSaved: "نُزّل كل ملف فور اكتماله (قد يطلب المتصفح مرة واحدة السماح بتنزيل عدة ملفات).",
    downloadAll: "تنزيل الكل",
    shareAll: "مشاركة الكل",
    downloadOne: "تنزيل",
    showItem: "عرض في المعاينة",
    safe: "المنطقة الآمنة",
    safeHint: "يوضح أين تغطي أزرار التطبيق ونصوصه الإطار — في المعاينة فقط وليس في الملف",
    safeOnlyStory: "لمقاس ٩:١٦",
    safeZones: { off: "إيقاف", tiktok: "تيك توك", reels: "ريلز", shorts: "شورتس", stories: "ستوري" } as Record<SafeZoneId | "off", string>,
    safeFit: "احتواء الجوال والعنوان داخل المنطقة الآمنة",
    zoneTop: "الشريط العلوي",
    zoneBottom: "الوصف والصوت",
    zoneBottomStories: "شريط الرد",
    zoneRail: "الأزرار",
    wm: "علامة مائية",
    wmHint: "شعارك أو اسم حسابك في زاوية كل إطار",
    wmText: "النص",
    wmTextDefault: "@yourbrand",
    wmCorner: "الزاوية",
    corners: { tl: "أعلى اليسار", tr: "أعلى اليمين", bl: "أسفل اليسار", br: "أسفل اليمين" } as Record<WatermarkCorner, string>,
    wmSize: "الحجم",
    wmOpacity: "العتامة",
    wmColor: "لون النص",
  },
};

type Copy = (typeof COPY)["en"];

/* ------------------------------------------------------------------ prefs */

interface Prefs {
  kind: OutputKind;
  preset: PresetId;
  size: PhoneSize;
  bg: BackgroundId;
  custom: string;
  fps: 30 | 60;
  quality: Quality;
  introMs: number;
  outroMs: number;
  sound: boolean;
  zoom: boolean;
  zoomLevel: ZoomIntensity;
  followSides: boolean;
  zoomOutEnd: boolean;
  imageFormat: ImageFormat;
  imageScale: 1 | 2 | 3;
  gifWidth: 360 | 480 | 640;
  gifFps: 10 | 12 | 15;
  gifCapMb: 5 | 10 | 15;
  notif: boolean;
  caption: boolean;
  captionText: string;
  captionPos: CaptionPosition;
  captionSize: CaptionSize;
  captionColor: string;
  captionPill: boolean;
  captionPillColor: string;
  endCard: boolean;
  endHeadline: string;
  endCta: string;
  endBg: string;
  endFg: string;
  endCtaBg: string;
  endCtaFg: string;
  endMs: 2000 | 3000 | 4000;
  music: boolean;
  musicVolume: number;
  musicFadeIn: number;
  musicFadeOut: number;
  musicLoop: boolean;
  speed: Speed;
  safeZone: SafeChoice;
  safeFit: boolean;
  wm: boolean;
  wmText: string;
  wmCorner: WatermarkCorner;
  wmSize: WatermarkSize;
  wmOpacity: number;
  wmColor: string;
  batch: boolean;
  /** "platform:device" keys picked for batch export */
  batchCombos: string[];
}

const DEFAULT_PREFS: Prefs = {
  kind: "video",
  preset: "story",
  size: "m",
  bg: "studio",
  custom: "#1e293b",
  fps: 30,
  quality: "high",
  introMs: 500,
  outroMs: 2000,
  sound: false,
  zoom: true,
  zoomLevel: "medium",
  followSides: true,
  zoomOutEnd: true,
  imageFormat: "png",
  imageScale: 2,
  gifWidth: 480,
  gifFps: 12,
  gifCapMb: 10,
  notif: false,
  caption: false,
  captionText: "",
  captionPos: "top",
  captionSize: "m",
  captionColor: "#ffffff",
  captionPill: false,
  captionPillColor: "#111827",
  endCard: false,
  endHeadline: "",
  endCta: "",
  endBg: "#0f172a",
  endFg: "#ffffff",
  endCtaBg: "#ffffff",
  endCtaFg: "#0f172a",
  endMs: 3000,
  music: true,
  musicVolume: 0.6,
  musicFadeIn: 500,
  musicFadeOut: 1500,
  musicLoop: true,
  speed: 1,
  safeZone: "off",
  safeFit: false,
  wm: false,
  wmText: "",
  wmCorner: "br",
  wmSize: "m",
  wmOpacity: 0.85,
  wmColor: "#ffffff",
  batch: false,
  batchCombos: [],
};

const DEVICES: Device[] = ["iphone", "android"];
const comboKey = (p: Platform, d: Device) => `${p}:${d}`;
const ALL_COMBOS = PLATFORMS.flatMap((p) => DEVICES.map((d) => comboKey(p.id, d)));
function parseCombo(key: string): { platform: Platform; device: Device } {
  const [platform, device] = key.split(":") as [Platform, Device];
  return { platform, device };
}

const PREFS_KEY = "scenora.export.prefs";
const INTRO_OPTIONS = [0, 500, 1000, 2000];
const OUTRO_OPTIONS = [1000, 2000, 3000, 5000];
const END_OPTIONS = [2000, 3000, 4000] as const;
const FADE_IN_OPTIONS = [0, 500, 1000, 2000];
const FADE_OUT_OPTIONS = [0, 1000, 1500, 3000];
const GIF_WIDTHS = [360, 480, 640] as const;
const GIF_FPS = [10, 12, 15] as const;
const GIF_CAPS = [5, 10, 15] as const;
const HEX = /^#[0-9a-f]{6}$/i;

function oneOf<T>(v: unknown, list: readonly T[], def: T): T {
  return list.includes(v as T) ? (v as T) : def;
}

function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
    const d = DEFAULT_PREFS;
    p.kind = oneOf(p.kind, ["video", "gif", "image"] as const, d.kind);
    if (!PRESETS.some((x) => x.id === p.preset)) p.preset = d.preset;
    if (!BACKGROUNDS.some((x) => x.id === p.bg)) p.bg = d.bg;
    p.size = oneOf(p.size, ["s", "m", "l"] as const, d.size);
    p.fps = oneOf(p.fps, [30, 60] as const, d.fps);
    p.quality = oneOf(p.quality, ["standard", "high", "max"] as const, d.quality);
    p.introMs = oneOf(p.introMs, INTRO_OPTIONS, d.introMs);
    p.outroMs = oneOf(p.outroMs, OUTRO_OPTIONS, d.outroMs);
    for (const k of ["custom", "captionColor", "captionPillColor", "endBg", "endFg", "endCtaBg", "endCtaFg", "wmColor"] as const) {
      if (typeof p[k] !== "string" || !HEX.test(p[k])) p[k] = d[k];
    }
    for (const k of ["sound", "zoom", "followSides", "zoomOutEnd", "notif", "caption", "captionPill", "endCard", "music", "musicLoop", "safeFit", "wm", "batch"] as const) {
      p[k] = !!p[k];
    }
    p.speed = oneOf(p.speed, SPEEDS, d.speed);
    p.safeZone = oneOf(p.safeZone, ["off", ...SAFE_ZONE_IDS] as const, d.safeZone);
    p.wmCorner = oneOf(p.wmCorner, ["tl", "tr", "bl", "br"] as const, d.wmCorner);
    p.wmSize = oneOf(p.wmSize, ["s", "m", "l"] as const, d.wmSize);
    p.wmOpacity = typeof p.wmOpacity === "number" ? Math.min(1, Math.max(0.2, p.wmOpacity)) : d.wmOpacity;
    p.wmText = typeof p.wmText === "string" ? p.wmText.slice(0, 60) : "";
    p.batchCombos = Array.isArray(p.batchCombos) ? p.batchCombos.filter((k) => ALL_COMBOS.includes(k)) : [];
    if (!(p.zoomLevel in ZOOM_LEVELS)) p.zoomLevel = d.zoomLevel;
    p.imageFormat = oneOf(p.imageFormat, ["png", "jpeg"] as const, d.imageFormat);
    p.imageScale = oneOf(p.imageScale, [1, 2, 3] as const, d.imageScale);
    p.gifWidth = oneOf(p.gifWidth, GIF_WIDTHS, d.gifWidth);
    p.gifFps = oneOf(p.gifFps, GIF_FPS, d.gifFps);
    p.gifCapMb = oneOf(p.gifCapMb, GIF_CAPS, d.gifCapMb);
    p.captionPos = oneOf(p.captionPos, ["top", "bottom"] as const, d.captionPos);
    p.captionSize = oneOf(p.captionSize, ["s", "m", "l"] as const, d.captionSize);
    p.endMs = oneOf(p.endMs, END_OPTIONS, d.endMs);
    p.musicFadeIn = oneOf(p.musicFadeIn, FADE_IN_OPTIONS, d.musicFadeIn);
    p.musicFadeOut = oneOf(p.musicFadeOut, FADE_OUT_OPTIONS, d.musicFadeOut);
    p.musicVolume = typeof p.musicVolume === "number" ? Math.min(1, Math.max(0, p.musicVolume)) : d.musicVolume;
    for (const k of ["captionText", "endHeadline", "endCta"] as const) {
      p[k] = typeof p[k] === "string" ? p[k].slice(0, 140) : "";
    }
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
  // keep the live stage's camera in step with the export settings
  syncLiveZoom(p);
}

/** Target bitrate: bits per pixel per frame, a bit less per frame at 60 fps. */
function bitrateFor(W: number, H: number, fps: number, q: Quality): number {
  const bpp = q === "standard" ? 0.12 : q === "high" ? 0.2 : 0.34;
  const temporal = fps > 30 ? 0.75 : 1;
  return Math.round(W * H * fps * bpp * temporal);
}

const CODEC_NAMES: Record<PickedCodec["id"], string> = { avc: "H.264", hevc: "HEVC (H.265)", vp9: "VP9", av1: "AV1" };

/* ---------------------------------------------------------------- helpers */

const AR_DIGITS = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

function fmtClock(ms: number, lang: Lang): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const str = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return lang === "ar" ? AR_DIGITS(str) : str;
}

/** m:ss.s */
function fmtMoment(ms: number, lang: Lang): string {
  const ds = Math.max(0, Math.floor(ms / 100));
  const s = Math.floor(ds / 10);
  const str = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}.${ds % 10}`;
  return lang === "ar" ? AR_DIGITS(str) : str;
}

function fmtMB(bytes: number, lang: Lang): string {
  const mb = bytes / 1_048_576;
  const v = mb < 10 ? mb.toFixed(1) : String(Math.round(mb));
  return lang === "ar" ? `${Number(v).toLocaleString("ar-EG")} م.ب` : `${v} MB`;
}

function makeView(scenario: Scenario, st: FrameState | null, clockMs?: number): PlaybackView {
  const noop = () => {};
  if (!st) {
    return {
      phase: "idle",
      isLive: false,
      messages: scenario.messages,
      typing: false,
      draft: null,
      keyboard: null,
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
    draft: st.draft,
    keyboard: st.keyboard,
    clockMs,
    statusOf: (m) => st.statuses.get(m.id) ?? m.status,
    play: noop,
    pause: noop,
    resume: noop,
    restart: noop,
    reset: noop,
  };
}

/** The first incoming message, as the lock-screen notification shows it. */
function noticeFor(scenario: Scenario, lang: Lang): (NoticeInfo & { id: string }) | null {
  const m = scenario.messages.find((x) => x.sender === "them");
  if (!m) return null;
  const caption = m.text.trim();
  const ar = lang === "ar";
  const body =
    m.type === "voice"
      ? ar
        ? "🎤 رسالة صوتية"
        : "🎤 Voice message"
      : m.type === "image"
        ? caption || (ar ? "📷 صورة" : "📷 Photo")
        : m.type === "sticker"
          ? caption || (ar ? "ملصق" : "Sticker")
          : m.type === "location"
            ? `📍 ${m.location?.title || (ar ? "موقع" : "Location")}`
            : m.type === "file"
              ? `📄 ${m.file?.name || (ar ? "مستند" : "Document")}`
              : m.type === "call"
                ? m.call?.missed
                  ? ar
                    ? m.call.video
                      ? "مكالمة فيديو فائتة"
                      : "مكالمة صوتية فائتة"
                    : m.call.video
                      ? "Missed video call"
                      : "Missed voice call"
                  : ar
                    ? "📞 مكالمة"
                    : "📞 Call"
                : m.type === "deleted"
                  ? ar
                    ? "تم حذف هذه الرسالة"
                    : "This message was deleted"
                  : caption;
  // groups: the banner is titled with the group and prefixes the sender
  const group = scenario.group ?? null;
  const author = group ? group.members[m.authorIndex ?? 0] ?? group.members[0] : null;
  return {
    id: m.id,
    platform: scenario.platform,
    device: scenario.device,
    theme: scenario.theme,
    lang,
    name: group ? group.name : scenario.them.name,
    avatar: group ? group.avatar : scenario.them.avatar,
    text: author ? `${author.name}: ${body}` : body,
  };
}

/** Time to show when previewing the notification intro: banner fully in. */
const NOTIF_PEEK_MS = NOTIF.inAt + NOTIF.inMs + 400;

interface LogoAsset {
  src: string;
  img: HTMLImageElement;
  w: number;
  h: number;
}

interface MusicAsset {
  name: string;
  buffer: AudioBuffer;
  url: string;
}

async function loadLogo(file: File): Promise<LogoAsset> {
  const src = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
  const img = new Image();
  img.src = src;
  await img.decode();
  return { src, img, w: img.naturalWidth || 512, h: img.naturalHeight || 512 };
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
  notice,
  controllerRef,
}: {
  scenario: Scenario;
  lang: Lang;
  rtl: boolean;
  notice: NoticeInfo | null;
  controllerRef: React.RefObject<StageController | null>;
}) {
  const [st, setSt] = useState<{ frame: FrameState | null; clock?: number; introT: number | null }>({
    frame: null,
    introT: null,
  });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    controllerRef.current = {
      node,
      render: (frame, clock, scene) => flushSync(() => setSt({ frame, clock, introT: scene?.introT ?? null })),
    };
    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef]);

  const view = useMemo(() => makeView(scenario, st.frame, st.clock), [scenario, st.frame, st.clock]);
  const screenH = DEVICE_SIZE[scenario.device].h;
  const showIntro = st.introT !== null && notice !== null;

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
          finish={scenario.deviceColor}
        >
          {/* the chat layer (transformed while the app opens out of the notification) */}
          <div style={{ position: "absolute", inset: 0, isolation: "isolate", ...introChatStyle(showIntro ? st.introT : null, scenario.device, screenH) }}>
            <PhoneScreen scenario={scenario} playback={view}>
              <PlatformView scenario={scenario} playback={view} lang={lang} rtl={rtl} />
            </PhoneScreen>
          </div>
          {showIntro && <NotificationIntro notice={notice} t={st.introT!} device={scenario.device} />}
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
  label,
}: {
  value: T;
  options: { value: T; label: string; disabled?: boolean; title?: string }[];
  onChange: (v: T) => void;
  attr: string;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.title}
            title={o.title}
            disabled={disabled || o.disabled}
            {...{ [`data-export-${attr}`]: String(o.value) }}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs font-medium tabular-nums transition-colors disabled:opacity-50",
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
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
        // geometry depends on the preset's aspect ratio (no utility class can express it)
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
      new ScreenBackdrop().paint(ctx, c.width, c.height, phone, phone.width * 0.86, phone.height * 0.9);
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

function Switch({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        on && !disabled ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-[inset-inline-start]",
          on && !disabled ? "start-[18px]" : "start-0.5",
        )}
      />
    </span>
  );
}

/** Bordered option card: a switch header and, when on, its settings. */
function ToggleCard({
  icon,
  title,
  hint,
  on,
  disabled,
  attr,
  onToggle,
  children,
  aside,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  on: boolean;
  disabled?: boolean;
  attr: string;
  onToggle: () => void;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const active = on && !disabled;
  return (
    <section className="rounded-xl border border-border">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          disabled={disabled}
          {...{ [`data-export-${attr}`]: active ? "on" : "off" }}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-start disabled:opacity-60"
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">{title}</span>
            <span className="block text-[11px] leading-snug text-muted-foreground">{hint}</span>
          </span>
          <Switch on={on} disabled={disabled} />
        </button>
        {aside}
      </div>
      {active && children && <div className="space-y-2.5 border-t border-border p-3">{children}</div>}
    </section>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  attr,
  dir,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  attr: string;
  dir: "rtl" | "ltr";
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={140}
        dir="auto"
        placeholder={placeholder}
        {...{ [`data-export-${attr}`]: "" }}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dir === "rtl" ? "text-right" : "text-left",
        )}
      />
    </label>
  );
}

function ColorField({ label, value, onChange, attr }: { label: string; value: string; onChange: (v: string) => void; attr: string }) {
  return (
    <label className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
      <input
        type="color"
        value={value}
        aria-label={label}
        {...{ [`data-export-${attr}`]: "" }}
        onChange={(e) => onChange(e.target.value)}
        className="size-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <span className="truncate text-[11px] text-muted-foreground">{label}</span>
    </label>
  );
}

/** Tiny looping illustration of the auto-zoom camera (pure CSS, no JS timers). */
function ZoomIllustration({ active }: { active: boolean }) {
  return (
    <span className="relative block h-[60px] w-[44px] shrink-0 overflow-hidden rounded-[9px] bg-foreground/[0.06] ring-1 ring-border" dir="ltr">
      <style>{`
        @keyframes scx-cam { 0%,12% { transform: translate(0,0) scale(1); }
          22%,40% { transform: translate(-7px,-3px) scale(1.55); }
          52%,70% { transform: translate(7px,-12px) scale(1.55); }
          82%,100% { transform: translate(0,0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { .scx-cam { animation: none !important; } }
      `}</style>
      <span
        className="scx-cam absolute inset-0 origin-center"
        // the animation only runs while the option is on
        style={{ animation: active ? "scx-cam 4.2s cubic-bezier(.45,0,.2,1) infinite" : "none" }}
      >
        <span className="absolute left-[5px] top-[30px] h-[7px] w-[20px] rounded-[3px] bg-muted-foreground/45" />
        <span className="absolute right-[5px] top-[39px] h-[7px] w-[22px] rounded-[3px] bg-primary/80" />
        <span className="absolute left-[5px] top-[48px] h-[7px] w-[16px] rounded-[3px] bg-muted-foreground/45" />
        <span className="absolute left-[5px] top-[18px] h-[7px] w-[24px] rounded-[3px] bg-muted-foreground/30" />
      </span>
    </span>
  );
}

function FileButton({
  label,
  accept,
  onFile,
  attr,
  icon,
}: {
  label: string;
  accept: string;
  onFile: (f: File) => void;
  attr: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
      {icon}
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        {...{ [`data-export-${attr}`]: "" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ dialog */

type Phase = "idle" | "rendering" | "done" | "error";

interface ExportResult {
  kind: OutputKind;
  file: File;
  url: string;
  W: number;
  H: number;
  tookMs: number;
  /** video / gif */
  fps?: number;
  durationMs?: number;
  frames?: number;
  codec?: PickedCodec;
  audio?: AudioCodec | null;
  soundRequested?: boolean;
  format?: ImageFormat;
}

interface Progress {
  done: number;
  total: number;
  etaMs: number | null;
  note?: string;
}

interface Prepared {
  r: FrameRenderer;
  tm: SceneTiming;
  W: number;
  H: number;
}

/** What one export renders: the scenario (platform/device of a batch item) and its paint. */
interface Job {
  sc: Scenario;
  paint: PaintOptions;
}

type ItemProgress = (done: number, total: number, note?: string) => void;

interface BatchItem {
  key: string;
  platform: Platform;
  device: Device;
  status: BatchStatus;
  /** 0–100 */
  pct: number;
  result: ExportResult | null;
  error: string;
}

/**
 * Preview-only guide: where the chosen app's UI covers a 9:16 frame. Sized
 * exactly like the preview canvas (same intrinsic size and constraints) and
 * stacked on top of it; the exported file never contains it.
 */
function SafeZoneOverlay({
  zone,
  W,
  H,
  width,
  height,
  labels,
}: {
  zone: (typeof SAFE_ZONES)[SafeZoneId];
  W: number;
  H: number;
  width: number;
  height: number;
  labels: { top: string; bottom: string; rail: string };
}) {
  const id = `sz${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const top = zone.top * H;
  const bottom = zone.bottom * H;
  const left = zone.left * W;
  const right = zone.right * W;
  const railTop = zone.rail ? zone.rail.top * H : 0;
  const fs = W * 0.03;
  const hatch = W * 0.022;
  const label = (x: number, y: number, text: string, anchor: "middle" | "end" = "middle") => (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontSize={fs}
      fontWeight={700}
      paintOrder="stroke"
      strokeWidth={fs * 0.22}
      className="fill-white stroke-black/60"
    >
      {text}
    </text>
  );
  return (
    <svg
      aria-hidden
      data-export-safezone-overlay={zone.id}
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      className="max-h-full max-w-full rounded-lg"
      // must match the preview canvas box exactly
      style={{ aspectRatio: `${W}/${H}` }}
    >
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={hatch} height={hatch} patternTransform="rotate(45)">
          <rect width={hatch} height={hatch} className="fill-destructive/20" />
          <line x1={0} y1={0} x2={0} y2={hatch} strokeWidth={hatch * 0.35} className="stroke-destructive/45" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={W} height={top} fill={`url(#${id})`} />
      <rect x={0} y={H - bottom} width={W} height={bottom} fill={`url(#${id})`} />
      {zone.rail && (
        <rect x={W - right} y={railTop} width={right} height={Math.max(0, H - bottom - railTop)} rx={right * 0.3} fill={`url(#${id})`} />
      )}
      <rect
        x={left}
        y={top}
        width={W - left - right}
        height={H - top - bottom}
        fill="none"
        strokeWidth={W * 0.004}
        strokeDasharray={`${W * 0.018} ${W * 0.012}`}
        className="stroke-white/90"
      />
      {label(W / 2, top / 2, labels.top)}
      {label(W / 2, H - bottom / 2, labels.bottom)}
      {zone.rail && (
        <g transform={`translate(${W - right / 2} ${(railTop + H - bottom) / 2}) rotate(-90)`}>{label(0, 0, labels.rail)}</g>
      )}
    </svg>
  );
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
  const c: Copy = COPY[lang];
  const [supported] = useState(canExportVideo);
  const [fontFamily] = useState(pageFontFamily);

  const [prefs, setPrefs] = useState<Prefs>(() => (typeof window === "undefined" ? DEFAULT_PREFS : loadPrefs()));
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0, etaMs: null });
  const [errKey, setErrKey] = useState<string>("");
  const [errDetail, setErrDetail] = useState("");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [device, setDevice] = useState<DeviceGeometry | null>(null);
  const [previewPhone, setPreviewPhone] = useState<{ canvas: HTMLCanvasElement; scale: number } | null>(null);
  const [audioCodec, setAudioCodec] = useState<AudioCodec | null | undefined>(undefined);
  const [logo, setLogo] = useState<LogoAsset | null>(null);
  const [logoErr, setLogoErr] = useState(false);
  const [music, setMusic] = useState<MusicAsset | null>(null);
  const [musicOffset, setMusicOffset] = useState(0);
  const [musicErr, setMusicErr] = useState(false);
  const [musicBusy, setMusicBusy] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [stillMs, setStillMs] = useState<number | null>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [momentBusy, setMomentBusy] = useState(false);
  /** what the off-screen stage renders (a batch swaps platform/device; the studio's scenario is never touched) */
  const [stageScenario, setStageScenario] = useState<Scenario>(scenario);
  const [wmLogo, setWmLogo] = useState<LogoAsset | null>(null);
  const [wmLogoErr, setWmLogoErr] = useState(false);
  /** items of the running / last batch (null = last run was a single export) */
  const [batch, setBatch] = useState<BatchItem[] | null>(null);
  const batchUrlsRef = useRef<string[]>([]);

  const stageRef = useRef<StageController | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const backdropRef = useRef<ScreenBackdrop | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const musicUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stageLock = useRef<Promise<unknown>>(Promise.resolve());
  const momentR = useRef<{ key: string; p: Prepared } | null>(null);

  const kind: OutputKind = !supported && prefs.kind === "video" ? "gif" : prefs.kind;

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
  }, []);

  // persist outside the state updater (it also updates the live stage store)
  const savedOnce = useRef(false);
  useEffect(() => {
    if (!savedOnce.current) {
      savedOnce.current = true;
      return;
    }
    savePrefs(prefs);
  }, [prefs]);

  /* ------------------------------------------------ derived settings */

  // stills pick a moment on the real-time timeline; video / GIF play at the chosen speed
  const speed: number = kind === "image" ? 1 : prefs.speed;
  const baseTimeline = useMemo(() => buildTimeline(scenario), [scenario]);
  const timeline: Timeline = useMemo(() => scaleTimeline(baseTimeline, speed), [baseTimeline, speed]);
  const notice = useMemo(() => noticeFor(scenario, lang), [scenario, lang]);
  const stageNotice = useMemo(() => noticeFor(stageScenario, lang), [stageScenario, lang]);
  const preset = PRESETS.find((p) => p.id === prefs.preset) ?? PRESETS[0];
  const zone = preset.id === "story" && prefs.safeZone !== "off" ? SAFE_ZONES[prefs.safeZone] : null;
  const fitZone = zone && prefs.safeFit ? zone : null;
  const currentKey = comboKey(scenario.platform, scenario.device);
  const batchKeys = prefs.batch ? ALL_COMBOS.filter((k) => prefs.batchCombos.includes(k)) : [];
  const batchOn = prefs.batch && batchKeys.length > 0;
  const bgDef = BACKGROUNDS.find((b) => b.id === prefs.bg) ?? BACKGROUNDS[0];
  const accent = PLATFORM_MAP[scenario.platform]?.accent ?? "#25d366";
  const paint = useMemo<PaintOptions>(() => ({ accent, custom: prefs.custom }), [accent, prefs.custom]);
  const notifOn = prefs.notif && !!notice;
  const captionAllowed = supportsCaption(preset);

  const caption = useMemo<CaptionConfig | null>(
    () =>
      prefs.caption && captionAllowed && prefs.captionText.trim()
        ? {
            text: prefs.captionText,
            position: prefs.captionPos,
            size: prefs.captionSize,
            color: prefs.captionColor,
            pill: prefs.captionPill ? prefs.captionPillColor : null,
            fontFamily,
            inset: fitZone ? { top: fitZone.top, bottom: fitZone.bottom } : null,
          }
        : null,
    [prefs.caption, captionAllowed, prefs.captionText, prefs.captionPos, prefs.captionSize, prefs.captionColor, prefs.captionPill, prefs.captionPillColor, fontFamily, fitZone],
  );
  const captionFrac = useMemo(
    () => captionBandFraction(caption, preset.w ?? 1080, preset.h ?? 1920),
    [caption, preset.w, preset.h],
  );
  // free area for the phone: minus the caption band, and inside the app's safe zone when fitting
  const reserve = useMemo(
    () => ({
      reserveTop: (fitZone?.top ?? 0) + (caption?.position === "top" ? captionFrac : 0),
      reserveBottom: (fitZone?.bottom ?? 0) + (caption?.position === "bottom" ? captionFrac : 0),
      reserveLeft: fitZone?.left ?? 0,
      reserveRight: fitZone?.right ?? 0,
    }),
    [caption, captionFrac, fitZone],
  );

  const watermark = useMemo<WatermarkConfig | null>(
    () =>
      prefs.wm && (prefs.wmText.trim() || wmLogo)
        ? {
            text: prefs.wmText,
            logo: wmLogo?.img ?? null,
            logoW: wmLogo?.w ?? 0,
            logoH: wmLogo?.h ?? 0,
            corner: prefs.wmCorner,
            opacity: prefs.wmOpacity,
            size: prefs.wmSize,
            color: prefs.wmColor,
            fontFamily,
            inset: fitZone ? safeInset(fitZone) : null,
          }
        : null,
    [prefs.wm, prefs.wmText, wmLogo, prefs.wmCorner, prefs.wmOpacity, prefs.wmSize, prefs.wmColor, fontFamily, fitZone],
  );

  const endCard = useMemo<EndCardConfig | null>(
    () =>
      prefs.endCard
        ? {
            logo: logo?.img ?? null,
            logoW: logo?.w ?? 0,
            logoH: logo?.h ?? 0,
            headline: prefs.endHeadline,
            cta: prefs.endCta,
            bg: prefs.endBg,
            fg: prefs.endFg,
            ctaBg: prefs.endCtaBg,
            ctaFg: prefs.endCtaFg,
            fontFamily,
          }
        : null,
    [prefs.endCard, logo, prefs.endHeadline, prefs.endCta, prefs.endBg, prefs.endFg, prefs.endCtaBg, prefs.endCtaFg, fontFamily],
  );

  const camera = useMemo<CameraOptions | null>(
    () =>
      prefs.zoom
        ? {
            maxZoom: ZOOM_LEVELS[prefs.zoomLevel],
            followSides: prefs.followSides,
            zoomOutAtEnd: prefs.zoomOutEnd,
            safeTop: reserve.reserveTop,
            safeBottom: reserve.reserveBottom,
            safeLeft: reserve.reserveLeft,
            safeRight: reserve.reserveRight,
          }
        : null,
    [prefs.zoom, prefs.zoomLevel, prefs.followSides, prefs.zoomOutEnd, reserve],
  );

  const layout = useMemo(
    () => computeLayout(preset, device ?? FALLBACK_DEVICE, prefs.size, reserve),
    [preset, device, prefs.size, reserve],
  );

  /** skip point for the notification intro (the announced message is on screen) */
  const skipFor = useCallback(
    (enterMs: number) => (notice ? (timeline.revealAt.get(notice.id) ?? 0) + enterMs + 40 : 0),
    [notice, timeline],
  );
  const timingFor = useCallback(
    (enterMs: number) =>
      sceneTiming({
        notif: notifOn,
        skipMs: skipFor(enterMs),
        introMs: prefs.introMs,
        contentMs: timeline.contentMs,
        outroMs: prefs.outroMs,
        endMs: prefs.endCard ? prefs.endMs : 0,
      }),
    [notifOn, skipFor, prefs.introMs, prefs.outroMs, prefs.endCard, prefs.endMs, timeline],
  );
  const enterMs = resolvePlatformMotion(scenario.platform, scenario.device).enterMs;
  const timing = useMemo(() => timingFor(enterMs), [timingFor, enterMs]);
  const totalMs = timing.totalMs;
  const finalMs = Math.max(0, timing.chatEnd - 1);
  const bitrate = bitrateFor(layout.W, layout.H, prefs.fps, prefs.quality);

  const gifFrames = Math.max(1, Math.round((totalMs / 1000) * prefs.gifFps));
  const gifCap = prefs.gifCapMb * 1_048_576;
  // shrink up front when the estimate is over the cap (a restart costs a full render)
  const gifW = fitGifWidth(Math.min(prefs.gifWidth, layout.W), layout.H / layout.W, gifFrames, prefs.zoom, gifCap);
  const gifH = Math.round((gifW * layout.H) / layout.W);

  // Preview canvas pixel size: long side 720px (crisp on HiDPI, cheap to paint).
  const pk = 720 / Math.max(layout.W, layout.H);
  const previewW = Math.round(layout.W * pk);
  const previewH = Math.round(layout.H * pk);

  /** output time shown in the preview instead of the static layout (null = layout) */
  const momentMs =
    kind === "image"
      ? Math.min(stillMs ?? finalMs, totalMs - 1)
      : peek === "intro" && notifOn
        ? NOTIF_PEEK_MS
        : peek === "end" && prefs.endCard
          ? totalMs - 1
          : null;

  /** everything that changes how a frame looks (moment previews are re-built when it changes) */
  const renderKey = JSON.stringify([
    prefs.preset,
    prefs.size,
    prefs.bg,
    prefs.custom,
    camera,
    caption,
    endCard && { ...endCard, logo: logo?.src.length ?? 0 },
    timing,
    device?.w,
    device?.h,
    speed,
    fitZone?.id ?? null,
    watermark && { ...watermark, logo: wmLogo?.src.length ?? 0 },
  ]);

  /* ------------------------------------------------------- lifecycle */

  /** serialise everything that drives the shared off-screen stage */
  const withStage = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = stageLock.current.then(fn, fn);
    stageLock.current = run.catch(() => undefined);
    return run;
  }, []);

  // One-time: settle fonts, snapshot the finished conversation for the live
  // layout preview (this also warms snapdom's font/style caches for export).
  useEffect(() => {
    let cancelled = false;
    void withStage(async () => {
      const ac = await pickAudioCodec();
      if (!cancelled) setAudioCodec(ac);
      await preloadPlatform(scenario.platform, scenario.device).catch(() => null);
      if (document.fonts?.ready) await document.fonts.ready;
      await yieldToEventLoop();
      const stage = stageRef.current;
      if (!stage || cancelled) return;
      stage.render(null);
      await waitForTemplate(stage);
      if (cancelled) return;
      stage.node.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => scrollChat(el, el.scrollHeight));
      await yieldToEventLoop();
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
    });
    return () => {
      cancelled = true;
    };
    // the dialog is mounted per export session; the scenario can't change underneath it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repaint the layout preview whenever a setting changes (not while rendering:
  // the renderer streams real frames into the same canvas then).
  useEffect(() => {
    if (phase === "rendering" || phase === "done" || momentMs !== null) return;
    const cv = previewRef.current;
    if (!cv) return;
    backdropRef.current ??= new ScreenBackdrop();
    paintPreview(cv, layout, bgDef, paint, previewPhone?.canvas ?? null, previewPhone?.scale ?? 1, backdropRef.current, caption, watermark);
  }, [layout, bgDef, paint, previewPhone, phase, previewW, previewH, momentMs, caption, watermark]);

  /** Build a renderer for the current settings at resolution `mul` (the stage must already show `job.sc`). */
  const prepare = useCallback(
    async (job: Job, mul: number, fps: number, maxCaptureSide?: number): Promise<Prepared> => {
      const stage = stageRef.current;
      if (!stage) throw new Error("generic");
      const mod = await preloadPlatform(job.sc.platform, job.sc.device);
      if (document.fonts?.ready) await document.fonts.ready;
      stage.render(null);
      await waitForTemplate(stage);
      // (a batch item's template may still be swapping in: let it mount and lay out)
      await yieldToEventLoop();
      stripOuterShadow(stage);
      const dims = measureDevice(stage);
      const lay = computeLayout(preset, dims, prefs.size, { mul, ...reserve });
      const tm = timingFor(mod.motion.enterMs);
      const r = new FrameRenderer({
        stage,
        timeline,
        motion: mod.motion,
        rtl,
        layout: lay,
        background: bgDef,
        paint: job.paint,
        fps,
        timing: tm,
        camera,
        endCard,
        caption,
        maxCaptureSide,
        speed,
        watermark,
      });
      await r.prepareCamera();
      return { r, tm, W: lay.W, H: lay.H };
    },
    [preset, prefs.size, reserve, timingFor, timeline, rtl, bgDef, camera, endCard, caption, speed, watermark],
  );
  const currentJob = useMemo<Job>(() => ({ sc: scenario, paint }), [scenario, paint]);

  const dropMomentRenderer = () => {
    momentR.current?.p.r.dispose();
    momentR.current = null;
  };

  /** Render one output moment into the preview canvas (image export / scene previews). */
  const renderMoment = useEffectEvent(async (ms: number, key: string, isCancelled: () => boolean) => {
    const mul = 720 / Math.max(layout.W, layout.H);
    if (momentR.current?.key !== key) {
      dropMomentRenderer();
      momentR.current = { key, p: await prepare(currentJob, mul, 30) };
    }
    if (isCancelled()) return;
    const { r } = momentR.current.p;
    r.seek();
    const frame = await r.renderAt(ms, true);
    const cv = previewRef.current;
    if (isCancelled() || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(frame, 0, 0, cv.width, cv.height);
  });

  useEffect(() => {
    if (momentMs === null || phase === "rendering" || phase === "done" || !device) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      setMomentBusy(true);
      void withStage(() => renderMoment(momentMs, renderKey, () => cancelled))
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setMomentBusy(false);
        });
    }, 140);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [momentMs, renderKey, phase, device, withStage, previewW, previewH]);

  // Abort on unmount; free URLs and renderers.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      for (const u of batchUrlsRef.current) URL.revokeObjectURL(u);
      if (musicUrlRef.current) URL.revokeObjectURL(musicUrlRef.current);
      momentR.current?.p.r.dispose();
      momentR.current = null;
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

  /* ------------------------------------------------------ uploads */

  const onLogo = async (f: File) => {
    setLogoErr(false);
    try {
      if (f.size > 8 * 1024 * 1024) throw new Error("too big");
      setLogo(await loadLogo(f));
    } catch {
      setLogoErr(true);
    }
  };

  const onWmLogo = async (f: File) => {
    setWmLogoErr(false);
    try {
      if (f.size > 8 * 1024 * 1024) throw new Error("too big");
      setWmLogo(await loadLogo(f));
    } catch {
      setWmLogoErr(true);
    }
  };

  const onMusic = async (f: File) => {
    setMusicErr(false);
    setMusicBusy(true);
    try {
      const buffer = await decodeMusic(f);
      if (musicUrlRef.current) URL.revokeObjectURL(musicUrlRef.current);
      const url = URL.createObjectURL(f);
      musicUrlRef.current = url;
      setMusicPlaying(false);
      setMusic({ name: f.name, buffer, url });
      setMusicOffset(0);
      if (!prefs.music) update({ music: true });
    } catch {
      setMusicErr(true);
    } finally {
      setMusicBusy(false);
    }
  };

  const removeMusic = () => {
    audioRef.current?.pause();
    setMusicPlaying(false);
    if (musicUrlRef.current) URL.revokeObjectURL(musicUrlRef.current);
    musicUrlRef.current = null;
    setMusic(null);
  };

  const toggleMusicPreview = () => {
    const el = audioRef.current;
    if (!el || !music) return;
    if (musicPlaying) {
      el.pause();
      setMusicPlaying(false);
      return;
    }
    el.currentTime = musicOffset;
    el.volume = prefs.musicVolume;
    void el.play().then(
      () => setMusicPlaying(true),
      () => setMusicPlaying(false),
    );
  };

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = prefs.musicVolume;
  }, [prefs.musicVolume]);

  const musicBed: MusicBed | null =
    music && prefs.music
      ? {
          buffer: music.buffer,
          offsetSec: musicOffset,
          volume: prefs.musicVolume,
          fadeInMs: prefs.musicFadeIn,
          fadeOutMs: prefs.musicFadeOut,
          loop: prefs.musicLoop,
        }
      : null;

  /* ------------------------------------------------------- export */

  const finishResult = (res: ExportResult) => {
    resultUrlRef.current = res.url;
    setResult(res);
    setPhase("done");
    if (!isTouchDevice()) downloadVideoFile(res.file);
  };

  /** Mirror a rendered frame into the dialog preview (letterboxed if a batch item's aspect differs). */
  const streamPreview = (src: HTMLCanvasElement) => {
    const pv = previewRef.current;
    const pctx = pv?.getContext("2d");
    if (!pv || !pctx || !src.width || !src.height) return;
    const k = Math.min(pv.width / src.width, pv.height / src.height);
    const w = src.width * k;
    const h = src.height * k;
    if (Math.abs(w - pv.width) > 1 || Math.abs(h - pv.height) > 1) pctx.clearRect(0, 0, pv.width, pv.height);
    pctx.drawImage(src, (pv.width - w) / 2, (pv.height - h) / 2, w, h);
  };

  const runVideo = async (job: Job, ctrl: AbortController, onProgress: ItemProgress, started: number): Promise<ExportResult> => {
    const { r, tm, W, H } = await prepare(job, 1, prefs.fps);
    try {
      const fps = prefs.fps;
      const totalFrames = Math.max(1, Math.round((tm.totalMs / 1000) * fps));
      const durMs = (totalFrames * 1000) / fps;
      const br = bitrateFor(W, H, fps, prefs.quality);
      const codec = await pickVideoCodec(W, H, fps, br);
      if (!codec) throw new Error("CODEC_UNSUPPORTED");

      let audio: { buffer: AudioBuffer; codec: AudioCodec } | null = null;
      if (prefs.sound || musicBed) {
        const ac = audioCodec ?? (await pickAudioCodec());
        if (ac) {
          const cues: SoundCue[] = [];
          if (prefs.sound) {
            if (tm.leadMs) cues.push({ at: NOTIF.inAt + 80, kind: "receive" });
            // reveal times are already on the speed-scaled timeline
            for (const rv of timeline.reveals) {
              if (tm.leadMs && rv.at <= tm.skipMs) continue;
              cues.push({ at: outputTimeOf(tm, rv.at), kind: rv.sender === "me" ? "send" : "receive" });
            }
          }
          audio = { buffer: await renderSoundTrack(cues, durMs, musicBed), codec: ac };
        }
      }
      if (ctrl.signal.aborted) throw new ExportAbortedError();

      let lastUi = 0;
      const blob = await exportToMp4({
        width: W,
        height: H,
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
          streamPreview(r.canvas);
          onProgress(done, total);
        },
      });

      if (process.env.NODE_ENV !== "production") {
        console.info(
          "[export] " +
            JSON.stringify({
              combo: `${job.sc.platform}:${job.sc.device}`,
              codec: codec.codec,
              audio: audio?.codec ?? null,
              music: !!musicBed,
              size: `${W}x${H}@${fps}`,
              frames: totalFrames,
              speed,
              captured: r.stats.captured,
              reused: r.stats.reused,
              cacheHits: r.stats.cacheHits,
              captureMul: Number(r.captureMul.toFixed(2)),
              zoom: prefs.zoom ? prefs.zoomLevel : "off",
              scenes: { notif: !!tm.leadMs, endCard: tm.endMs, caption: !!caption, watermark: !!watermark, safeFit: fitZone?.id ?? null },
              keyboards: timeline.keyboards.length,
              msPerCapture: Math.round(r.stats.captureMs / Math.max(1, r.stats.captured)),
              totalMs: Math.round(performance.now() - started),
              bytes: blob.size,
            }),
        );
      }

      const file = createExportFile(blob, job.sc.platform, job.sc.device, "mp4");
      return {
        kind: "video",
        file,
        url: URL.createObjectURL(file),
        codec,
        audio: audio?.codec ?? null,
        soundRequested: prefs.sound || !!musicBed,
        W,
        H,
        fps,
        frames: totalFrames,
        durationMs: durMs,
        tookMs: performance.now() - started,
      };
    } finally {
      r.dispose();
    }
  };

  const runGif = async (job: Job, ctrl: AbortController, onProgress: ItemProgress, started: number): Promise<ExportResult> => {
    const fps = prefs.gifFps;
    const cap = gifCap;
    let width = gifW;
    for (let attempt = 0; ; attempt++) {
      const { r, tm, W, H } = await prepare(job, width / layout.W, fps);
      try {
        const totalFrames = Math.max(1, Math.round((tm.totalMs / 1000) * fps));
        // read-back surface (CPU-backed: many getImageData calls)
        const rb = document.createElement("canvas");
        rb.width = W;
        rb.height = H;
        const rctx = rb.getContext("2d", { willReadFrequently: true });
        if (!rctx) throw new Error("CANVAS_UNAVAILABLE");
        const grab = (src: HTMLCanvasElement) => {
          rctx.drawImage(src, 0, 0);
          return rctx.getImageData(0, 0, W, H).data;
        };

        // one global palette from representative moments
        const chatSpan = tm.chatEnd - tm.leadMs;
        const sampleAt = [
          tm.leadMs ? NOTIF_PEEK_MS : 0,
          ...[0.3, 0.55, 0.8].map((f) => tm.leadMs + chatSpan * f),
          tm.chatEnd - 1,
          ...(tm.endMs ? [tm.chatEnd + Math.min(450, tm.endMs / 3), tm.totalMs - 1] : []),
        ];
        const samples: Uint8ClampedArray[] = [];
        for (const ms of sampleAt) {
          if (ctrl.signal.aborted) throw new ExportAbortedError();
          r.seek();
          samples.push(grab(await r.renderAt(Math.max(0, Math.min(ms, tm.totalMs - 1)), true)));
          await yieldToEventLoop();
        }
        const writer = new GifWriter(W, H, buildPalette(samples));
        samples.length = 0;
        r.seek();

        let lastUi = 0;
        let firstBytes = 0;
        let tooBig = 0;
        for (let i = 0; i < totalFrames; i++) {
          if (ctrl.signal.aborted) throw new ExportAbortedError();
          const frame = await r.frame(i);
          const delay = Math.round(((i + 1) * 100) / fps) - Math.round((i * 100) / fps);
          writer.addFrame(grab(frame), delay);
          if (i === 0) firstBytes = writer.size;
          if (i % 4 === 0) await yieldToEventLoop();
          // project the final size early; restart smaller instead of finishing a file that's too big
          if (attempt < 3 && i >= Math.max(10, totalFrames * 0.15)) {
            const projected = firstBytes + ((writer.size - firstBytes) / i) * (totalFrames - 1);
            if (projected > cap * 1.15) {
              tooBig = projected;
              break;
            }
          }
          const now = performance.now();
          if (now - lastUi > 120 || i === totalFrames - 1) {
            lastUi = now;
            streamPreview(frame);
            onProgress(i + 1, totalFrames);
          }
        }
        if (!tooBig) {
          const bytes = writer.finish();
          if (bytes.length > cap && attempt < 3) tooBig = bytes.length;
          else {
            if (process.env.NODE_ENV !== "production") {
              console.info(
                "[export] " +
                  JSON.stringify({
                    combo: `${job.sc.platform}:${job.sc.device}`,
                    gif: `${W}x${H}@${fps}`,
                    frames: totalFrames,
                    speed,
                    attempts: attempt + 1,
                    bytes: bytes.length,
                    totalMs: Math.round(performance.now() - started),
                  }),
              );
            }
            const blob = new Blob([bytes as BlobPart], { type: "image/gif" });
            const file = createExportFile(blob, job.sc.platform, job.sc.device, "gif");
            return {
              kind: "gif",
              file,
              url: URL.createObjectURL(file),
              W,
              H,
              fps,
              frames: totalFrames,
              durationMs: (totalFrames * 1000) / fps,
              tookMs: performance.now() - started,
            };
          }
        }
        width = Math.max(200, Math.round(width * Math.max(0.55, Math.sqrt(cap / tooBig) * 0.94)));
        onProgress(0, totalFrames, c.gifRetry);
      } finally {
        r.dispose();
      }
    }
  };

  const runImage = async (job: Job, started: number): Promise<ExportResult> => {
    const k = prefs.imageScale;
    const { r, tm, W, H } = await prepare(job, k, 30, 4096);
    try {
      r.seek();
      const at = Math.min(stillMs ?? tm.chatEnd - 1, tm.totalMs - 1);
      const frame = await r.renderAt(Math.max(0, at), true);
      streamPreview(frame);
      const jpeg = prefs.imageFormat === "jpeg";
      const blob = await new Promise<Blob | null>((res) => frame.toBlob(res, jpeg ? "image/jpeg" : "image/png", 0.92));
      if (!blob) throw new Error("IMAGE_FAILED");
      const file = createExportFile(blob, job.sc.platform, job.sc.device, jpeg ? "jpg" : "png");
      return {
        kind: "image",
        file,
        url: URL.createObjectURL(file),
        W,
        H,
        format: prefs.imageFormat,
        tookMs: performance.now() - started,
      };
    } finally {
      r.dispose();
    }
  };

  const renderJob = (job: Job, ctrl: AbortController, onProgress: ItemProgress, started: number): Promise<ExportResult> =>
    kind === "video"
      ? runVideo(job, ctrl, onProgress, started)
      : kind === "gif"
        ? runGif(job, ctrl, onProgress, started)
        : runImage(job, started);

  /**
   * Batch: the same scenario (and settings) for each platform × device, one
   * after another. Only the off-screen export stage switches app/phone; the
   * studio's own scenario is never modified. Returns how many succeeded.
   */
  const runBatch = async (keys: string[], ctrl: AbortController, started: number): Promise<number> => {
    const n = keys.length;
    const patch = (i: number, p: Partial<BatchItem>) =>
      setBatch((list) => (list ? list.map((it, j) => (j === i ? { ...it, ...p } : it)) : list));
    let ok = 0;
    for (let i = 0; i < n; i++) {
      if (ctrl.signal.aborted) break;
      const { platform, device } = parseCombo(keys[i]);
      const sc: Scenario = { ...scenario, platform, device };
      const job: Job = { sc, paint: { accent: PLATFORM_MAP[platform]?.accent ?? accent, custom: prefs.custom } };
      patch(i, { status: "rendering", pct: 0 });
      setProgress({ done: 0, total: 0, etaMs: null });
      const itemStart = performance.now();
      try {
        await preloadPlatform(platform, device);
        flushSync(() => setStageScenario(sc));
        const res = await renderJob(
          job,
          ctrl,
          (done, total, note) => {
            const f = total ? done / total : 0;
            const overall = (i + f) / n;
            const elapsed = performance.now() - started;
            const etaMs = overall > 0.03 && elapsed > 1500 ? (elapsed / overall) * (1 - overall) : null;
            patch(i, { pct: Math.min(99, Math.round(f * 100)) });
            setProgress((p) => ({ done, total, etaMs, note: note ?? p.note }));
          },
          itemStart,
        );
        batchUrlsRef.current.push(res.url);
        patch(i, { status: "done", pct: 100, result: res });
        if (!ok) setResult(res);
        ok++;
        // desktop: each file downloads as it finishes, named per app and phone
        if (!isTouchDevice()) downloadVideoFile(res.file);
      } catch (e) {
        if (e instanceof ExportAbortedError || ctrl.signal.aborted) {
          patch(i, { status: "cancelled", pct: 0 });
          break;
        }
        const msg = (e as Error)?.message ?? "";
        patch(i, { status: "error", error: c.errors[msg] ?? `${c.errors.generic}${msg ? ` (${msg})` : ""}` });
      }
    }
    // whatever never started was cancelled
    setBatch((list) => (list ? list.map((it) => (it.status === "pending" ? { ...it, status: "cancelled" } : it)) : list));
    return ok;
  };

  const runExport = async () => {
    const stage = stageRef.current;
    if (!stage || phase === "rendering") return;
    const keys = batchOn ? batchKeys : null;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    audioRef.current?.pause();
    setMusicPlaying(false);
    setPhase("rendering");
    setProgress({
      done: 0,
      total: kind === "video" ? Math.round((totalMs / 1000) * prefs.fps) : kind === "gif" ? gifFrames : 0,
      etaMs: null,
    });
    setErrKey("");
    setErrDetail("");
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    for (const u of batchUrlsRef.current) URL.revokeObjectURL(u);
    batchUrlsRef.current = [];
    setResult(null);
    setBatch(
      keys
        ? keys.map((key) => ({ key, ...parseCombo(key), status: "pending" as const, pct: 0, result: null, error: "" }))
        : null,
    );

    const started = performance.now();
    await withStage(async () => {
      dropMomentRenderer();
      try {
        if (!keys) {
          const res = await renderJob(
            currentJob,
            ctrl,
            (done, total, note) => {
              const elapsed = performance.now() - started;
              const etaMs = done / total > 0.04 && elapsed > 1500 ? (elapsed / done) * (total - done) : null;
              setProgress((p) => ({ done, total, etaMs, note: note ?? p.note }));
            },
            started,
          );
          finishResult(res);
        } else {
          const ok = await runBatch(keys, ctrl, started);
          if (ok > 0) setPhase("done");
          else if (ctrl.signal.aborted) setPhase("idle");
          else {
            setErrKey("generic");
            setPhase("error");
          }
        }
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
        if (abortRef.current === ctrl) abortRef.current = null;
        if (keys) {
          // back to the studio's own app and phone for the next preview / export
          flushSync(() => setStageScenario(scenario));
          await waitForTemplate(stage);
        }
        // back to the static, fully revealed thread for the next preview
        stageRef.current?.render(null);
      }
    });
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

  /* --------------------------------------------------------- view */

  const busy = phase === "rendering";
  const pct = progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
  const canShare = result ? canShareVideoFile(result.file) : false;
  const imgW = layout.W * prefs.imageScale;
  const imgH = layout.H * prefs.imageScale;
  const summary =
    kind === "video"
      ? `${layout.W}×${layout.H} · ${prefs.fps} fps · ${fmtClock(totalMs, lang)}`
      : kind === "gif"
        ? `${gifW}×${gifH} · ${prefs.gifFps} fps · ${fmtClock(totalMs, lang)}`
        : `${imgW}×${imgH} · ${prefs.imageFormat.toUpperCase()}`;
  const estimate =
    kind === "video"
      ? `~${fmtMB(estimateBytes(bitrate, totalMs, prefs.zoom) + (prefs.sound || musicBed ? (totalMs / 1000) * 16_000 : 0), lang)}`
      : kind === "gif"
        ? `~${fmtMB(Math.min(gifCap, estimateGifBytes(gifW, gifH, gifFrames, prefs.zoom)), lang)} · ${c.max(fmtMB(gifCap, lang))}`
        : `~${fmtMB(imgW * imgH * (prefs.imageFormat === "png" ? 1.1 : 0.2), lang)}`;
  const resultLabel = result
    ? result.kind === "image"
      ? c.download[result.format ?? "png"]
      : c.download[result.kind]
    : "";
  const sec = (ms: number) => c.sec(ms / 1000);

  const musicDur = music?.buffer.duration ?? 0;

  // batch
  const batchFiles = (batch ?? []).flatMap((it) => (it.result ? [it.result.file] : []));
  const batchPct = batch?.length
    ? Math.round(batch.reduce((s, it) => s + (it.status === "done" ? 100 : it.status === "rendering" ? it.pct : 0), 0) / batch.length)
    : 0;
  const batchIndex = batch ? batch.findIndex((it) => it.status === "rendering") : -1;
  const canShareAll = batchFiles.length > 0 && isTouchDevice() && canShareFiles(batchFiles);
  const shareAll = async () => {
    setSaving(true);
    try {
      await shareFiles(batchFiles);
    } finally {
      setSaving(false);
    }
  };
  const toggleCombo = (key: string) => {
    const cur = prefs.batchCombos;
    update({ batchCombos: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] });
  };
  const nBatch = prefs.batch ? batchKeys.length : 1;
  const pctLabel = (v: number) => (lang === "ar" ? `${v.toLocaleString("ar-EG")}٪` : `${v}%`);

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

        <div className="grid min-h-0 flex-1 overflow-y-auto md:h-[min(86dvh,720px)] md:flex-none md:grid-cols-[minmax(0,1fr)_380px] md:overflow-hidden">
          {/* preview */}
          <div className="relative flex h-[46dvh] flex-col bg-muted/50 p-4 md:h-auto md:min-h-0">
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 flex items-center justify-center">
                {phase === "done" && result ? (
                  result.kind === "video" ? (
                    <video
                      key={result.url}
                      src={result.url}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="max-h-full max-w-full rounded-lg bg-black shadow-lg"
                      // the element must keep the video's exact aspect ratio
                      style={{ aspectRatio: `${result.W}/${result.H}` }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- a local blob URL of the export; next/image can't optimise it
                    <img
                      key={result.url}
                      src={result.url}
                      alt={c.preview}
                      data-export-result=""
                      className="max-h-full max-w-full rounded-lg bg-black object-contain shadow-lg"
                    />
                  )
                ) : (
                  <canvas
                    ref={previewRef}
                    width={previewW}
                    height={previewH}
                    className={cn(
                      "max-h-full max-w-full rounded-lg shadow-lg ring-1 ring-black/5 transition-opacity",
                      (!previewPhone || momentBusy) && "animate-pulse",
                    )}
                    // the canvas must keep the output's exact aspect ratio
                    style={{ aspectRatio: `${layout.W}/${layout.H}` }}
                  />
                )}
              </div>
              {zone && phase !== "done" && phase !== "rendering" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <SafeZoneOverlay
                    zone={zone}
                    W={layout.W}
                    H={layout.H}
                    width={previewW}
                    height={previewH}
                    labels={{
                      top: c.zoneTop,
                      bottom: zone.id === "stories" ? c.zoneBottomStories : c.zoneBottom,
                      rail: c.zoneRail,
                    }}
                  />
                </div>
              )}
              {peek && momentMs !== null && kind !== "image" && phase !== "done" && phase !== "rendering" && (
                <button
                  type="button"
                  onClick={() => setPeek(null)}
                  className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium shadow ring-1 ring-border"
                >
                  {c.showing[peek]}
                  <X className="size-3" aria-hidden />
                  <span className="sr-only">{c.peekBack}</span>
                </button>
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground tabular-nums" dir="ltr">
              <span>
                {phase === "done" && result
                  ? `${result.W}×${result.H}${result.fps ? ` · ${result.fps} fps` : ""}`
                  : summary}
              </span>
              {preset.ratio && <span className="rounded bg-background px-1.5 py-0.5 ring-1 ring-border">{preset.ratio}</span>}
            </div>
          </div>

          {/* side panel */}
          <div className="flex flex-col border-t border-border md:min-h-0 md:border-s md:border-t-0">
            {phase === "rendering" && batch ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 p-6" data-export-batch-progress="">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    {c.rendering[kind]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {batchIndex >= 0 ? c.batchOf(batchIndex + 1, batch.length) : c.privacy}
                    {progress.note ? ` · ${progress.note}` : ""}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-semibold tabular-nums">{pctLabel(batchPct)}</span>
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
                    aria-valuenow={batchPct}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
                      // progress width is data-driven
                      style={{ width: `${batchPct}%` }}
                    />
                  </div>
                </div>
                <BatchList items={batch} c={c} pctLabel={pctLabel} />
                <Button variant="outline" className="w-full shrink-0" onClick={cancel} data-export-cancel="">
                  {c.cancel}
                </Button>
              </div>
            ) : phase === "rendering" ? (
              <div className="flex flex-1 flex-col justify-center gap-5 p-6">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    {c.rendering[kind]}
                  </p>
                  <p className="text-xs text-muted-foreground">{progress.note ?? c.privacy}</p>
                </div>
                {kind !== "image" && (
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
                        // progress width is data-driven
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">{c.frameOf(progress.done, progress.total)}</p>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={cancel} data-export-cancel="">
                  {c.cancel}
                </Button>
              </div>
            ) : phase === "done" && batch ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 p-6" data-export-done="batch">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <Check className="size-5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.batchDone(batchFiles.length, batch.length)}</p>
                    <p className="text-xs text-muted-foreground">{isTouchDevice() ? t.exportSaveHint : c.batchSaved}</p>
                  </div>
                </div>
                <BatchList
                  items={batch}
                  c={c}
                  pctLabel={pctLabel}
                  shown={result?.url ?? null}
                  onShow={(it) => it.result && setResult(it.result)}
                  onDownload={(it) => it.result && downloadVideoFile(it.result.file)}
                />
                <div className="mt-auto space-y-2">
                  {canShareAll && (
                    <Button className="h-11 w-full gap-2" onClick={() => void shareAll()} disabled={saving} data-export-share-all="">
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                      {c.shareAll}
                    </Button>
                  )}
                  <Button
                    variant={canShareAll ? "outline" : "default"}
                    className="h-11 w-full gap-2"
                    onClick={() => void downloadFiles(batchFiles)}
                    disabled={!batchFiles.length}
                    data-export-download-all=""
                  >
                    <Download className="size-4" />
                    {c.downloadAll}
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
            ) : phase === "done" && result ? (
              <div className="flex flex-1 flex-col gap-4 p-6" data-export-done={result.kind}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <Check className="size-5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.done[result.kind]}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {result.file.name}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {(result.kind === "video"
                    ? [
                        [c.duration, fmtClock(result.durationMs ?? 0, lang)],
                        [c.size, fmtMB(result.file.size, lang)],
                        [c.codec, `${CODEC_NAMES[result.codec!.id]}${result.audio ? ` + ${result.audio.toUpperCase()}` : ""}`],
                      ]
                    : result.kind === "gif"
                      ? [
                          [c.duration, fmtClock(result.durationMs ?? 0, lang)],
                          [c.size, fmtMB(result.file.size, lang)],
                          [c.dims, `${result.W}×${result.H}`],
                        ]
                      : [
                          [c.dims, `${result.W}×${result.H}`],
                          [c.size, fmtMB(result.file.size, lang)],
                          [c.imageType, (result.format ?? "png").toUpperCase()],
                        ]
                  ).map(([k, v], i) => (
                    <div key={i} className="rounded-lg bg-muted px-2 py-2">
                      <dt className="text-[10px] text-muted-foreground">{k}</dt>
                      <dd className="text-xs font-semibold tabular-nums" dir="ltr">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
                {result.kind === "video" && result.codec && result.codec.id !== "avc" && (
                  <p className="flex gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-4 shrink-0" />
                    {c.codecFallback(CODEC_NAMES[result.codec.id])}
                  </p>
                )}
                {result.kind === "video" && result.soundRequested && !result.audio && (
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
                    {resultLabel}
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
                <div className="space-y-5 p-5 md:min-h-0 md:flex-1 md:overflow-y-auto">
                  {phase === "error" && (
                    <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" data-export-error="">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <p>
                        {c.errors[errKey] ?? c.errors.generic}
                        {errDetail && (
                          <span className="block text-xs opacity-80" dir="ltr">
                            {errDetail}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  <Section title={c.output}>
                    <div role="radiogroup" aria-label={c.output} className="grid grid-cols-3 gap-1.5">
                      {(["video", "gif", "image"] as const).map((k) => {
                        const active = kind === k;
                        const off = k === "video" && !supported;
                        const Icon = k === "video" ? Film : k === "gif" ? Sparkles : ImageIcon;
                        return (
                          <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={off}
                            data-export-kind={k}
                            onClick={() => {
                              update({ kind: k });
                              setPeek(null);
                            }}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-start transition-colors disabled:opacity-50",
                              active
                                ? "border-primary bg-primary/[0.07]"
                                : "border-border hover:border-foreground/25",
                            )}
                          >
                            <span className={cn("flex items-center gap-1.5 text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                              <Icon className="size-3.5" aria-hidden />
                              {c.kinds[k]}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground">{c.kindHints[k]}</span>
                          </button>
                        );
                      })}
                    </div>
                    {!supported && <p className="text-[11px] text-muted-foreground">{c.videoOff}</p>}
                  </Section>

                  <ToggleCard
                    icon={<Layers className="size-4" />}
                    title={c.batch}
                    hint={c.batchHint}
                    on={prefs.batch}
                    attr="batch"
                    onToggle={() =>
                      update({
                        batch: !prefs.batch,
                        ...(!prefs.batch && !prefs.batchCombos.length ? { batchCombos: [currentKey] } : {}),
                      })
                    }
                    aside={
                      prefs.batch ? (
                        <span className="shrink-0 text-[11px] font-medium text-muted-foreground tabular-nums" data-export-batch-count="">
                          {c.batchCount(batchKeys.length)}
                        </span>
                      ) : null
                    }
                  >
                    <ComboGrid selected={prefs.batchCombos} current={currentKey} c={c} onToggle={toggleCombo} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => update({ batchCombos: [...ALL_COMBOS] })}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border hover:text-foreground"
                      >
                        {c.batchAll}
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ batchCombos: [currentKey] })}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border hover:text-foreground"
                      >
                        {c.batchCurrent}
                      </button>
                    </div>
                  </ToggleCard>

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
                              <span className="block truncate text-[10px] text-muted-foreground">{c.presets[p.id].hint}</span>
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
                        label={c.phoneSize}
                        value={prefs.size}
                        onChange={(v) => update({ size: v })}
                        options={(["s", "m", "l"] as PhoneSize[]).map((v) => ({ value: v, label: c.sizes[v] }))}
                      />
                    </Section>
                  )}

                  <section className="space-y-2.5 rounded-xl border border-border p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          zone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Scan className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{c.safe}</span>
                        <span className="block text-[11px] leading-snug text-muted-foreground">
                          {preset.id === "story" ? c.safeHint : c.safeOnlyStory}
                        </span>
                      </span>
                    </div>
                    <Segmented
                      attr="safe"
                      label={c.safe}
                      value={prefs.safeZone}
                      disabled={preset.id !== "story"}
                      onChange={(v) => update({ safeZone: v })}
                      options={(["off", ...SAFE_ZONE_IDS] as SafeChoice[]).map((v) => ({ value: v, label: c.safeZones[v] }))}
                    />
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground",
                        !zone && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 accent-[var(--primary)]"
                        checked={prefs.safeFit && !!zone}
                        disabled={!zone}
                        data-export-opt="safeFit"
                        onChange={(e) => update({ safeFit: e.target.checked })}
                      />
                      {c.safeFit}
                    </label>
                  </section>

                  <section className="space-y-2.5 rounded-xl border border-border p-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs.zoom}
                      data-export-zoom={prefs.zoom ? "on" : "off"}
                      onClick={() => update({ zoom: !prefs.zoom })}
                      className="flex w-full items-center gap-3 text-start"
                    >
                      <ZoomIllustration active={prefs.zoom} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{c.zoom}</span>
                        <span className="block text-[11px] leading-snug text-muted-foreground">{c.zoomHint}</span>
                      </span>
                      <Switch on={prefs.zoom} />
                    </button>
                    {prefs.zoom && (
                      <div className="space-y-2">
                        <Segmented
                          attr="zoomlevel"
                          label={c.zoom}
                          value={prefs.zoomLevel}
                          onChange={(v) => update({ zoomLevel: v })}
                          options={(["subtle", "medium", "strong"] as ZoomIntensity[]).map((v) => ({ value: v, label: c.zoomLevels[v] }))}
                        />
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {(
                            [
                              ["followSides", c.followSides],
                              ["zoomOutEnd", c.zoomOutEnd],
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key} className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                              <input
                                type="checkbox"
                                className="size-3.5 accent-[var(--primary)]"
                                checked={prefs[key]}
                                data-export-opt={key}
                                onChange={(e) => update({ [key]: e.target.checked })}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  {kind !== "image" && (
                    <Section
                      title={c.speed}
                      aside={
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Gauge className="size-3.5" aria-hidden />
                          {c.speedHint}
                        </span>
                      }
                    >
                      <Segmented
                        attr="speed"
                        label={c.speed}
                        value={prefs.speed}
                        onChange={(v) => update({ speed: v })}
                        options={SPEEDS.map((v) => ({ value: v, label: c.speedValue(v) }))}
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

                  <Section title={c.scenes}>
                    <div className="space-y-2">
                      <ToggleCard
                        icon={<BellRing className="size-4" />}
                        title={c.notif}
                        hint={notice ? c.notifHint : c.notifNone}
                        on={prefs.notif}
                        disabled={!notice}
                        attr="notif"
                        onToggle={() => {
                          const on = !prefs.notif;
                          update({ notif: on });
                          setPeek(on ? "intro" : null);
                        }}
                        aside={
                          notifOn && kind !== "image" ? (
                            <PeekButton active={peek === "intro"} label={c.peek} onClick={() => setPeek(peek === "intro" ? null : "intro")} attr="intro" />
                          ) : null
                        }
                      />

                      <ToggleCard
                        icon={<Captions className="size-4" />}
                        title={c.caption}
                        hint={captionAllowed ? c.captionHint : c.captionOnlyTall}
                        on={prefs.caption}
                        disabled={!captionAllowed}
                        attr="caption"
                        onToggle={() =>
                          update({
                            caption: !prefs.caption,
                            ...(!prefs.caption && !prefs.captionText.trim() ? { captionText: c.captionDefault } : {}),
                          })
                        }
                      >
                        <TextField
                          label={c.captionText}
                          value={prefs.captionText}
                          placeholder={c.captionDefault}
                          onChange={(v) => update({ captionText: v })}
                          attr="caption-text"
                          dir={rtl ? "rtl" : "ltr"}
                        />
                        <Row label={c.position}>
                          <Segmented
                            attr="caption-pos"
                            label={c.position}
                            value={prefs.captionPos}
                            onChange={(v) => update({ captionPos: v })}
                            options={(["top", "bottom"] as const).map((v) => ({ value: v, label: c.positions[v] }))}
                          />
                        </Row>
                        <Row label={c.textSize}>
                          <Segmented
                            attr="caption-size"
                            label={c.textSize}
                            value={prefs.captionSize}
                            onChange={(v) => update({ captionSize: v })}
                            options={(["s", "m", "l"] as const).map((v) => ({ value: v, label: c.sizes[v] }))}
                          />
                        </Row>
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField label={c.textColor} value={prefs.captionColor} onChange={(v) => update({ captionColor: v })} attr="caption-color" />
                          {prefs.captionPill ? (
                            <ColorField label={c.pillColor} value={prefs.captionPillColor} onChange={(v) => update({ captionPillColor: v })} attr="caption-pill-color" />
                          ) : (
                            <span />
                          )}
                        </div>
                        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            className="size-3.5 accent-[var(--primary)]"
                            checked={prefs.captionPill}
                            data-export-opt="captionPill"
                            onChange={(e) => update({ captionPill: e.target.checked })}
                          />
                          {c.pill}
                        </label>
                      </ToggleCard>

                      <ToggleCard
                        icon={<Sparkles className="size-4" />}
                        title={c.endCard}
                        hint={c.endHint}
                        on={prefs.endCard}
                        attr="endcard"
                        onToggle={() => {
                          const on = !prefs.endCard;
                          update({
                            endCard: on,
                            ...(on && !prefs.endHeadline.trim() && !prefs.endCta.trim()
                              ? { endHeadline: c.headlineDefault, endCta: c.ctaDefault }
                              : {}),
                          });
                          setPeek(on ? "end" : null);
                        }}
                        aside={
                          prefs.endCard && kind !== "image" ? (
                            <PeekButton active={peek === "end"} label={c.peek} onClick={() => setPeek(peek === "end" ? null : "end")} attr="end" />
                          ) : null
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-[88px] shrink-0 text-xs text-muted-foreground">{c.logo}</span>
                          {logo && (
                            // eslint-disable-next-line @next/next/no-img-element -- local data URL of the uploaded logo
                            <img src={logo.src} alt="" className="size-8 rounded-md bg-muted object-contain ring-1 ring-border" />
                          )}
                          <FileButton
                            label={logo ? c.replaceLogo : c.uploadLogo}
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            onFile={(f) => void onLogo(f)}
                            attr="logo-file"
                            icon={<Upload className="size-3.5" aria-hidden />}
                          />
                          {logo && (
                            <button type="button" onClick={() => setLogo(null)} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
                              {c.removeLogo}
                            </button>
                          )}
                        </div>
                        {logoErr && <p className="text-[11px] text-destructive">{c.logoError}</p>}
                        <TextField
                          label={c.headline}
                          value={prefs.endHeadline}
                          placeholder={c.headlineDefault}
                          onChange={(v) => update({ endHeadline: v })}
                          attr="headline"
                          dir={rtl ? "rtl" : "ltr"}
                        />
                        <TextField
                          label={c.cta}
                          value={prefs.endCta}
                          placeholder={c.ctaDefault}
                          onChange={(v) => update({ endCta: v })}
                          attr="cta"
                          dir={rtl ? "rtl" : "ltr"}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField label={c.colors.bg} value={prefs.endBg} onChange={(v) => update({ endBg: v })} attr="end-bg" />
                          <ColorField label={c.colors.fg} value={prefs.endFg} onChange={(v) => update({ endFg: v })} attr="end-fg" />
                          <ColorField label={c.colors.ctaBg} value={prefs.endCtaBg} onChange={(v) => update({ endCtaBg: v })} attr="end-cta-bg" />
                          <ColorField label={c.colors.ctaFg} value={prefs.endCtaFg} onChange={(v) => update({ endCtaFg: v })} attr="end-cta-fg" />
                        </div>
                        {kind !== "image" && (
                          <Row label={c.endLength}>
                            <Segmented
                              attr="endms"
                              label={c.endLength}
                              value={prefs.endMs}
                              onChange={(v) => update({ endMs: v })}
                              options={END_OPTIONS.map((v) => ({ value: v, label: sec(v) }))}
                            />
                          </Row>
                        )}
                      </ToggleCard>

                      <ToggleCard
                        icon={<Stamp className="size-4" />}
                        title={c.wm}
                        hint={c.wmHint}
                        on={prefs.wm}
                        attr="wm"
                        onToggle={() =>
                          update({
                            wm: !prefs.wm,
                            ...(!prefs.wm && !prefs.wmText.trim() && !wmLogo ? { wmText: c.wmTextDefault } : {}),
                          })
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-[88px] shrink-0 text-xs text-muted-foreground">{c.logo}</span>
                          {wmLogo && (
                            // eslint-disable-next-line @next/next/no-img-element -- local data URL of the uploaded logo
                            <img src={wmLogo.src} alt="" className="size-8 rounded-md bg-muted object-contain ring-1 ring-border" />
                          )}
                          <FileButton
                            label={wmLogo ? c.replaceLogo : c.uploadLogo}
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            onFile={(f) => void onWmLogo(f)}
                            attr="wm-logo-file"
                            icon={<Upload className="size-3.5" aria-hidden />}
                          />
                          {wmLogo && (
                            <button type="button" onClick={() => setWmLogo(null)} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
                              {c.removeLogo}
                            </button>
                          )}
                        </div>
                        {wmLogoErr && <p className="text-[11px] text-destructive">{c.logoError}</p>}
                        <TextField
                          label={c.wmText}
                          value={prefs.wmText}
                          placeholder={c.wmTextDefault}
                          onChange={(v) => update({ wmText: v.slice(0, 60) })}
                          attr="wm-text"
                          dir={rtl ? "rtl" : "ltr"}
                        />
                        <Row label={c.wmCorner}>
                          <Segmented
                            attr="wm-corner"
                            label={c.wmCorner}
                            value={prefs.wmCorner}
                            onChange={(v) => update({ wmCorner: v })}
                            options={(["tl", "tr", "bl", "br"] as const).map((v) => ({
                              value: v,
                              label: { tl: "↖", tr: "↗", bl: "↙", br: "↘" }[v],
                              title: c.corners[v],
                            }))}
                          />
                        </Row>
                        <Row label={c.wmSize}>
                          <Segmented
                            attr="wm-size"
                            label={c.wmSize}
                            value={prefs.wmSize}
                            onChange={(v) => update({ wmSize: v })}
                            options={(["s", "m", "l"] as const).map((v) => ({ value: v, label: c.sizes[v] }))}
                          />
                        </Row>
                        <label className="block space-y-1">
                          <span className="flex justify-between text-[11px] text-muted-foreground">
                            {c.wmOpacity}
                            <span className="tabular-nums">{pctLabel(Math.round(prefs.wmOpacity * 100))}</span>
                          </span>
                          <input
                            type="range"
                            min={0.2}
                            max={1}
                            step={0.05}
                            value={prefs.wmOpacity}
                            data-export-wm-opacity=""
                            onChange={(e) => update({ wmOpacity: Number(e.target.value) })}
                            className="w-full accent-[var(--primary)]"
                            dir="ltr"
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField label={c.wmColor} value={prefs.wmColor} onChange={(v) => update({ wmColor: v })} attr="wm-color" />
                        </div>
                      </ToggleCard>
                    </div>
                  </Section>

                  {kind === "image" && (
                    <Section title={c.imageSettings}>
                      <div className="space-y-2">
                        <Row label={c.imageType}>
                          <Segmented
                            attr="imgformat"
                            label={c.imageType}
                            value={prefs.imageFormat}
                            onChange={(v) => update({ imageFormat: v })}
                            options={[
                              { value: "png" as const, label: "PNG" },
                              { value: "jpeg" as const, label: "JPEG" },
                            ]}
                          />
                        </Row>
                        <Row label={c.resolution}>
                          <Segmented
                            attr="imgscale"
                            label={c.resolution}
                            value={prefs.imageScale}
                            onChange={(v) => update({ imageScale: v })}
                            options={([1, 2, 3] as const).map((v) => ({ value: v, label: `${v}×` }))}
                          />
                        </Row>
                        <div className="space-y-1.5 rounded-lg border border-border p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <label htmlFor="export-moment" className="text-xs text-muted-foreground">
                              {c.moment}
                            </label>
                            <span className="text-[11px] font-medium tabular-nums">{fmtMoment(stillMs ?? finalMs, lang)}</span>
                          </div>
                          <input
                            id="export-moment"
                            type="range"
                            min={0}
                            max={Math.max(1, totalMs - 1)}
                            step={10}
                            value={Math.min(stillMs ?? finalMs, totalMs - 1)}
                            data-export-moment=""
                            onChange={(e) => setStillMs(Number(e.target.value))}
                            className="w-full accent-[var(--primary)]"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setStillMs(null)}
                            aria-pressed={stillMs === null}
                            data-export-final=""
                            className={cn(
                              "rounded-md px-2 py-1 text-[11px] font-medium ring-1",
                              stillMs === null ? "bg-primary/10 text-primary ring-primary/30" : "text-muted-foreground ring-border hover:text-foreground",
                            )}
                          >
                            {c.finalFrame}
                          </button>
                        </div>
                      </div>
                    </Section>
                  )}

                  {kind === "gif" && (
                    <Section title={c.gifSettings} aside={<span className="text-[11px] text-muted-foreground">{c.gifHint}</span>}>
                      <div className="space-y-2">
                        <Row label={c.gifWidth}>
                          <Segmented
                            attr="gifwidth"
                            label={c.gifWidth}
                            value={prefs.gifWidth}
                            onChange={(v) => update({ gifWidth: v })}
                            options={GIF_WIDTHS.map((v) => ({ value: v, label: lang === "ar" ? AR_DIGITS(String(v)) : String(v) }))}
                          />
                        </Row>
                        <Row label={c.gifFps}>
                          <Segmented
                            attr="giffps"
                            label={c.gifFps}
                            value={prefs.gifFps}
                            onChange={(v) => update({ gifFps: v })}
                            options={GIF_FPS.map((v) => ({ value: v, label: lang === "ar" ? AR_DIGITS(String(v)) : String(v) }))}
                          />
                        </Row>
                        <Row label={c.gifCap}>
                          <Segmented
                            attr="gifcap"
                            label={c.gifCap}
                            value={prefs.gifCapMb}
                            onChange={(v) => update({ gifCapMb: v })}
                            options={GIF_CAPS.map((v) => ({ value: v, label: fmtMB(v * 1_048_576, lang) }))}
                          />
                        </Row>
                        <Row label={c.intro}>
                          <Segmented
                            attr="intro"
                            label={c.intro}
                            value={prefs.introMs}
                            onChange={(v) => update({ introMs: v })}
                            options={INTRO_OPTIONS.map((v) => ({ value: v, label: sec(v) }))}
                          />
                        </Row>
                        <Row label={c.outro}>
                          <Segmented
                            attr="outro"
                            label={c.outro}
                            value={prefs.outroMs}
                            onChange={(v) => update({ outroMs: v })}
                            options={OUTRO_OPTIONS.map((v) => ({ value: v, label: sec(v) }))}
                          />
                        </Row>
                      </div>
                    </Section>
                  )}

                  {kind === "video" && (
                    <>
                      <Section title={c.timing}>
                        <div className="space-y-2">
                          <Row label={c.fps}>
                            <Segmented
                              attr="fps"
                              label={c.fps}
                              value={prefs.fps}
                              onChange={(v) => update({ fps: v })}
                              options={[
                                { value: 30 as const, label: lang === "ar" ? "٣٠" : "30" },
                                { value: 60 as const, label: lang === "ar" ? "٦٠" : "60" },
                              ]}
                            />
                          </Row>
                          <Row label={c.quality}>
                            <Segmented
                              attr="quality"
                              label={c.quality}
                              value={prefs.quality}
                              onChange={(v) => update({ quality: v })}
                              options={(["standard", "high", "max"] as Quality[]).map((v) => ({ value: v, label: c.qualities[v] }))}
                            />
                          </Row>
                          <Row label={c.intro}>
                            <Segmented
                              attr="intro"
                              label={c.intro}
                              value={prefs.introMs}
                              onChange={(v) => update({ introMs: v })}
                              options={INTRO_OPTIONS.map((v) => ({ value: v, label: sec(v) }))}
                            />
                          </Row>
                          <Row label={c.outro}>
                            <Segmented
                              attr="outro"
                              label={c.outro}
                              value={prefs.outroMs}
                              onChange={(v) => update({ outroMs: v })}
                              options={OUTRO_OPTIONS.map((v) => ({ value: v, label: sec(v) }))}
                            />
                          </Row>
                        </div>
                      </Section>

                      <Section title={c.audio}>
                        <div className="space-y-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={prefs.sound && !!audioCodec}
                            disabled={audioCodec === null}
                            data-export-sound={prefs.sound ? "on" : "off"}
                            onClick={() => update({ sound: !prefs.sound })}
                            className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-start transition-colors hover:bg-muted/60 disabled:opacity-60"
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
                            <Switch on={prefs.sound && !!audioCodec} />
                          </button>

                          <ToggleCard
                            icon={<Music className="size-4" />}
                            title={c.music}
                            hint={audioCodec === null ? c.soundUnsupported : music ? music.name : c.musicHint}
                            on={prefs.music && !!music}
                            disabled={audioCodec === null || !music}
                            attr="music"
                            onToggle={() => update({ music: !prefs.music })}
                            aside={
                              audioCodec === null ? null : (
                                <FileButton
                                  label={music ? c.replaceMusic : c.chooseMusic}
                                  accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,.mp3,.m4a,.wav,.ogg"
                                  onFile={(f) => void onMusic(f)}
                                  attr="music-file"
                                  icon={musicBusy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
                                />
                              )
                            }
                          >
                            {music && (
                              <>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={toggleMusicPreview}
                                    aria-label={musicPlaying ? c.stop : c.play}
                                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                  >
                                    {musicPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                                  </button>
                                  <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground" dir="ltr">
                                    {music.name} · {fmtClock(musicDur * 1000, "en")}
                                  </span>
                                  <button type="button" onClick={removeMusic} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
                                    {c.removeMusic}
                                  </button>
                                </div>
                                <label className="block space-y-1">
                                  <span className="flex justify-between text-[11px] text-muted-foreground">
                                    {c.trimStart}
                                    <span className="tabular-nums">{fmtMoment(musicOffset * 1000, lang)}</span>
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={Math.max(0, Math.floor((musicDur - 0.5) * 10) / 10)}
                                    step={0.1}
                                    value={musicOffset}
                                    data-export-music-trim=""
                                    onChange={(e) => setMusicOffset(Number(e.target.value))}
                                    className="w-full accent-[var(--primary)]"
                                    dir="ltr"
                                  />
                                </label>
                                <label className="block space-y-1">
                                  <span className="flex justify-between text-[11px] text-muted-foreground">
                                    {c.volume}
                                    <span className="tabular-nums">
                                      {lang === "ar" ? `${Math.round(prefs.musicVolume * 100).toLocaleString("ar-EG")}٪` : `${Math.round(prefs.musicVolume * 100)}%`}
                                    </span>
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={prefs.musicVolume}
                                    data-export-music-volume=""
                                    onChange={(e) => update({ musicVolume: Number(e.target.value) })}
                                    className="w-full accent-[var(--primary)]"
                                    dir="ltr"
                                  />
                                </label>
                                <Row label={c.fadeIn}>
                                  <Segmented
                                    attr="fadein"
                                    label={c.fadeIn}
                                    value={prefs.musicFadeIn}
                                    onChange={(v) => update({ musicFadeIn: v })}
                                    options={FADE_IN_OPTIONS.map((v) => ({ value: v, label: sec(v) }))}
                                  />
                                </Row>
                                <Row label={c.fadeOut}>
                                  <Segmented
                                    attr="fadeout"
                                    label={c.fadeOut}
                                    value={prefs.musicFadeOut}
                                    onChange={(v) => update({ musicFadeOut: v })}
                                    options={FADE_OUT_OPTIONS.map((v) => ({ value: v, label: sec(v) }))}
                                  />
                                </Row>
                                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    className="size-3.5 accent-[var(--primary)]"
                                    checked={prefs.musicLoop}
                                    data-export-opt="musicLoop"
                                    onChange={(e) => update({ musicLoop: e.target.checked })}
                                  />
                                  {c.loop}
                                </label>
                              </>
                            )}
                          </ToggleCard>
                          {musicErr && <p className="text-[11px] text-destructive">{c.musicError}</p>}
                          {music && (
                            <audio ref={audioRef} src={music.url} preload="auto" onEnded={() => setMusicPlaying(false)} className="hidden" />
                          )}
                        </div>
                      </Section>
                    </>
                  )}
                </div>

                <div className="sticky bottom-0 space-y-2 border-t border-border bg-background p-4 md:static">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground tabular-nums">
                    <span dir="ltr">{summary}</span>
                    <span data-export-estimate="">
                      {estimate}
                      {prefs.batch && nBatch > 1 ? ` × ${lang === "ar" ? nBatch.toLocaleString("ar-EG") : nBatch}` : ""}
                    </span>
                  </div>
                  <Button
                    className="h-11 w-full gap-2 text-sm"
                    onClick={runExport}
                    disabled={!device || (prefs.batch && !batchKeys.length)}
                    data-export-start=""
                  >
                    {device ? (prefs.batch ? <Layers className="size-4" /> : <Download className="size-4" />) : <Loader2 className="size-4 animate-spin" />}
                    {prefs.batch ? c.startBatch(kind, batchKeys.length) : c.start[kind]}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">{c.privacy}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ExportStage scenario={stageScenario} lang={lang} rtl={rtl} notice={stageNotice} controllerRef={stageRef} />
    </div>
  );
}

/** Per-item status of a batch export (progress while rendering, actions when done). */
function BatchList({
  items,
  c,
  pctLabel,
  shown,
  onShow,
  onDownload,
}: {
  items: BatchItem[];
  c: Copy;
  pctLabel: (v: number) => string;
  /** url of the result currently in the preview */
  shown?: string | null;
  onShow?: (it: BatchItem) => void;
  onDownload?: (it: BatchItem) => void;
}) {
  return (
    <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto" data-export-batch-list="">
      {items.map((it) => {
        const active = !!it.result && it.result.url === shown;
        return (
          <li
            key={it.key}
            data-export-item={it.key}
            data-status={it.status}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5",
              active ? "border-primary bg-primary/[0.06]" : "border-border",
            )}
          >
            <PlatformMark platform={it.platform} device={it.device} size={22} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {PLATFORM_MAP[it.platform]?.label ?? it.platform} · {c.devices[it.device]}
              </span>
              <span
                className={cn(
                  "block truncate text-[11px]",
                  it.status === "error" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {it.status === "rendering" ? `${c.itemStatus.rendering} · ${pctLabel(it.pct)}` : it.status === "error" && it.error ? it.error : c.itemStatus[it.status]}
              </span>
            </span>
            {it.status === "done" ? (
              <CircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : it.status === "rendering" ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
            ) : it.status === "error" ? (
              <CircleX className="size-4 shrink-0 text-destructive" aria-hidden />
            ) : (
              <CircleDashed className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            {it.result && onShow && (
              <button
                type="button"
                onClick={() => onShow(it)}
                aria-pressed={active}
                aria-label={`${c.showItem}: ${PLATFORM_MAP[it.platform]?.label ?? it.platform} ${c.devices[it.device]}`}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Play className="size-3.5" aria-hidden />
              </button>
            )}
            {it.result && onDownload && (
              <button
                type="button"
                onClick={() => onDownload(it)}
                data-export-item-download={it.key}
                aria-label={`${c.downloadOne}: ${it.result.file.name}`}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Download className="size-3.5" aria-hidden />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Platform × device checkbox grid for batch export. */
function ComboGrid({
  selected,
  current,
  c,
  onToggle,
  disabled,
}: {
  selected: string[];
  current: string;
  c: Copy;
  onToggle: (key: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border" role="group" aria-label={c.batch}>
      <div className="grid grid-cols-[minmax(0,1fr)_64px_64px] items-center bg-muted/60 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
        <span>{c.app}</span>
        {DEVICES.map((d) => (
          <span key={d} className="text-center">
            {c.devices[d]}
          </span>
        ))}
      </div>
      <ul className="max-h-[220px] divide-y divide-border overflow-y-auto">
        {PLATFORMS.map((p) => (
          <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_64px_64px] items-center px-2.5 py-1">
            <span className="flex min-w-0 items-center gap-2">
              <PlatformMark platform={p.id} device="iphone" size={20} />
              <span className="truncate text-xs font-medium">{p.label}</span>
            </span>
            {DEVICES.map((d) => {
              const key = comboKey(p.id, d);
              const on = selected.includes(key);
              return (
                <label key={d} className="flex h-7 cursor-pointer items-center justify-center" title={`${p.label} · ${c.devices[d]}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    data-export-combo={key}
                    aria-label={`${p.label} · ${c.devices[d]}`}
                    onChange={() => onToggle(key)}
                    className={cn("size-4 accent-[var(--primary)]", key === current && "ring-2 ring-primary/40 ring-offset-1 ring-offset-background")}
                  />
                </label>
              );
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PeekButton({ active, label, onClick, attr }: { active: boolean; label: string; onClick: () => void; attr: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-export-peek={attr}
      className={cn(
        "shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ring-1",
        active ? "bg-primary/10 text-primary ring-primary/30" : "text-muted-foreground ring-border hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
