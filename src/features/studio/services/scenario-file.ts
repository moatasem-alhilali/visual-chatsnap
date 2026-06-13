import type { Scenario } from "../types";
import { SCENARIO_VERSION } from "../data/defaults";
import { parseScenario } from "../validations/scenario";

const EXPORT_FILENAME = "chat-scenario.json";

export function downloadScenarioJson(scenario: Scenario): void {
  const blob = new Blob([JSON.stringify(scenario, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = EXPORT_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readScenarioFile(file: File): Promise<Scenario> {
  const text = await file.text();
  return { ...parseScenario(JSON.parse(text)), version: SCENARIO_VERSION };
}
