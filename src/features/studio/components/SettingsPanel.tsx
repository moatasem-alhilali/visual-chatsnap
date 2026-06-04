"use client";

import { useRef } from "react";
import { ArrowLeftRight, Upload, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useStudioStore } from "../store";
import type { Person, Scenario, Sender } from "../types";
import { ANDROID_FONTS } from "../data/fonts";
import { PLATFORMS } from "./platforms";
import { Avatar } from "./shared";
import type { StudioLabels } from "./labels";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PersonEditor({ who, person, t }: { who: Sender; person: Person; t: StudioLabels }) {
  const updatePerson = useStudioStore((s) => s.updatePerson);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updatePerson(who, { avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold">{who === "me" ? t.me : t.them}</p>
      <div className="flex items-center gap-3">
        <Avatar person={person} size={44} />
        <div className="flex-1 space-y-2">
          <input
            value={person.name}
            onChange={(e) => updatePerson(who, { name: e.target.value })}
            placeholder={t.name}
            dir="auto"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="flex gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 px-2 text-xs" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3" />
              {t.upload}
            </Button>
            {person.avatar && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-destructive" onClick={() => updatePerson(who, { avatar: null })}>
                <X className="size-3" />
                {t.remove}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel({ scenario, t }: { scenario: Scenario; t: StudioLabels }) {
  const setPlatform = useStudioStore((s) => s.setPlatform);
  const setDevice = useStudioStore((s) => s.setDevice);
  const setTheme = useStudioStore((s) => s.setTheme);
  const setPresence = useStudioStore((s) => s.setPresence);
  const setLastSeenText = useStudioStore((s) => s.setLastSeenText);
  const setAndroidFont = useStudioStore((s) => s.setAndroidFont);
  const swapRoles = useStudioStore((s) => s.swapRoles);

  return (
    <div className="space-y-5">
      <Section title={t.platform}>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => {
            const active = scenario.platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-foreground/30"
                }`}
              >
                <span className="size-3 rounded-full" style={{ background: p.accent }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t.device}>
        <Segmented
          value={scenario.device}
          onChange={setDevice}
          options={[
            { value: "iphone", label: t.iphone },
            { value: "android", label: t.android },
          ]}
        />
        {scenario.device === "android" && (
          <div className="mt-2">
            <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{t.font}</span>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {ANDROID_FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAndroidFont(f.id)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    scenario.androidFont === f.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title={t.chatTheme}>
        <Segmented
          value={scenario.theme}
          onChange={setTheme}
          options={[
            { value: "light", label: t.light },
            { value: "dark", label: t.dark },
          ]}
        />
      </Section>

      <Section title={t.presence}>
        <Segmented
          value={scenario.presence}
          onChange={setPresence}
          options={[
            { value: "online", label: t.online },
            { value: "typing", label: t.typing },
            { value: "lastseen", label: t.lastSeen },
          ]}
        />
        {scenario.presence === "lastseen" && (
          <input
            value={scenario.lastSeenText}
            onChange={(e) => setLastSeenText(e.target.value)}
            placeholder={t.lastSeenText}
            dir="auto"
            className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        )}
      </Section>

      <Section title={t.people}>
        <div className="space-y-2">
          <PersonEditor who="me" person={scenario.me} t={t} />
          <PersonEditor who="them" person={scenario.them} t={t} />
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={swapRoles}>
            <ArrowLeftRight className="size-4" />
            {t.swapRoles}
          </Button>
        </div>
      </Section>
    </div>
  );
}
