import arMessages from "../../../../dictionary/ar.json";
import enMessages from "../../../../dictionary/en.json";

/**
 * Studio UI strings. The source of truth is the `studio` namespace in
 * `dictionary/<locale>.json`; this module only gives the editor a typed,
 * synchronous object. The English shape defines the contract and the Arabic
 * dictionary must provide every key (checked at compile time below).
 */
export type StudioLabels = (typeof enMessages)["studio"];

const ar: StudioLabels = arMessages.studio;
const en: StudioLabels = enMessages.studio;

export const STUDIO_LABELS: Record<"ar" | "en", StudioLabels> = { ar, en };
