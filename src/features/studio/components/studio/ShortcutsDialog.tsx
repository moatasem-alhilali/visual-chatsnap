"use client";

import { Keyboard } from "lucide-react";

import { Dialog } from "@/shared/components/ui/dialog";
import { Kbd } from "@/shared/components/ui/input";
import type { StudioLabels } from "../labels";

/** Platform-appropriate label for the primary modifier key. */
export function modKey(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
}

export function ShortcutsDialog({
  open,
  onOpenChange,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: StudioLabels;
}) {
  const mod = modKey();
  const groups: { title: string; rows: { label: string; keys: string[] }[] }[] = [
    {
      title: t.scPlayback,
      rows: [
        { label: t.scPlayPause, keys: ["Space"] },
        { label: t.scRestart, keys: ["R"] },
      ],
    },
    {
      title: t.scEditing,
      rows: [
        { label: t.scNewMessage, keys: ["N"] },
        { label: t.scAdd, keys: ["Enter"] },
        { label: t.scAddSwitch, keys: [mod, "Enter"] },
        { label: t.scMove, keys: ["Alt", "↑ ↓"] },
        { label: t.scDuplicate, keys: [mod, "D"] },
        { label: t.scDelete, keys: ["Del"] },
        { label: t.scUndo, keys: [mod, "Z"] },
        { label: t.scRedo, keys: [mod, "Shift", "Z"] },
      ],
    },
    {
      title: t.scGeneral,
      rows: [
        { label: t.scSave, keys: [mod, "S"] },
        { label: t.scRecord, keys: ["F"] },
        { label: t.scExport, keys: ["E"] },
        { label: t.scHelp, keys: ["?"] },
      ],
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.shortcuts}
      description={t.shortcutsHint}
      icon={<Keyboard className="size-4" />}
      closeLabel={t.close}
    >
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{g.title}</p>
            <ul className="divide-y divide-border/70 rounded-lg border border-border">
              {g.rows.map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                  <span>{r.label}</span>
                  <span className="flex shrink-0 items-center gap-1" dir="ltr">
                    {r.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
