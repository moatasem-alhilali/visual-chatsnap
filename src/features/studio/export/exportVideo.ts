import { ArrayBufferTarget, Muxer } from "mp4-muxer";

/** Whether this browser can encode video entirely in the page (Chrome/Edge/Safari 16.4+). */
export function canExportVideo(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "function" &&
    typeof (window as unknown as { VideoFrame?: unknown }).VideoFrame === "function"
  );
}

export interface ExportOptions {
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  bitrate?: number;
  /** Produce the rasterised frame for a given time. Must match width×height. */
  drawFrame: (timeMs: number, frameIndex: number) => Promise<CanvasImageSource>;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

const CODEC_CANDIDATES = [
  "avc1.640028", // High 4.0
  "avc1.4d0028", // Main 4.0
  "avc1.42e028", // Baseline 4.0
  "avc1.640020",
  "avc1.42001f",
];

async function pickCodec(width: number, height: number, fps: number, bitrate: number) {
  const VE = (window as unknown as { VideoEncoder: typeof VideoEncoder }).VideoEncoder;
  for (const codec of CODEC_CANDIDATES) {
    try {
      const support = await VE.isConfigSupported({ codec, width, height, framerate: fps, bitrate });
      if (support.supported) return codec;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function exportToMp4(opts: ExportOptions): Promise<Blob> {
  const { width, height, fps, durationMs, drawFrame, onProgress, signal } = opts;
  const bitrate = opts.bitrate ?? 8_000_000;

  if (!canExportVideo()) {
    throw new Error("VIDEO_UNSUPPORTED");
  }

  const codec = await pickCodec(width, height, fps, bitrate);
  if (!codec) throw new Error("CODEC_UNSUPPORTED");

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width, height },
    fastStart: "in-memory",
  });

  const VE = (window as unknown as { VideoEncoder: typeof VideoEncoder }).VideoEncoder;
  let encodeError: unknown = null;
  const encoder = new VE({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encodeError = e;
    },
  });
  encoder.configure({ codec, width, height, bitrate, framerate: fps });

  const totalFrames = Math.max(1, Math.ceil((durationMs / 1000) * fps));
  const frameDur = 1_000_000 / fps;

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new Error("ABORTED");
      if (encodeError) throw encodeError;

      const timeMs = (i * 1000) / fps;
      const source = await drawFrame(timeMs, i);

      const VF = (window as unknown as { VideoFrame: typeof VideoFrame }).VideoFrame;
      const frame = new VF(source, {
        timestamp: Math.round(i * frameDur),
        duration: Math.round(frameDur),
      });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      onProgress?.(i + 1, totalFrames);

      // back-pressure: let the encoder drain so memory stays bounded. Uses the
      // encoder's "dequeue" event (not a timer) so it isn't throttled in the
      // background.
      if (encoder.encodeQueueSize > 8) {
        await new Promise<void>((resolve) => {
          const onDequeue = () => {
            if (encoder.encodeQueueSize <= 4) {
              encoder.removeEventListener("dequeue", onDequeue);
              resolve();
            }
          };
          encoder.addEventListener("dequeue", onDequeue);
          onDequeue();
        });
      }
    }

    await encoder.flush();
    if (encodeError) throw encodeError;
    muxer.finalize();

    const { buffer } = muxer.target as ArrayBufferTarget;
    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    try {
      encoder.close();
    } catch {
      /* already closed */
    }
  }
}
