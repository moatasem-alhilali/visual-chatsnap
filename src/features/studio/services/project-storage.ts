import type { Device, Platform, Scenario } from "../types";
import { SCENARIO_VERSION, createId } from "../data/defaults";
import { parseScenario } from "../validations/scenario";

/**
 * Named projects saved in this browser (localStorage). An index holds the
 * light metadata used by the projects list; each scenario lives under its own
 * key so listing never parses large image data URLs.
 *
 * Privacy: projects never leave the browser. Not used for anything that
 * affects SEO, auth or pricing.
 */

const INDEX_KEY = "rcss.projects";
const ITEM_PREFIX = "rcss.project.";
const LEGACY_SLOT_KEY = "rcss.savedScenario";
const LEGACY_MIGRATED_KEY = "rcss.savedScenario.migrated";

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  platform: Platform;
  device: Device;
  messageCount: number;
  /** first line of the conversation, for the list */
  preview: string;
}

export type StorageResult<T> = { ok: true; value: T } | { ok: false; reason: "quota" | "unavailable" | "missing" };

const listeners = new Set<() => void>();
let cache: ProjectMeta[] | null = null;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function emit() {
  cache = null;
  listeners.forEach((l) => l());
}

/** Subscribe to changes of the project list (for useSyncExternalStore). */
export function subscribeProjects(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === INDEX_KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function isMeta(x: unknown): x is ProjectMeta {
  const m = x as ProjectMeta;
  return !!m && typeof m.id === "string" && typeof m.name === "string" && typeof m.updatedAt === "number";
}

function readIndex(): ProjectMeta[] {
  try {
    const raw = storage()?.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isMeta) : [];
  } catch {
    return [];
  }
}

function writeIndex(list: ProjectMeta[]): void {
  storage()?.setItem(INDEX_KEY, JSON.stringify(list));
}

function isQuota(e: unknown): boolean {
  return e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
}

function metaFor(id: string, name: string, scenario: Scenario, createdAt: number): ProjectMeta {
  const first = scenario.messages.find((m) => m.text.trim());
  return {
    id,
    name,
    createdAt,
    updatedAt: Date.now(),
    platform: scenario.platform,
    device: scenario.device,
    messageCount: scenario.messages.length,
    preview: first ? first.text.trim().slice(0, 80) : "",
  };
}

/** Projects, most recently updated first (cached snapshot). */
export function listProjects(): ProjectMeta[] {
  if (!cache) cache = readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
  return cache;
}

export function loadProject(id: string): Scenario | null {
  try {
    const raw = storage()?.getItem(ITEM_PREFIX + id);
    if (!raw) return null;
    return { ...parseScenario(JSON.parse(raw)), version: SCENARIO_VERSION };
  } catch {
    return null;
  }
}

function write(id: string, name: string, scenario: Scenario, createdAt: number): StorageResult<ProjectMeta> {
  const s = storage();
  if (!s) return { ok: false, reason: "unavailable" };
  const meta = metaFor(id, name, scenario, createdAt);
  try {
    s.setItem(ITEM_PREFIX + id, JSON.stringify(scenario));
    writeIndex([meta, ...readIndex().filter((p) => p.id !== id)]);
  } catch (e) {
    return { ok: false, reason: isQuota(e) ? "quota" : "unavailable" };
  }
  emit();
  return { ok: true, value: meta };
}

export function createProject(name: string, scenario: Scenario): StorageResult<ProjectMeta> {
  const now = Date.now();
  return write(createId(), name.trim() || "Untitled", scenario, now);
}

/** Overwrite a project's scenario (keeps its name). */
export function updateProject(id: string, scenario: Scenario): StorageResult<ProjectMeta> {
  const meta = readIndex().find((p) => p.id === id);
  if (!meta) return { ok: false, reason: "missing" };
  return write(id, meta.name, scenario, meta.createdAt);
}

export function renameProject(id: string, name: string): boolean {
  const clean = name.trim();
  if (!clean) return false;
  const list = readIndex();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  try {
    list[idx] = { ...list[idx], name: clean };
    writeIndex(list);
  } catch {
    return false;
  }
  emit();
  return true;
}

export function duplicateProject(id: string, name: string): StorageResult<ProjectMeta> {
  const scenario = loadProject(id);
  if (!scenario) return { ok: false, reason: "missing" };
  return createProject(name, scenario);
}

export function deleteProject(id: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(ITEM_PREFIX + id);
    writeIndex(readIndex().filter((p) => p.id !== id));
  } catch {
    /* ignore storage errors */
  }
  emit();
}

export function projectExists(id: string): boolean {
  return readIndex().some((p) => p.id === id);
}

/** Remove every project (used by "Clear data"). */
export function clearProjects(): void {
  const s = storage();
  if (!s) return;
  try {
    for (const p of readIndex()) s.removeItem(ITEM_PREFIX + p.id);
    s.removeItem(INDEX_KEY);
  } catch {
    /* ignore storage errors */
  }
  emit();
}

/**
 * One-time migration of the old single "saved copy" slot into a project, so
 * nothing saved before projects existed is lost.
 */
export function migrateLegacySlot(name: string): void {
  const s = storage();
  if (!s) return;
  try {
    if (s.getItem(LEGACY_MIGRATED_KEY)) return;
    const raw = s.getItem(LEGACY_SLOT_KEY);
    s.setItem(LEGACY_MIGRATED_KEY, "1");
    if (!raw) return;
    const scenario = { ...parseScenario(JSON.parse(raw)), version: SCENARIO_VERSION };
    const result = createProject(name, scenario);
    if (result.ok) s.removeItem(LEGACY_SLOT_KEY);
  } catch {
    /* ignore malformed legacy data */
  }
}
