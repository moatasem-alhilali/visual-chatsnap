"use client";

import { useMemo, useState } from "react";
import { ArrowRight, LayoutTemplate, MessagesSquare, Sparkles, Timer, Users } from "lucide-react";
import { useStudioUi } from "../../hooks/useStudioUi";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { cn } from "@/shared/lib/utils";
import type { Device, Scenario } from "../../types";
import { TEMPLATES, templateMessages, type ScenarioTemplate, type TemplateLang } from "../../data/templates";
import { dirOf } from "../shared";
import type { StudioLabels } from "../labels";
import { PlatformMark } from "./BrandMarks";
import { platformName } from "./Pickers";
import { fmt, formatSeconds, stepBounds } from "./timing";
import { messageSnippet } from "./snippet";

function TemplateCard({
  tpl,
  lang,
  device,
  t,
  onUse,
}: {
  tpl: ScenarioTemplate;
  lang: TemplateLang;
  device: Device;
  t: StudioLabels;
  onUse: () => void;
}) {
  const meta = t.templateItems[tpl.id];
  const content = tpl.content[lang];
  const messages = useMemo(() => templateMessages(tpl, lang), [tpl, lang]);
  const total = stepBounds(messages, { composeTyping: true }).at(-1) ?? 0;
  const preview = messages.slice(0, 3);
  const titleId = `tpl-${tpl.id}-title`;

  return (
    <li
      aria-labelledby={titleId}
      className="group flex min-w-0 flex-col rounded-xl border border-border bg-card p-3 shadow-studio-card transition-[border-color,box-shadow] duration-150 ease-studio hover:border-foreground/20 focus-within:border-primary/45"
    >
      <div className="flex items-start gap-2.5">
        <PlatformMark platform={tpl.platform} device={device} size={30} />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="flex min-w-0 items-center gap-1.5 text-[13.5px] font-semibold leading-5">
            <span className="truncate">{meta.title}</span>
            {content.group && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 text-[10.5px] font-medium leading-4 text-primary">
                <Users aria-hidden className="size-3" />
                {t.groupBadge}
              </span>
            )}
          </h3>
          <p className="truncate text-[11.5px] text-muted-foreground">
            {platformName(tpl.platform, device, t)} · <bdi>{content.group?.name ?? content.me}</bdi>
          </p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2lh] text-xs leading-relaxed text-muted-foreground">{meta.body}</p>

      <div
        aria-hidden
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="mt-2.5 flex flex-1 flex-col gap-1 rounded-lg bg-studio-canvas p-2"
      >
        {preview.map((m) => (
          <span
            key={m.id}
            dir={dirOf(m.text || "a")}
            className={cn(
              "max-w-[85%] truncate rounded-xl px-2 py-1 text-[11px] leading-4",
              m.sender === "me"
                ? "self-end rounded-ee-sm bg-primary text-primary-foreground"
                : "self-start rounded-es-sm bg-card text-foreground ring-1 ring-border",
            )}
          >
            {messageSnippet(m, t, 60)}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MessagesSquare className="size-3.5" />
          <span className="tabular-nums">{fmt(t.messagesCount, { count: messages.length })}</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Timer className="size-3.5" />
          <span className="tabular-nums" dir="ltr">
            {formatSeconds(total)}
            {t.seconds}
          </span>
        </span>
        <Button size="sm" onClick={onUse} className="ms-auto" aria-label={`${t.useTemplate}: ${meta.title}`}>
          {t.useTemplate}
        </Button>
      </div>
    </li>
  );
}

/** Gallery of ready-made marketing conversations (each use is one undo step). */
export function TemplateGallery({
  open,
  onOpenChange,
  t,
  locale,
  scenario,
  onUse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: StudioLabels;
  locale: "ar" | "en";
  scenario: Scenario;
  onUse: (tpl: ScenarioTemplate, lang: TemplateLang) => void;
}) {
  const [lang, setLang] = useState<TemplateLang>(locale);
  const openDialog = useStudioUi((s) => s.openDialog);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.templatesTitle}
      description={t.templatesHint}
      icon={<LayoutTemplate className="size-4" />}
      closeLabel={t.close}
      className="max-w-5xl"
    >
      <button
        type="button"
        onClick={() => openDialog("ai")}
        className="group mb-3 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2.5 text-start outline-none transition-[border-color,background-color] duration-150 ease-studio hover:border-primary/45 hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold text-foreground">{t.aiWrite}</span>
          <span className="block text-xs leading-snug text-muted-foreground">{t.aiWriteHint}</span>
        </span>
        <ArrowRight aria-hidden className="size-4 shrink-0 text-primary transition-transform duration-150 ease-studio group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      </button>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p id="tpl-lang" className="text-xs font-medium text-muted-foreground">
          {t.templateLanguage}
        </p>
        <SegmentedControl<TemplateLang>
          aria-labelledby="tpl-lang"
          size="sm"
          value={lang}
          onChange={setLang}
          className="w-auto [&>button]:flex-none [&>button]:px-3"
          options={[
            { value: "ar", label: "العربية" },
            { value: "en", label: "English" },
          ]}
        />
      </div>
      <ul className="grid grid-cols-1 gap-3 pb-1 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            tpl={tpl}
            lang={lang}
            device={scenario.device}
            t={t}
            onUse={() => onUse(tpl, lang)}
          />
        ))}
      </ul>
    </Dialog>
  );
}
