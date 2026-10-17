"use client";

import { useId, useRef } from "react";
import { Camera, X } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useStudioStore } from "../../store";
import type { Person, Sender } from "../../types";
import { Avatar } from "../shared";
import type { StudioLabels } from "../labels";
import { readImageFile } from "./image-utils";

export function ParticipantCard({ who, person, t }: { who: Sender; person: Person; t: StudioLabels }) {
  const updatePerson = useStudioStore((s) => s.updatePerson);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const mine = who === "me";

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    updatePerson(who, { avatar: await readImageFile(file, 512) });
  };

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-studio-card">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 start-0 w-[3px] rounded-e-full",
          mine ? "bg-studio-me" : "bg-studio-them",
        )}
      />
      <div className="relative shrink-0">
        <Tooltip content={person.avatar ? t.changePhoto : t.upload}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={`${person.avatar ? t.changePhoto : t.upload} — ${mine ? t.meShort : t.themShort}`}
            className="group relative block cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Avatar person={person} size={44} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-4" />
            </span>
          </button>
        </Tooltip>
        {person.avatar && (
          <Tooltip content={t.removePhoto}>
            <button
              type="button"
              onClick={() => updatePerson(who, { avatar: null })}
              aria-label={t.removePhoto}
              className="absolute -end-1 -top-1 flex size-[18px] cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <X className="size-3" />
            </button>
          </Tooltip>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          tabIndex={-1}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", mine ? "bg-studio-me" : "bg-studio-them")} />
          {mine ? t.meRole : t.themRole}
        </label>
        <Input
          id={inputId}
          value={person.name}
          onChange={(e) => updatePerson(who, { name: e.target.value })}
          placeholder={t.name}
          dir="auto"
          className="h-8 text-[13px] font-medium"
        />
      </div>
    </div>
  );
}
