/**
 * Built-in media library: small ready-made assets so a chat looks finished
 * without any upload. Everything is hand-drawn inline SVG served as a data
 * URL (no network, ~1–3 KB each), so it works in the live stage, in the
 * exporter's DOM snapshot and inside share links.
 *
 *  - avatars: faceless illustrated people on soft gradients + two brand marks
 *  - photos:  product / lifestyle scenes (4:3) for images, link previews,
 *             stickers and group pictures
 */

export type MediaKind = "avatar" | "photo";

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  label: { ar: string; en: string };
  src: string;
}

const svgUrl = (body: string, w: number, h: number) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`,
  )}`;

const grad = (id: string, a: string, b: string, x2 = 1, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

/* ------------------------------------------------------------------ */
/* Avatars (120 × 120)                                                 */
/* ------------------------------------------------------------------ */

type HairStyle = "short" | "long" | "bun" | "curly" | "hijab" | "ghutra" | "bald";

interface AvatarSpec {
  bg: [string, string];
  skin: string;
  shirt: string;
  hair: string;
  style: HairStyle;
  beard?: string;
  glasses?: boolean;
}

function person(s: AvatarSpec): string {
  const parts: string[] = [`<defs>${grad("b", s.bg[0], s.bg[1])}</defs>`, `<rect width="120" height="120" fill="url(#b)"/>`];
  // soft light blob for depth
  parts.push(`<circle cx="92" cy="22" r="34" fill="#fff" opacity=".18"/>`);

  if (s.style === "hijab") {
    parts.push(
      `<path d="M14 120c2-22 12-34 24-40-4-8-6-16-6-24 0-18 13-31 28-31s28 13 28 31c0 8-2 16-6 24 12 6 22 18 24 40z" fill="${s.hair}"/>`,
      `<path d="M60 31c-12 0-21 10-21 24 0 13 9 24 21 24s21-11 21-24c0-14-9-24-21-24z" fill="${s.skin}"/>`,
      `<path d="M38 50c4-12 12-19 22-19s18 7 22 19c-6-5-13-8-22-8s-16 3-22 8z" fill="${s.hair}" opacity=".9"/>`,
      `<path d="M30 84c10 8 19 11 30 11s20-3 30-11" stroke="#000" stroke-opacity=".12" stroke-width="2" fill="none"/>`,
    );
    return svgUrl(parts.join(""), 120, 120);
  }

  if (s.style === "ghutra") {
    parts.push(
      `<path d="M16 120c3-22 20-34 44-34s41 12 44 34z" fill="${s.shirt}"/>`,
      `<path d="M30 104c2-30 4-48 6-56 4-15 12-24 24-24s20 9 24 24c2 8 4 26 6 56-10 4-20 6-30 6s-20-2-30-6z" fill="#f6f5f1"/>`,
      `<path d="M36 70l-4 30M84 70l4 30" stroke="#d9d5cb" stroke-width="2"/>`,
      `<circle cx="60" cy="56" r="17" fill="${s.skin}"/>`,
      `<path d="M44 58c1 12 8 19 16 19s15-7 16-19c-4 5-10 7-16 7s-12-2-16-7z" fill="${s.beard ?? "#2b1d16"}"/>`,
      `<path d="M41 47c4-9 11-13 19-13s15 4 19 13c-6-3-12-4-19-4s-13 1-19 4z" fill="#f6f5f1"/>`,
      `<ellipse cx="60" cy="36" rx="23" ry="6.5" fill="none" stroke="#1d1d1f" stroke-width="4.5"/>`,
    );
    return svgUrl(parts.join(""), 120, 120);
  }

  if (s.style === "long") {
    parts.push(`<path d="M35 58c0-21 11-33 25-33s25 12 25 33v30c-7 5-15 7-25 7s-18-2-25-7z" fill="${s.hair}"/>`);
  }
  if (s.style === "bun") parts.push(`<circle cx="60" cy="27" r="10.5" fill="${s.hair}"/>`);

  // shoulders, neck, head
  parts.push(
    `<path d="M16 120c3-24 20-36 44-36s41 12 44 36z" fill="${s.shirt}"/>`,
    `<path d="M52 70h16v14c-3 3-6 4-8 4s-5-1-8-4z" fill="${s.skin}"/>`,
    `<path d="M52 82c3 3 5 4 8 4s5-1 8-4" stroke="#000" stroke-opacity=".08" stroke-width="3" fill="none"/>`,
    `<circle cx="60" cy="54" r="20" fill="${s.skin}"/>`,
  );

  if (s.beard) {
    parts.push(`<path d="M41 55c0 14 8 22 19 22s19-8 19-22c-4 6-10 9-19 9s-15-3-19-9z" fill="${s.beard}"/>`);
  }

  switch (s.style) {
    case "short":
      parts.push(`<path d="M39 53c-2-16 8-27 22-27 13 0 22 9 21 24l-3 5c-1-9-8-15-18-15-11 0-18 5-21 13z" fill="${s.hair}"/>`);
      break;
    case "long":
    case "bun":
      parts.push(`<path d="M39 52c1-14 10-22 21-22s20 8 21 22c-7-7-15-10-25-8-7 1-12 4-17 8z" fill="${s.hair}"/>`);
      break;
    case "curly":
      parts.push(
        `<g fill="${s.hair}"><circle cx="42" cy="46" r="9"/><circle cx="47" cy="36" r="10"/><circle cx="58" cy="31" r="11"/><circle cx="70" cy="33" r="10"/><circle cx="78" cy="43" r="9"/><circle cx="80" cy="52" r="6"/><circle cx="40" cy="54" r="6"/></g>`,
      );
      break;
    case "bald":
      parts.push(`<path d="M41 50c1-4 3-7 5-9M79 50c-1-4-3-7-5-9" stroke="${s.hair}" stroke-width="5" stroke-linecap="round"/>`);
      break;
  }

  if (s.glasses) {
    parts.push(
      `<g fill="none" stroke="#1d2433" stroke-width="2.4"><circle cx="52" cy="55" r="6.5"/><circle cx="68" cy="55" r="6.5"/><path d="M58.5 55h3M45.5 54l-4-1M74.5 54l4-1"/></g>`,
    );
  }
  return svgUrl(parts.join(""), 120, 120);
}

function brand(bg: [string, string], mark: string): string {
  return svgUrl(
    `<defs>${grad("b", bg[0], bg[1])}</defs><rect width="120" height="120" fill="url(#b)"/><circle cx="96" cy="18" r="40" fill="#fff" opacity=".12"/>${mark}`,
    120,
    120,
  );
}

export const MEDIA_AVATARS: MediaAsset[] = [
  {
    id: "av-ocean",
    kind: "avatar",
    label: { ar: "شاب بلحية", en: "Bearded man" },
    src: person({ bg: ["#5eead4", "#0e7490"], skin: "#c98e69", shirt: "#1e293b", hair: "#1c1917", style: "short", beard: "#1c1917" }),
  },
  {
    id: "av-peach",
    kind: "avatar",
    label: { ar: "فتاة بشعر طويل", en: "Long-haired woman" },
    src: person({ bg: ["#fed7aa", "#fb7185"], skin: "#f0c4a4", shirt: "#ffffff", hair: "#5b3a29", style: "long" }),
  },
  {
    id: "av-lilac",
    kind: "avatar",
    label: { ar: "فتاة بحجاب", en: "Woman in hijab" },
    src: person({ bg: ["#e9d5ff", "#a78bfa"], skin: "#e3b48f", shirt: "#7c3aed", hair: "#be185d", style: "hijab" }),
  },
  {
    id: "av-sky",
    kind: "avatar",
    label: { ar: "رجل بشماغ", en: "Man in ghutra" },
    src: person({ bg: ["#bae6fd", "#3b82f6"], skin: "#c8916b", shirt: "#f8fafc", hair: "#f6f5f1", style: "ghutra", beard: "#231815" }),
  },
  {
    id: "av-amber",
    kind: "avatar",
    label: { ar: "شاب بشعر مجعد", en: "Curly-haired man" },
    src: person({ bg: ["#fde68a", "#f59e0b"], skin: "#8d5a3b", shirt: "#0f766e", hair: "#1f1410", style: "curly" }),
  },
  {
    id: "av-sage",
    kind: "avatar",
    label: { ar: "فتاة بكعكة شعر", en: "Woman with a bun" },
    src: person({ bg: ["#bbf7d0", "#10b981"], skin: "#f3cfb3", shirt: "#fef3c7", hair: "#2d1b12", style: "bun" }),
  },
  {
    id: "av-navy",
    kind: "avatar",
    label: { ar: "شاب بنظارة", en: "Man with glasses" },
    src: person({ bg: ["#c7d2fe", "#4338ca"], skin: "#f1c9a5", shirt: "#f97316", hair: "#d6a456", style: "short", glasses: true }),
  },
  {
    id: "av-rose",
    kind: "avatar",
    label: { ar: "رجل كبير بالسن", en: "Older man" },
    src: person({ bg: ["#fbcfe8", "#db2777"], skin: "#dca582", shirt: "#334155", hair: "#d4d4d8", style: "bald", beard: "#d4d4d8", glasses: true }),
  },
  {
    id: "av-bag",
    kind: "avatar",
    label: { ar: "شعار متجر", en: "Store logo" },
    src: brand(
      ["#2dd4bf", "#047857"],
      `<path d="M37 50h46l-4 40c-.4 4-3.6 7-7.6 7H48.6c-4 0-7.2-3-7.6-7z" fill="#fff"/><path d="M49 52v-6a11 11 0 0 1 22 0v6" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="49" cy="58" r="3" fill="#047857"/><circle cx="71" cy="58" r="3" fill="#047857"/>`,
    ),
  },
  {
    id: "av-spark",
    kind: "avatar",
    label: { ar: "شعار علامة", en: "Brand mark" },
    src: brand(
      ["#818cf8", "#7c3aed"],
      `<path d="M60 28c3 17 15 29 32 32-17 3-29 15-32 32-3-17-15-29-32-32 17-3 29-15 32-32z" fill="#fff"/><circle cx="88" cy="88" r="6" fill="#fff" opacity=".7"/>`,
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Photos (400 × 300)                                                  */
/* ------------------------------------------------------------------ */

function windows(): string {
  const out: string[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 136 + c * 50;
      const y = 82 + r * 34;
      out.push(`<rect x="${x}" y="${y}" width="36" height="22" rx="2" fill="${(r + c) % 3 === 0 ? "#fde68a" : "#7fb2d9"}"/>`);
    }
    out.push(`<rect x="128" y="${108 + r * 34}" width="154" height="4" fill="#cfc6b8"/>`);
  }
  return out.join("");
}

export const MEDIA_PHOTOS: MediaAsset[] = [
  {
    id: "ph-sneaker",
    kind: "photo",
    label: { ar: "حذاء رياضي", en: "Sneaker" },
    src: svgUrl(
      `<defs>${grad("g", "#f7f0e7", "#e6d5bf")}</defs><rect width="400" height="300" fill="url(#g)"/><circle cx="318" cy="64" r="86" fill="#fff" opacity=".35"/><ellipse cx="204" cy="234" rx="150" ry="13" fill="#5b4630" opacity=".16"/>` +
        `<path d="M62 206c0-8 6-12 14-12h236c20 0 32 8 34 20 1 8-4 14-14 14H84c-14 0-22-10-22-22z" fill="#fff" stroke="#dcd2c3" stroke-width="2"/><path d="M68 215h276" stroke="#e7ddcf" stroke-width="3"/>` +
        `<path d="M76 196c-2-22 4-44 18-58 10-10 26-12 38-6l40 22c14 8 30 10 46 12l60 6c34 4 54 12 60 24z" fill="#e4572e"/><path d="M268 172c30 3 50 10 58 24h-80c4-12 12-20 22-24z" fill="#c8441f"/>` +
        `<path d="M94 140c8-10 24-14 38-8l-6 14c-10-4-20-2-28 4z" fill="#2b2b2b"/><path d="M104 188c46-6 96-22 156-48-40 32-92 52-156 58z" fill="#fff"/>` +
        `<g stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M150 150l18-8M166 158l18-8M182 164l18-8M198 168l18-7"/></g>`,
      400,
      300,
    ),
  },
  {
    id: "ph-perfume",
    kind: "photo",
    label: { ar: "عطر", en: "Perfume" },
    src: svgUrl(
      `<defs>${grad("g", "#fbe7ec", "#e8bccb")}${grad("v", "#fffaf4", "#f0c9a6", 1, 0)}</defs><rect width="400" height="300" fill="url(#g)"/><rect y="236" width="400" height="64" fill="#dfa9ba" opacity=".45"/><ellipse cx="200" cy="254" rx="92" ry="10" fill="#7a3b4c" opacity=".18"/>` +
        `<rect x="184" y="92" width="32" height="24" fill="#d8b98a"/><rect x="166" y="48" width="68" height="48" rx="9" fill="#c9a24d"/><rect x="174" y="54" width="10" height="36" rx="5" fill="#fff" opacity=".35"/>` +
        `<rect x="124" y="110" width="152" height="144" rx="24" fill="url(#v)"/><rect x="134" y="150" width="132" height="94" rx="17" fill="#e7a66c" opacity=".7"/>` +
        `<rect x="158" y="172" width="84" height="42" rx="4" fill="#fff" opacity=".88"/><rect x="172" y="184" width="56" height="5" rx="2.5" fill="#b08a5a"/><rect x="182" y="196" width="36" height="4" rx="2" fill="#d1b48a"/>` +
        `<rect x="138" y="122" width="10" height="112" rx="5" fill="#fff" opacity=".55"/><circle cx="310" cy="90" r="5" fill="#fff" opacity=".8"/><circle cx="84" cy="140" r="3.5" fill="#fff" opacity=".8"/>`,
      400,
      300,
    ),
  },
  {
    id: "ph-burger",
    kind: "photo",
    label: { ar: "برجر", en: "Burger" },
    src: svgUrl(
      `<defs>${grad("g", "#ffd36e", "#ff8f3c")}</defs><rect width="400" height="300" fill="url(#g)"/><ellipse cx="200" cy="250" rx="150" ry="20" fill="#fff" opacity=".9"/><ellipse cx="200" cy="248" rx="128" ry="12" fill="#f1e4d4"/>` +
        `<path d="M110 212h180c0 18-14 30-30 30H140c-16 0-30-12-30-30z" fill="#d9893a"/><rect x="100" y="180" width="200" height="34" rx="17" fill="#5b3420"/>` +
        `<path d="M104 178h192l-20 20-14-10-18 16-16-14-20 16-18-14-18 14-16-12-22 14-14-10z" fill="#ffd23f"/><rect x="110" y="163" width="180" height="15" rx="7.5" fill="#e8452c"/>` +
        `<path d="M96 168c10-10 20 4 30-6s20 4 30-6 20 4 30-6 20 4 30-6 20 4 30-6 20 4 30-6 14 4 22 0v12H96z" fill="#6abf3b"/>` +
        `<path d="M104 158c0-46 44-74 96-74s96 28 96 74z" fill="#e9a046"/><path d="M132 120c16-18 40-26 66-26" stroke="#fff" stroke-opacity=".35" stroke-width="8" stroke-linecap="round" fill="none"/>` +
        `<g fill="#fff4d8"><ellipse cx="160" cy="112" rx="5" ry="3" transform="rotate(-20 160 112)"/><ellipse cx="200" cy="100" rx="5" ry="3"/><ellipse cx="236" cy="114" rx="5" ry="3" transform="rotate(20 236 114)"/><ellipse cx="182" cy="134" rx="5" ry="3" transform="rotate(10 182 134)"/><ellipse cx="222" cy="136" rx="5" ry="3" transform="rotate(-12 222 136)"/><ellipse cx="260" cy="140" rx="5" ry="3"/><ellipse cx="140" cy="140" rx="5" ry="3"/></g>`,
      400,
      300,
    ),
  },
  {
    id: "ph-apartment",
    kind: "photo",
    label: { ar: "شقة", en: "Apartment" },
    src: svgUrl(
      `<defs>${grad("g", "#bfe3ff", "#f0f8ff", 0, 1)}</defs><rect width="400" height="300" fill="url(#g)"/><circle cx="330" cy="62" r="26" fill="#ffe08a"/><rect y="252" width="400" height="48" fill="#cfe7c4"/><rect y="252" width="400" height="6" fill="#b9d8ac"/>` +
        `<rect x="120" y="60" width="170" height="196" fill="#f4efe7"/><rect x="290" y="72" width="34" height="184" fill="#ddd5c8"/><rect x="114" y="52" width="182" height="12" fill="#e2d9cb"/>` +
        windows() +
        `<rect x="186" y="224" width="38" height="32" fill="#8b6b4a"/><rect x="180" y="220" width="50" height="6" fill="#6d5338"/>` +
        `<rect x="64" y="200" width="8" height="56" fill="#7a5a3a"/><circle cx="68" cy="190" r="26" fill="#57a85a"/><circle cx="50" cy="206" r="18" fill="#4c9a50"/><circle cx="86" cy="208" r="18" fill="#63b466"/>` +
        `<rect x="344" y="214" width="6" height="42" fill="#7a5a3a"/><circle cx="347" cy="206" r="18" fill="#4c9a50"/>`,
      400,
      300,
    ),
  },
  {
    id: "ph-car",
    kind: "photo",
    label: { ar: "سيارة", en: "Car" },
    src: svgUrl(
      `<defs>${grad("g", "#eef2f8", "#c6d3e6", 0, 1)}${grad("c", "#3f83f8", "#1e4fb8", 0, 1)}</defs><rect width="400" height="300" fill="url(#g)"/><rect y="228" width="400" height="72" fill="#8a94a3"/><path d="M20 266h50M110 266h50M200 266h50M290 266h50M380 266h20" stroke="#fff" stroke-width="5"/>` +
        `<ellipse cx="214" cy="240" rx="170" ry="10" fill="#000" opacity=".22"/>` +
        `<path d="M58 206c0-16 10-26 28-30l46-8 36-30c10-8 22-12 36-12h66c14 0 26 6 34 16l26 30c24 4 40 14 40 34v16H58z" fill="url(#c)"/>` +
        `<path d="M176 136c6-6 14-9 22-9h42v42h-92z" fill="#d8e8f8"/><path d="M250 127h24c9 0 16 4 21 11l21 31h-66z" fill="#d8e8f8"/><path d="M244 127v96" stroke="#1e4fb8" stroke-width="3"/>` +
        `<rect x="324" y="186" width="20" height="10" rx="5" fill="#fff6c2"/><rect x="60" y="190" width="16" height="9" rx="4" fill="#ff6b6b"/><path d="M152 196h40M262 196h40" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="126" cy="222" r="28" fill="#1e2430"/><circle cx="126" cy="222" r="13" fill="#cfd6df"/><circle cx="306" cy="222" r="28" fill="#1e2430"/><circle cx="306" cy="222" r="13" fill="#cfd6df"/>`,
      400,
      300,
    ),
  },
  {
    id: "ph-phone",
    kind: "photo",
    label: { ar: "جوال", en: "Phone" },
    src: svgUrl(
      `<defs>${grad("g", "#8b7cf6", "#c4b5fd")}${grad("s", "#43cea2", "#185a9d")}</defs><rect width="400" height="300" fill="url(#g)"/><circle cx="80" cy="60" r="70" fill="#fff" opacity=".15"/>` +
        `<g transform="rotate(-12 250 160)"><rect x="200" y="44" width="110" height="224" rx="22" fill="#d9d4ea"/><rect x="214" y="58" width="44" height="58" rx="14" fill="#2a2633"/><circle cx="236" cy="74" r="9" fill="#11101a"/><circle cx="236" cy="100" r="9" fill="#11101a"/></g>` +
        `<rect x="112" y="34" width="120" height="240" rx="24" fill="#1b1b22"/><rect x="118" y="40" width="108" height="228" rx="19" fill="url(#s)"/><rect x="156" y="50" width="32" height="10" rx="5" fill="#000"/>` +
        `<g fill="#fff" opacity=".85"><rect x="134" y="200" width="20" height="20" rx="6"/><rect x="162" y="200" width="20" height="20" rx="6"/><rect x="190" y="200" width="20" height="20" rx="6"/><rect x="134" y="236" width="76" height="14" rx="7" opacity=".6"/></g><text x="172" y="112" font-family="system-ui,sans-serif" font-size="30" font-weight="300" fill="#fff" text-anchor="middle">9:41</text>`,
      400,
      300,
    ),
  },
  {
    id: "ph-dress",
    kind: "photo",
    label: { ar: "فستان", en: "Dress" },
    src: svgUrl(
      `<defs>${grad("g", "#dcf3ea", "#b3e0d0")}${grad("d", "#f06595", "#c2255c", 0, 1)}</defs><rect width="400" height="300" fill="url(#g)"/><rect x="40" y="34" width="320" height="6" rx="3" fill="#9aa59f"/>` +
        `<path d="M200 40v10M200 50l-62 36h124z" stroke="#8a6d4b" stroke-width="4" fill="none" stroke-linejoin="round"/>` +
        `<path d="M170 84c8 9 18 13 30 13s22-4 30-13l10 72h-80z" fill="url(#d)"/><rect x="160" y="150" width="80" height="12" rx="4" fill="#a61e4d"/>` +
        `<path d="M162 162h76l58 116H104z" fill="url(#d)"/><path d="M184 168l-26 108M200 168v110M216 168l26 108" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>` +
        `<circle cx="200" cy="156" r="5" fill="#ffd8a8"/>`,
      400,
      300,
    ),
  },
  {
    id: "ph-coffee",
    kind: "photo",
    label: { ar: "قهوة", en: "Coffee" },
    src: svgUrl(
      `<defs>${grad("g", "#f4e6d7", "#dcbb98")}</defs><rect width="400" height="300" fill="url(#g)"/><ellipse cx="196" cy="246" rx="120" ry="22" fill="#fff"/><ellipse cx="196" cy="242" rx="92" ry="12" fill="#efe7dd"/>` +
        `<path d="M276 160c34-2 38 44 0 46" stroke="#fff" stroke-width="13" fill="none"/><path d="M118 140h156v44c0 40-32 62-78 62s-78-22-78-62z" fill="#fff"/><path d="M128 190c6 30 32 46 68 46" stroke="#e8ddd0" stroke-width="5" fill="none"/>` +
        `<ellipse cx="196" cy="140" rx="78" ry="17" fill="#f6f2ec"/><ellipse cx="196" cy="142" rx="68" ry="12.5" fill="#9c6233"/><path d="M196 152c-14-8-20-12-20-17 0-4 3-6 6-6 6 0 9 4 14 9 5-5 8-9 14-9 3 0 6 2 6 6 0 5-6 9-20 17z" fill="#f3dfc6"/>` +
        `<g stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" fill="none"><path d="M176 112c-10-12 10-18 0-32"/><path d="M200 106c-10-12 10-18 0-32"/><path d="M224 112c-10-12 10-18 0-32"/></g>`,
      400,
      300,
    ),
  },
  {
    id: "ph-gift",
    kind: "photo",
    label: { ar: "هدية", en: "Gift" },
    src: svgUrl(
      `<defs>${grad("g", "#fff1e6", "#ffc9a8")}</defs><rect width="400" height="300" fill="url(#g)"/><ellipse cx="200" cy="252" rx="120" ry="12" fill="#a14d1f" opacity=".16"/>` +
        `<rect x="112" y="136" width="176" height="114" rx="8" fill="#e8590c"/><rect x="100" y="110" width="200" height="34" rx="8" fill="#fd7e14"/><rect x="186" y="110" width="28" height="140" fill="#ffd43b"/>` +
        `<path d="M200 110c-30-4-58-22-46-40 10-14 34 2 46 40zM200 110c30-4 58-22 46-40-10-14-34 2-46 40z" fill="#ffd43b" stroke="#f59f00" stroke-width="3"/>` +
        `<g fill="#fff" opacity=".85"><circle cx="70" cy="80" r="4"/><circle cx="330" cy="70" r="5"/><circle cx="320" cy="200" r="3"/><circle cx="80" cy="210" r="3"/></g>`,
      400,
      300,
    ),
  },
];

export const MEDIA_LIBRARY: MediaAsset[] = [...MEDIA_AVATARS, ...MEDIA_PHOTOS];

const BY_ID = new Map(MEDIA_LIBRARY.map((a) => [a.id, a] as const));
const BY_SRC = new Set(MEDIA_LIBRARY.map((a) => a.src));

/** Library asset data URL by id (templates reference assets by id). */
export function mediaSrc(id: string): string | null {
  return BY_ID.get(id)?.src ?? null;
}

/** True when the image is one of the built-in assets (kept in share links). */
export function isLibraryAsset(src: string | null | undefined): boolean {
  return !!src && BY_SRC.has(src);
}
