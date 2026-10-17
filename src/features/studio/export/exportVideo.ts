import { ArrayBufferTarget, Muxer } from "mp4-muxer";

import { encodeAudio, type AudioCodec } from "./audio";

/** Whether this browser can encode video entirely in the page (Chrome/Edge/Safari 16.4+/Firefox 130+). */
export function canExportVideo(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "function" &&
    typeof (window as unknown as { VideoFrame?: unknown }).VideoFrame === "function"
  );
}

export type VideoCodecId = "avc" | "hevc" | "vp9" | "av1";

export interface PickedCodec {
  id: VideoCodecId;
  /** full WebCodecs codec string, e.g. avc1.640028 */
  codec: string;
}

/* ------------------------------------------------------------------ codecs */

// H.264 levels (Table A-1): max frame size in macroblocks, max MB/s, max High-profile bitrate (kbps)
const AVC_LEVELS: { hex: string; fs: number; mbps: number; br: number }[] = [
  { hex: "1f", fs: 3600, mbps: 108_000, br: 17_500 }, // 3.1
  { hex: "20", fs: 5120, mbps: 216_000, br: 25_000 }, // 3.2
  { hex: "28", fs: 8192, mbps: 245_760, br: 25_000 }, // 4.0
  { hex: "29", fs: 8192, mbps: 245_760, br: 62_500 }, // 4.1
  { hex: "2a", fs: 8704, mbps: 522_240, br: 62_500 }, // 4.2
  { hex: "32", fs: 22_080, mbps: 589_824, br: 168_750 }, // 5.0
  { hex: "33", fs: 36_864, mbps: 983_040, br: 300_000 }, // 5.1
  { hex: "34", fs: 36_864, mbps: 2_073_600, br: 300_000 }, // 5.2
];

/** Lowest H.264 levels that fit this resolution/fps/bitrate (lowest first). */
function avcLevels(width: number, height: number, fps: number, bitrate: number): string[] {
  const fs = Math.ceil(width / 16) * Math.ceil(height / 16);
  const mbps = fs * fps;
  const ok = AVC_LEVELS.filter((l) => l.fs >= fs && l.mbps >= mbps && l.br * 1000 >= bitrate).map((l) => l.hex);
  return ok.length ? ok.slice(0, 3) : ["33", "34"];
}

function candidates(width: number, height: number, fps: number, bitrate: number): PickedCodec[] {
  const levels = avcLevels(width, height, fps, bitrate);
  const list: PickedCodec[] = [];
  // High → Main → Constrained Baseline
  for (const profile of ["6400", "4d40", "42e0"]) {
    for (const lv of levels) list.push({ id: "avc", codec: `avc1.${profile}${lv}` });
  }
  const hi = fps > 30 || width * height > 2_100_000;
  list.push({ id: "hevc", codec: hi ? "hvc1.1.6.L153.B0" : "hvc1.1.6.L123.B0" });
  list.push({ id: "hevc", codec: "hvc1.1.6.L153.B0" });
  list.push({ id: "vp9", codec: hi ? "vp09.00.41.08" : "vp09.00.40.08" });
  list.push({ id: "vp9", codec: "vp09.00.51.08" });
  list.push({ id: "av1", codec: hi ? "av01.0.09M.08" : "av01.0.08M.08" });
  return list;
}

function baseConfig(c: PickedCodec, width: number, height: number, fps: number, bitrate: number): VideoEncoderConfig {
  const cfg: VideoEncoderConfig = {
    codec: c.codec,
    width,
    height,
    bitrate,
    framerate: fps,
    bitrateMode: "variable",
    latencyMode: "quality",
  };
  if (c.id === "avc") (cfg as VideoEncoderConfig & { avc: { format: "avc" } }).avc = { format: "avc" };
  if (c.id === "hevc") (cfg as VideoEncoderConfig & { hevc: { format: "hevc" } }).hevc = { format: "hevc" };
  return cfg;
}

/** Pick the best codec this browser can encode at these settings (H.264 High first). */
export async function pickVideoCodec(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
): Promise<PickedCodec | null> {
  if (!canExportVideo()) return null;
  for (const c of candidates(width, height, fps, bitrate)) {
    try {
      const s = await VideoEncoder.isConfigSupported(baseConfig(c, width, height, fps, bitrate));
      if (s.supported) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

/* ----------------------------------------------------------------- encoding */

export interface ExportOptions {
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  bitrate: number;
  /** keyframe interval in seconds (social platforms re-encode; 1–2 s is ideal) */
  keyframeSeconds?: number;
  codec: PickedCodec;
  /** Produce the rasterised frame. Must match width×height. */
  drawFrame: (frameIndex: number) => Promise<CanvasImageSource>;
  audio?: { buffer: AudioBuffer; codec: AudioCodec } | null;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

export class ExportAbortedError extends Error {
  constructor() {
    super("ABORTED");
    this.name = "ExportAbortedError";
  }
}

export async function exportToMp4(opts: ExportOptions): Promise<Blob> {
  const { width, height, fps, totalFrames, bitrate, codec, drawFrame, onProgress, signal } = opts;
  if (!canExportVideo()) throw new Error("VIDEO_UNSUPPORTED");
  if (width % 2 || height % 2) throw new Error("ODD_DIMENSIONS");

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: codec.id, width, height, frameRate: fps },
    audio: opts.audio
      ? { codec: opts.audio.codec, numberOfChannels: opts.audio.buffer.numberOfChannels, sampleRate: opts.audio.buffer.sampleRate }
      : undefined,
    fastStart: "in-memory",
  });

  // Audio first: it is small and fully known up front.
  if (opts.audio) {
    await encodeAudio(opts.audio.buffer, opts.audio.codec, (chunk, meta) => muxer.addAudioChunk(chunk, meta));
  }

  let encodeError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encodeError = e;
    },
  });
  encoder.configure(baseConfig(codec, width, height, fps, bitrate));

  const gop = Math.max(1, Math.round(fps * (opts.keyframeSeconds ?? 1)));
  const ts = (i: number) => Math.round((i * 1_000_000) / fps);

  const waitForDrain = () =>
    new Promise<void>((resolve) => {
      const onDequeue = () => {
        if (encoder.encodeQueueSize <= 2 || encoder.state !== "configured") {
          encoder.removeEventListener("dequeue", onDequeue);
          resolve();
        }
      };
      encoder.addEventListener("dequeue", onDequeue);
      onDequeue();
    });

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new ExportAbortedError();
      if (encodeError) throw encodeError;

      const source = await drawFrame(i);
      if (signal?.aborted) throw new ExportAbortedError();

      const frame = new VideoFrame(source, { timestamp: ts(i), duration: ts(i + 1) - ts(i), alpha: "discard" });
      try {
        encoder.encode(frame, { keyFrame: i % gop === 0 });
      } finally {
        frame.close();
      }
      onProgress?.(i + 1, totalFrames);

      // Back-pressure: keep at most a few frames queued so memory stays flat.
      // Uses the encoder's "dequeue" event (not a timer) so it isn't throttled
      // when the tab is in the background.
      if (encoder.encodeQueueSize > 4) await waitForDrain();
    }

    await encoder.flush();
    if (encodeError) throw encodeError;
    muxer.finalize();

    const { buffer } = muxer.target as ArrayBufferTarget;
    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    try {
      if (encoder.state !== "closed") encoder.close();
    } catch {
      /* already closed */
    }
  }
}
