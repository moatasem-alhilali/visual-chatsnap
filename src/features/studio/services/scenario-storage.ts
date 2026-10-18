const LEGACY_SLOT_KEY = "rcss.savedScenario";
const DRAFT_KEY = "rcss.draft";

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Remove the auto-saved draft (and the legacy single save slot). */
export function clearScenarioStorage(): void {
  try {
    const storage = getStorage();
    storage?.removeItem(LEGACY_SLOT_KEY);
    storage?.removeItem(DRAFT_KEY);
  } catch {
    /* ignore storage errors */
  }
}
