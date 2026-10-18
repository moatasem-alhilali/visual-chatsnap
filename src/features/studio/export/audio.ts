/**
 * Optional sound track: short, original, fully synthesized UI sounds (no
 * samples, nothing copyrighted) — a soft rising "whoosh-tick" when a message
 * is sent and a rounded two-note "pop" when one arrives — rendered offline
 * with an OfflineAudioContext and encoded with WebCodecs (AAC, else Opus).
 */

export type AudioCodec = "aac" | "opus";

export interface SoundCue {
  at: number; // ms
  kind: "send" | "receive";
}

export const AUDIO_SAMPLE_RATE = 48_000;
const CHANNELS = 2;

function hasAudioEncoder(): boolean {
  return typeof window !== "undefined" && typeof (window as unknown as { AudioEncoder?: unknown }).AudioEncoder === "function";
}

/** The audio codec this browser can encode, or null when audio can't be produced. */
export async function pickAudioCodec(): Promise<AudioCodec | null> {
  if (!hasAudioEncoder() || typeof OfflineAudioContext === "undefined") return null;
  const candidates: [AudioCodec, string][] = [
    ["aac", "mp4a.40.2"],
    ["opus", "opus"],
  ];
  for (const [id, codec] of candidates) {
    try {
      const s = await AudioEncoder.isConfigSupported({
        codec,
        sampleRate: AUDIO_SAMPLE_RATE,
        numberOfChannels: CHANNELS,
        bitrate: 128_000,
      });
      if (s.supported) return id;
    } catch {
      /* try next */
    }
  }
  return null;
}

function scheduleSend(ctx: OfflineAudioContext, t: number, out: AudioNode) {
  // airy whoosh: band-passed noise sweeping up
  const len = 0.16;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let seed = 7;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    d[i] = (seed / 0xffffffff) * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(900, t);
  bp.frequency.exponentialRampToValueAtTime(4200, t + len);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + len);
  noise.connect(bp).connect(ng).connect(out);
  noise.start(t);
  noise.stop(t + len);

  // tick on top
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1250, t + 0.05);
  osc.frequency.exponentialRampToValueAtTime(1750, t + 0.11);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t + 0.05);
  og.gain.exponentialRampToValueAtTime(0.18, t + 0.06);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(og).connect(out);
  osc.start(t + 0.05);
  osc.stop(t + 0.16);
}

function scheduleReceive(ctx: OfflineAudioContext, t: number, out: AudioNode) {
  const notes: [number, number][] = [
    [0, 784], // G5
    [0.075, 1175], // D6
  ];
  for (const [dt, f] of notes) {
    const s = t + dt;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f * 0.92, s);
    osc.frequency.exponentialRampToValueAtTime(f, s + 0.02);
    const h = ctx.createOscillator(); // soft overtone for a rounder "glass" pop
    h.type = "triangle";
    h.frequency.setValueAtTime(f * 2, s);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.22, s + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.22);
    const hg = ctx.createGain();
    hg.gain.value = 0.12;
    osc.connect(g);
    h.connect(hg).connect(g);
    g.connect(out);
    osc.start(s);
    h.start(s);
    osc.stop(s + 0.24);
    h.stop(s + 0.24);
  }
}

/** Background music bed mixed under the message sounds. */
export interface MusicBed {
  buffer: AudioBuffer;
  /** where in the file the music starts (s) */
  offsetSec: number;
  /** 0–1 */
  volume: number;
  fadeInMs: number;
  fadeOutMs: number;
  /** repeat from `offsetSec` when the file is shorter than the video */
  loop: boolean;
}

/** Decode an uploaded audio file (mp3 / m4a / wav / ogg) at the export sample rate. */
export async function decodeMusic(file: Blob): Promise<AudioBuffer> {
  const data = await file.arrayBuffer();
  const ctx = new OfflineAudioContext(CHANNELS, 1, AUDIO_SAMPLE_RATE);
  return ctx.decodeAudioData(data);
}

function scheduleMusic(ctx: OfflineAudioContext, m: MusicBed, durationSec: number, out: AudioNode) {
  const offset = Math.min(Math.max(0, m.offsetSec), Math.max(0, m.buffer.duration - 0.05));
  const src = ctx.createBufferSource();
  src.buffer = m.buffer;
  if (m.loop && m.buffer.duration - offset < durationSec) {
    src.loop = true;
    src.loopStart = offset;
    src.loopEnd = m.buffer.duration;
  }
  const g = ctx.createGain();
  const vol = Math.max(0, Math.min(1, m.volume));
  const playable = src.loop ? durationSec : Math.min(durationSec, m.buffer.duration - offset);
  const fin = Math.min(m.fadeInMs / 1000, playable / 2);
  const fout = Math.min(m.fadeOutMs / 1000, playable / 2);
  if (fin > 0) {
    g.gain.setValueAtTime(0, 0);
    g.gain.linearRampToValueAtTime(vol, fin);
  } else {
    g.gain.setValueAtTime(vol, 0);
  }
  if (fout > 0) {
    g.gain.setValueAtTime(vol, Math.max(fin, playable - fout));
    g.gain.linearRampToValueAtTime(0, playable);
  }
  src.connect(g).connect(out);
  src.start(0, offset);
  src.stop(durationSec);
}

/**
 * Render the whole sound track (stereo, 48 kHz): the message cues plus an
 * optional music bed, trimmed/looped to the video length, through a gentle
 * limiter so the mix never clips.
 */
export async function renderSoundTrack(cues: SoundCue[], durationMs: number, music?: MusicBed | null): Promise<AudioBuffer> {
  const frames = Math.max(1, Math.ceil((durationMs / 1000) * AUDIO_SAMPLE_RATE));
  const ctx = new OfflineAudioContext(CHANNELS, frames, AUDIO_SAMPLE_RATE);
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1.5;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  limiter.connect(ctx.destination);

  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor(); // keeps overlapping cues from clipping
  comp.threshold.value = -12;
  comp.ratio.value = 4;
  master.connect(comp).connect(limiter);
  for (const c of cues) {
    const t = c.at / 1000;
    if (t < 0 || t * 1000 >= durationMs - 50) continue;
    if (c.kind === "send") scheduleSend(ctx, t, master);
    else scheduleReceive(ctx, t, master);
  }
  if (music) scheduleMusic(ctx, music, durationMs / 1000, limiter);
  return ctx.startRendering();
}

/** Encode an AudioBuffer and hand every chunk to `onChunk`. */
export async function encodeAudio(
  buffer: AudioBuffer,
  codec: AudioCodec,
  onChunk: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => void,
): Promise<void> {
  let failure: unknown = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => onChunk(chunk, meta),
    error: (e) => {
      failure = e;
    },
  });
  enc.configure({
    codec: codec === "aac" ? "mp4a.40.2" : "opus",
    sampleRate: buffer.sampleRate,
    numberOfChannels: buffer.numberOfChannels,
    bitrate: 128_000,
  });
  const block = 4096;
  const chans = buffer.numberOfChannels;
  const planes = Array.from({ length: chans }, (_, c) => buffer.getChannelData(c));
  try {
    for (let off = 0; off < buffer.length; off += block) {
      if (failure) throw failure;
      const n = Math.min(block, buffer.length - off);
      const data = new Float32Array(n * chans);
      for (let c = 0; c < chans; c++) data.set(planes[c].subarray(off, off + n), c * n);
      const ad = new AudioData({
        format: "f32-planar",
        sampleRate: buffer.sampleRate,
        numberOfFrames: n,
        numberOfChannels: chans,
        timestamp: Math.round((off / buffer.sampleRate) * 1_000_000),
        data,
      });
      enc.encode(ad);
      ad.close();
    }
    await enc.flush();
    if (failure) throw failure;
  } finally {
    try {
      enc.close();
    } catch {
      /* already closed */
    }
  }
}
