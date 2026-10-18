// TEMP-VERIFY: removed before hand-off.
import type { StatusBarConfig } from "../../types";

function q(): URLSearchParams | null {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
}


export function vSb(sb: StatusBarConfig): StatusBarConfig {
  const p = q();
  if (!p) return sb;
  return {
    ...sb,
    time: p.get("sbtime") ?? sb.time,
    battery: p.get("sbbat") ? Number(p.get("sbbat")) : sb.battery,
    batteryPct: p.get("sbpct") ? p.get("sbpct") === "1" : sb.batteryPct,
    cellular: p.get("sbcell") ? p.get("sbcell") === "1" : sb.cellular,
  };
}
