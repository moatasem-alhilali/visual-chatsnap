import type { Scenario } from "../types";
import { SCENARIO_VERSION } from "../data/defaults";
import { parseScenario } from "../validations/scenario";

const SAVE_SLOT_KEY = "rcss.savedScenario";
const DRAFT_KEY = "rcss.draft";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function saveScenarioSlot(scenario: Scenario): void {
  try {
    getStorage()?.setItem(SAVE_SLOT_KEY, JSON.stringify(scenario));
  } catch {
    /* ignore quota and privacy-mode errors */
  }
}

export function loadScenarioSlot(): Scenario | null {
  try {
    const raw = getStorage()?.getItem(SAVE_SLOT_KEY);
    if (!raw) return null;
    return { ...parseScenario(JSON.parse(raw)), version: SCENARIO_VERSION };
  } catch {
    return null;
  }
}

export function clearScenarioStorage(): void {
  try {
    const storage = getStorage();
    storage?.removeItem(SAVE_SLOT_KEY);
    storage?.removeItem(DRAFT_KEY);
  } catch {
    /* ignore storage errors */
  }
}
