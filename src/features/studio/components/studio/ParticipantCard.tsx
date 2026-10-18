"use client";

import { useId } from "react";
import { Camera, X } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { useStudioStore } from "../../store";
import type { Person, Sender } from "../../types";
import { Avatar } from "../shared";
import type { StudioLabels } from "../labels";
import { MediaPicker } from "./MediaPicker";

/**
 * Round photo control: opens the media picker (upload or a built-in avatar)
 * and shows a small remove badge once a photo is set.
 */
export function AvatarField({
  person,
  size = 44,
  label,
  onChange,
  t,
  fallback,
}: {
  person: Person;
  size?: number;
  /** accessible name, e.g. "Change photo — Me" */
  label: string;
  onChange: (avatar: string | null) => void;
  t: StudioLabels;
  /** drawn instead of the initials avatar when there is no photo (e.g. a group icon) */
  fallback?: React.ReactNode;
}) {
  // small avatars (member rows) keep "remove" inside the picker instead of a corner badge
  const compact = size < 36;
  return (
    <div className="relative shrink-0">
      <MediaPicker value={person.avatar} onChange={onChange} t={t} label={label} prefer="avatar" maxDim={512} allowRemove={compact}>
        {(toggle, open) => (
          <Tooltip content={person.avatar ? t.changePhoto : t.mediaChoose}>
            <button
              type="button"
              onClick={toggle}
              aria-label={label}
              aria-haspopup="dialog"
              aria-expanded={open}
              className="group relative block cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {!person.avatar && fallback ? fallback : <Avatar person={person} size={size} />}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className={size < 36 ? "size-3" : "size-4"} />
              </span>
            </button>
          </Tooltip>
        )}
      </MediaPicker>
      {person.avatar && !compact && (
        <Tooltip content={t.removePhoto}>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`${t.removePhoto} — ${person.name || label}`}
            className="absolute -end-1 -top-1 flex size-[18px] cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <X className="size-3" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

export function ParticipantCard({ who, person, t }: { who: Sender; person: Person; t: StudioLabels }) {
  const updatePerson = useStudioStore((s) => s.updatePerson);
  const inputId = useId();
  const mine = who === "me";

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-studio-card">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 start-0 w-[3px] rounded-e-full",
          mine ? "bg-studio-me" : "bg-studio-them",
        )}
      />
      <AvatarField
        person={person}
        t={t}
        label={`${person.avatar ? t.changePhoto : t.mediaChoose} — ${mine ? t.meShort : t.themShort}`}
        onChange={(avatar) => updatePerson(who, { avatar })}
      />
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
