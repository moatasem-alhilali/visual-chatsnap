/**
 * Small, dependency-free animated GIF encoder tuned for chat mockups:
 *  - one global 255-colour palette built by median cut from sample frames,
 *  - a 32k-entry colour lookup table + a light, position-stable ordered dither
 *    (static areas stay byte-identical between frames),
 *  - frame differencing: each frame only stores the changed rectangle, with
 *    unchanged pixels transparent, and identical frames are merged into the
 *    previous frame's delay — a mostly static chat compresses very well.
 */

const TRANSPARENT = 255;

export interface GifPalette {
  /** 256 × RGB (entry 255 is reserved for transparency) */
  rgb: Uint8Array;
  /** 15-bit colour → palette index */
  lut: Uint8Array;
}

/* ------------------------------------------------------------ palette */

const key15 = (r: number, g: number, b: number) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

interface Box {
  bins: number[];
  count: number;
  score: number;
  axis: 0 | 1 | 2;
}

function makeBox(bins: number[], hist: Uint32Array): Box {
  let rMin = 31;
  let rMax = 0;
  let gMin = 31;
  let gMax = 0;
  let bMin = 31;
  let bMax = 0;
  let count = 0;
  for (const k of bins) {
    const r = k >> 10;
    const g = (k >> 5) & 31;
    const b = k & 31;
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
    count += hist[k];
  }
  // perceptual weights: green matters most, blue least
  const rr = (rMax - rMin) * 1.0;
  const gr = (gMax - gMin) * 1.2;
  const br = (bMax - bMin) * 0.8;
  const axis: 0 | 1 | 2 = gr >= rr && gr >= br ? 1 : rr >= br ? 0 : 2;
  const range = Math.max(rr, gr, br);
  return { bins, count, axis, score: bins.length > 1 ? range * Math.sqrt(count) : -1 };
}

/** Median-cut a palette from RGBA sample frames. */
export function buildPalette(samples: Uint8ClampedArray[], maxColors = 255): GifPalette {
  const hist = new Uint32Array(32768);
  for (const px of samples) {
    const n = px.length / 4;
    const step = n > 400_000 ? 3 : n > 150_000 ? 2 : 1;
    for (let i = 0; i < n; i += step) {
      const o = i * 4;
      hist[key15(px[o], px[o + 1], px[o + 2])]++;
    }
  }
  const all: number[] = [];
  for (let k = 0; k < 32768; k++) if (hist[k]) all.push(k);

  const boxes: Box[] = [makeBox(all, hist)];
  while (boxes.length < maxColors) {
    let bi = -1;
    let best = 0;
    for (let k = 0; k < boxes.length; k++) {
      if (boxes[k].score > best) {
        best = boxes[k].score;
        bi = k;
      }
    }
    if (bi < 0) break;
    const box = boxes[bi];
    const shift = box.axis === 0 ? 10 : box.axis === 1 ? 5 : 0;
    const sorted = [...box.bins].sort((a, b) => ((a >> shift) & 31) - ((b >> shift) & 31));
    // split at the weighted median
    let acc = 0;
    let cut = 1;
    for (let k = 0; k < sorted.length - 1; k++) {
      acc += hist[sorted[k]];
      if (acc >= box.count / 2) {
        cut = k + 1;
        break;
      }
      cut = k + 1;
    }
    boxes.splice(bi, 1, makeBox(sorted.slice(0, cut), hist), makeBox(sorted.slice(cut), hist));
  }

  const rgb = new Uint8Array(256 * 3);
  boxes.forEach((box, i) => {
    let r = 0;
    let g = 0;
    let b = 0;
    for (const k of box.bins) {
      const w = hist[k];
      r += ((k >> 10) * 8 + 4) * w;
      g += (((k >> 5) & 31) * 8 + 4) * w;
      b += ((k & 31) * 8 + 4) * w;
    }
    const c = Math.max(1, box.count);
    rgb[i * 3] = Math.round(r / c);
    rgb[i * 3 + 1] = Math.round(g / c);
    rgb[i * 3 + 2] = Math.round(b / c);
  });
  const n = Math.max(1, boxes.length);

  // nearest palette entry for every 15-bit colour
  const lut = new Uint8Array(32768);
  for (let k = 0; k < 32768; k++) {
    const r = (k >> 10) * 8 + 4;
    const g = ((k >> 5) & 31) * 8 + 4;
    const b = (k & 31) * 8 + 4;
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const dr = r - rgb[i * 3];
      const dg = g - rgb[i * 3 + 1];
      const db = b - rgb[i * 3 + 2];
      const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d < bd) {
        bd = d;
        bi = i;
        if (d === 0) break;
      }
    }
    lut[k] = bi;
  }
  return { rgb, lut };
}

// 4×4 Bayer matrix, centred, in 8-bit steps (± half a 15-bit bin)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => Math.round((v / 16 - 0.47) * 8));

/** RGBA → palette indices (ordered dither keeps static regions identical between frames). */
export function indexFrame(px: Uint8ClampedArray, W: number, H: number, pal: GifPalette, out: Uint8Array, dither = true): void {
  const { lut } = pal;
  for (let y = 0; y < H; y++) {
    const row = (y & 3) * 4;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const o = i * 4;
      let r = px[o];
      let g = px[o + 1];
      let b = px[o + 2];
      if (dither) {
        const d = BAYER[row + (x & 3)];
        r = Math.min(255, Math.max(0, r + d));
        g = Math.min(255, Math.max(0, g + d));
        b = Math.min(255, Math.max(0, b + d));
      }
      out[i] = lut[key15(r, g, b)];
    }
  }
}

/* -------------------------------------------------------------- bytes */

class ByteWriter {
  buf = new Uint8Array(1 << 16);
  len = 0;
  private grow(n: number) {
    if (this.len + n <= this.buf.length) return;
    let cap = this.buf.length * 2;
    while (cap < this.len + n) cap *= 2;
    const nb = new Uint8Array(cap);
    nb.set(this.buf.subarray(0, this.len));
    this.buf = nb;
  }
  byte(b: number) {
    this.grow(1);
    this.buf[this.len++] = b & 255;
  }
  u16(v: number) {
    this.byte(v & 255);
    this.byte((v >> 8) & 255);
  }
  bytes(a: ArrayLike<number>) {
    this.grow(a.length);
    this.buf.set(a, this.len);
    this.len += a.length;
  }
  str(s: string) {
    for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i));
  }
  result(): Uint8Array {
    return this.buf.slice(0, this.len);
  }
}

/* ---------------------------------------------------------------- LZW */

const MAX_BITS = 12;
const MAX_CODE = 1 << MAX_BITS;
// direct-mapped dictionary: key = (pixel << 12) | prefix, stamped per generation
// (allocated on first use: 6 MB)
let dictCode: Int16Array | null = null;
let dictStamp: Int32Array | null = null;
let dictGen = 1;

/** GIF-flavoured LZW of 8-bit indices into data sub-blocks (classic compress semantics). */
function writeLzw(out: ByteWriter, data: Uint8Array, minCodeSize = 8) {
  dictCode ??= new Int16Array(256 * MAX_CODE);
  dictStamp ??= new Int32Array(256 * MAX_CODE);
  const codes = dictCode;
  const stamp = dictStamp;
  out.byte(minCodeSize);
  const initBits = minCodeSize + 1;
  const clearCode = 1 << minCodeSize;
  const eofCode = clearCode + 1;
  let nBits = initBits;
  let maxcode = (1 << nBits) - 1;
  let freeEnt = clearCode + 2;
  let clearFlg = false;
  let acc = 0;
  let accBits = 0;
  const block = new Uint8Array(255);
  let blockLen = 0;

  const flushBlock = () => {
    if (!blockLen) return;
    out.byte(blockLen);
    out.bytes(block.subarray(0, blockLen));
    blockLen = 0;
  };
  const emit = (code: number) => {
    acc |= code << accBits;
    accBits += nBits;
    while (accBits >= 8) {
      block[blockLen++] = acc & 255;
      if (blockLen === 255) flushBlock();
      acc >>>= 8;
      accBits -= 8;
    }
    if (freeEnt > maxcode || clearFlg) {
      if (clearFlg) {
        nBits = initBits;
        maxcode = (1 << nBits) - 1;
        clearFlg = false;
      } else {
        nBits++;
        maxcode = nBits === MAX_BITS ? MAX_CODE : (1 << nBits) - 1;
      }
    }
  };
  const newGen = () => {
    dictGen++;
    if (dictGen > 0x7ffffff0) {
      stamp.fill(0);
      dictGen = 1;
    }
  };

  newGen();
  emit(clearCode);
  let ent = data[0];
  for (let i = 1; i < data.length; i++) {
    const c = data[i];
    const key = (c << MAX_BITS) | ent;
    if (stamp[key] === dictGen) {
      ent = codes[key];
      continue;
    }
    emit(ent);
    ent = c;
    if (freeEnt < MAX_CODE) {
      codes[key] = freeEnt++;
      stamp[key] = dictGen;
    } else {
      newGen();
      freeEnt = clearCode + 2;
      clearFlg = true;
      emit(clearCode);
    }
  }
  emit(ent);
  emit(eofCode);
  if (accBits > 0) {
    block[blockLen++] = acc & 255;
    if (blockLen === 255) flushBlock();
  }
  flushBlock();
  out.byte(0);
}

/* ------------------------------------------------------------- writer */

interface PendingFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  data: Uint8Array;
  transparent: boolean;
  delayCs: number;
}

export class GifWriter {
  private out = new ByteWriter();
  private prev: Uint8Array | null = null;
  private cur: Uint8Array;
  private pending: PendingFrame | null = null;
  frames = 0;

  constructor(
    readonly W: number,
    readonly H: number,
    readonly palette: GifPalette,
    private dither = true,
  ) {
    this.cur = new Uint8Array(W * H);
    const o = this.out;
    o.str("GIF89a");
    o.u16(W);
    o.u16(H);
    o.byte(0xf7); // global colour table, 8 bits, 256 entries
    o.byte(0);
    o.byte(0);
    o.bytes(palette.rgb);
    // loop forever
    o.byte(0x21);
    o.byte(0xff);
    o.byte(11);
    o.str("NETSCAPE2.0");
    o.byte(3);
    o.byte(1);
    o.u16(0);
    o.byte(0);
  }

  /** bytes written so far (excluding the frame still held for delay merging) */
  get size(): number {
    return this.out.len + (this.pending ? this.pending.w * this.pending.h * 0.5 : 0);
  }

  private flushPending() {
    const f = this.pending;
    if (!f) return;
    const o = this.out;
    o.byte(0x21);
    o.byte(0xf9);
    o.byte(4);
    o.byte((1 << 2) | (f.transparent ? 1 : 0)); // disposal: leave in place
    o.u16(Math.max(2, Math.round(f.delayCs)));
    o.byte(TRANSPARENT);
    o.byte(0);
    o.byte(0x2c);
    o.u16(f.x);
    o.u16(f.y);
    o.u16(f.w);
    o.u16(f.h);
    o.byte(0);
    writeLzw(o, f.data);
    this.pending = null;
  }

  /** Add an RGBA frame shown for `delayCs` centiseconds. */
  addFrame(px: Uint8ClampedArray, delayCs: number) {
    const { W, H } = this;
    indexFrame(px, W, H, this.palette, this.cur, this.dither);
    const cur = this.cur;
    const prev = this.prev;

    if (!prev) {
      this.pending = { x: 0, y: 0, w: W, h: H, data: cur.slice(), transparent: false, delayCs };
      this.prev = cur.slice();
      this.frames++;
      return;
    }

    // changed rectangle
    let x0 = W;
    let y0 = H;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      let first = -1;
      let last = -1;
      for (let x = 0; x < W; x++) {
        if (cur[row + x] !== prev[row + x]) {
          if (first < 0) first = x;
          last = x;
        }
      }
      if (first >= 0) {
        if (first < x0) x0 = first;
        if (last > x1) x1 = last;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
    if (x1 < 0) {
      // identical: just show the previous frame longer
      if (this.pending) this.pending.delayCs += delayCs;
      return;
    }
    this.flushPending();
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const data = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const src = (y0 + y) * W + x0;
      for (let x = 0; x < w; x++) {
        const v = cur[src + x];
        data[y * w + x] = v === prev[src + x] ? TRANSPARENT : v;
        prev[src + x] = v;
      }
    }
    this.pending = { x: x0, y: y0, w, h, data, transparent: true, delayCs };
    this.frames++;
  }

  finish(): Uint8Array {
    this.flushPending();
    this.out.byte(0x3b);
    return this.out.result();
  }
}

/** Rough size of a GIF of this kind (shown before rendering). */
export function estimateGifBytes(W: number, H: number, frames: number, moving: boolean): number {
  const first = W * H * 0.55;
  // calibrated on real exports (frame-diffed, 255 colours)
  const perFrame = moving ? W * H * 0.18 : W * H * 0.035;
  return first + perFrame * Math.max(0, frames - 1);
}

/** Largest width (≤ `width`) whose estimated GIF fits in `capBytes`. */
export function fitGifWidth(width: number, aspect: number, frames: number, moving: boolean, capBytes: number): number {
  const est = estimateGifBytes(width, Math.round(width * aspect), frames, moving);
  if (est <= capBytes * 0.9) return width;
  return Math.max(200, Math.round(width * Math.sqrt((capBytes * 0.85) / est)));
}
