"use client";

import { useId, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Check, ClipboardPaste, Copy, ExternalLink, Sparkles, TriangleAlert, Wand2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Label, Textarea } from "@/shared/components/ui/input";
import { SegmentedControl } from "@/shared/components/ui/segmented";
import { toast } from "@/shared/components/ui/toast";
import { cn } from "@/shared/lib/utils";
import { buildAiPrompt, parseAiReply, type AiLength, type AiWarning } from "../../services/ai-scenario";
import { useStudioStore } from "../../store";
import type { Device, Platform } from "../../types";
import { PLATFORM_MAP, PLATFORMS } from "../platforms";
import { PlatformMark } from "./BrandMarks";

type Lang = "ar" | "en";

const T = {
  ar: {
    title: "إنشاء سيناريو بالذكاء الاصطناعي",
    desc: "انسخ البرومبت لأي نموذج (ChatGPT أو Claude أو Gemini)، تكلّم معه عن فكرتك، ثم الصق رده النهائي هنا ليُطبَّق كل شيء تلقائيًا.",
    close: "إغلاق",
    step1: "١ · انسخ البرومبت",
    step2: "٢ · الصق الرد",
    idea: "فكرتك (اختياري)",
    ideaPh: "مثال: إعلان لمتجر عطور، عميلة تسأل عن عطر هدية لزوجها، عرض خصم ٢٠٪ والتوصيل اليوم…",
    app: "التطبيق",
    auto: "يختاره الذكاء الاصطناعي",
    device: "الجهاز",
    iphone: "آيفون",
    android: "سامسونج",
    length: "طول المحادثة",
    short: "قصيرة",
    medium: "متوسطة",
    long: "طويلة",
    chatLang: "لغة المحادثة",
    arabic: "العربية",
    english: "English",
    prompt: "البرومبت",
    copy: "نسخ البرومبت",
    copied: "تم نسخ البرومبت",
    copiedHint: "الصقه في ChatGPT أو أي نموذج، وبعد ما يجهّز الرد النهائي ارجع للخطوة ٢.",
    open: "افتح",
    next: "التالي: لصق الرد",
    howTo: "اكتب للنموذج «أنشئ» متى ما كنت جاهز، وسيرد بملف JSON واحد. الصق رده كاملًا هنا (حتى لو فيه كلام قبل أو بعد).",
    reply: "رد الذكاء الاصطناعي",
    replyPh: "الصق هنا رد النموذج الذي يحتوي على ```json …```",
    paste: "لصق من الحافظة",
    apply: "تطبيق السيناريو",
    applied: "تم تطبيق السيناريو",
    undo: "تراجع",
    replaceNote: "سيستبدل المحادثة الحالية، ويمكنك التراجع.",
    msgs: "رسالة",
    group: "مجموعة",
    members: "أعضاء",
    light: "فاتح",
    dark: "داكن",
    errors: {
      empty: "الصق رد النموذج أولًا.",
      noJson: "لم أجد ملف JSON في الرد. اطلب من النموذج: «أنشئ الملف الآن بصيغة JSON فقط».",
      noMessages: "الملف لا يحتوي على رسائل.",
      invalid: "الملف غير صالح. اطلب من النموذج إعادة إرساله كاملًا.",
    },
    warn: {
      repaired: "أصلحتُ أخطاء بسيطة في صياغة الملف تلقائيًا.",
      unknownPlatform: (v: string) => `التطبيق «${v}» غير معروف، استُخدم التطبيق الحالي.`,
      unknownType: (i: number, v: string) => `الرسالة ${i}: النوع «${v}» غير معروف، عُرضت كنص.`,
      addedMember: (n: string) => `أُضيف «${n}» كعضو في المجموعة.`,
      badReply: (i: number) => `الرسالة ${i}: الرد يشير إلى رسالة غير موجودة، تم تجاهله.`,
      imagesPlaceholder: (c: number) => `${c} صورة ستظهر كصورة بديلة؛ ارفع صورك من محرر الرسالة.`,
      dropped: (i: number) => `الرسالة ${i} غير صالحة وتم تجاهلها.`,
    },
  },
  en: {
    title: "Create a scenario with AI",
    desc: "Copy the prompt into any model (ChatGPT, Claude, Gemini), talk through your idea, then paste its final reply here and everything is applied automatically.",
    close: "Close",
    step1: "1 · Copy the prompt",
    step2: "2 · Paste the reply",
    idea: "Your idea (optional)",
    ideaPh: "e.g. Ad for a perfume store: a customer asks for a gift for her husband, 20% off and same-day delivery…",
    app: "App",
    auto: "Let the AI choose",
    device: "Device",
    iphone: "iPhone",
    android: "Samsung",
    length: "Length",
    short: "Short",
    medium: "Medium",
    long: "Long",
    chatLang: "Chat language",
    arabic: "العربية",
    english: "English",
    prompt: "Prompt",
    copy: "Copy prompt",
    copied: "Prompt copied",
    copiedHint: "Paste it into ChatGPT or any model; when it gives the final reply, come back to step 2.",
    open: "Open",
    next: "Next: paste the reply",
    howTo: "Tell the model \"generate\" when you're ready and it replies with one JSON block. Paste its whole reply here (extra text around it is fine).",
    reply: "AI reply",
    replyPh: "Paste the model's reply containing ```json …```",
    paste: "Paste from clipboard",
    apply: "Apply scenario",
    applied: "Scenario applied",
    undo: "Undo",
    replaceNote: "Replaces the current chat. You can undo.",
    msgs: "messages",
    group: "Group",
    members: "members",
    light: "Light",
    dark: "Dark",
    errors: {
      empty: "Paste the model's reply first.",
      noJson: "No JSON found in the reply. Ask the model: \"Generate the file now as JSON only\".",
      noMessages: "The file has no messages.",
      invalid: "The file isn't valid. Ask the model to send it again in full.",
    },
    warn: {
      repaired: "Small formatting mistakes in the file were fixed automatically.",
      unknownPlatform: (v: string) => `Unknown app "${v}", kept the current app.`,
      unknownType: (i: number, v: string) => `Message ${i}: unknown type "${v}", shown as text.`,
      addedMember: (n: string) => `Added "${n}" as a group member.`,
      badReply: (i: number) => `Message ${i}: reply points to a missing message, ignored.`,
      imagesPlaceholder: (c: number) => `${c} photo(s) will show a placeholder — upload yours in the message editor.`,
      dropped: (i: number) => `Message ${i} was invalid and skipped.`,
    },
  },
} as const;

const AI_LINKS = [
  { name: "ChatGPT", url: "https://chatgpt.com/" },
  { name: "Claude", url: "https://claude.ai/new" },
  { name: "Gemini", url: "https://gemini.google.com/app" },
];

function warningText(w: AiWarning, s: (typeof T)[Lang]): string {
  switch (w.code) {
    case "repaired":
      return s.warn.repaired;
    case "unknownPlatform":
      return s.warn.unknownPlatform(w.value);
    case "unknownType":
      return s.warn.unknownType(w.index, w.value);
    case "addedMember":
      return s.warn.addedMember(w.name);
    case "badReply":
      return s.warn.badReply(w.index);
    case "imagesPlaceholder":
      return s.warn.imagesPlaceholder(w.count);
    case "dropped":
      return s.warn.dropped(w.index);
  }
}

const fieldCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

/** "Create with AI": copy a prompt for any chat model, then paste its JSON reply back. */
export function AiScenarioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const locale = useLocale();
  const ui: Lang = locale === "en" ? "en" : "ar";
  const s = T[ui];
  const ids = { idea: useId(), app: useId(), device: useId(), reply: useId(), prompt: useId() };

  const scenario = useStudioStore((st) => st.scenario);
  const loadScenario = useStudioStore((st) => st.loadScenario);
  const undo = useStudioStore((st) => st.undo);

  const [step, setStep] = useState<"prompt" | "reply">("prompt");
  const [idea, setIdea] = useState("");
  const [platform, setPlatform] = useState<Platform | "auto">("auto");
  const [device, setDevice] = useState<Device | "auto">("auto");
  const [length, setLength] = useState<AiLength>("medium");
  const [chatLang, setChatLang] = useState<Lang>(ui);
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState("");

  const prompt = useMemo(
    () => buildAiPrompt({ lang: chatLang, idea, platform, device, length, meName: scenario.me.name }),
    [chatLang, idea, platform, device, length, scenario.me.name],
  );
  const parsed = useMemo(() => (reply.trim() ? parseAiReply(reply, scenario) : null), [reply, scenario]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // fallback: select the text so the user can copy it manually
      const el = document.getElementById(ids.prompt) as HTMLTextAreaElement | null;
      el?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    toast({ title: s.copied, description: s.copiedHint, variant: "success" });
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setReply(text);
    } catch {
      document.getElementById(ids.reply)?.focus();
    }
  };

  const apply = () => {
    if (!parsed?.ok) return;
    loadScenario(parsed.scenario);
    toast({ title: s.applied, variant: "success", action: { label: s.undo, onClick: undo } });
    onOpenChange(false);
    setReply("");
    setStep("prompt");
  };

  const result = parsed && parsed.ok ? parsed : null;
  const sum = result?.scenario;
  const appLabel = sum
    ? sum.platform === "imessage" && sum.device === "android"
      ? "Samsung Messages"
      : PLATFORM_MAP[sum.platform].label
    : "";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={s.title}
      description={s.desc}
      icon={<Sparkles className="size-4" />}
      closeLabel={s.close}
      className="max-w-2xl"
      footer={
        step === "prompt" ? (
          <>
            <Button variant="outline" onClick={() => void copyPrompt()} className="gap-1.5">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {s.copy}
            </Button>
            <Button onClick={() => setStep("reply")} className="gap-1.5">
              {s.next}
            </Button>
          </>
        ) : (
          <>
            <span className="me-auto hidden text-xs text-muted-foreground sm:inline">{s.replaceNote}</span>
            <Button variant="outline" onClick={() => setStep("prompt")}>
              {s.step1}
            </Button>
            <Button onClick={apply} disabled={!result} className="gap-1.5">
              <Wand2 className="size-4" />
              {s.apply}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <SegmentedControl<"prompt" | "reply">
          aria-label={s.title}
          value={step}
          onChange={setStep}
          options={[
            { value: "prompt", label: s.step1 },
            { value: "reply", label: s.step2 },
          ]}
        />

        {step === "prompt" ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor={ids.idea} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {s.idea}
              </Label>
              <Textarea
                id={ids.idea}
                data-autofocus
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={s.ideaPh}
                rows={3}
                dir="auto"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={ids.app} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {s.app}
                </Label>
                <select
                  id={ids.app}
                  className={fieldCls}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform | "auto")}
                >
                  <option value="auto">{s.auto}</option>
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor={ids.device} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {s.device}
                </Label>
                <select
                  id={ids.device}
                  className={fieldCls}
                  value={device}
                  onChange={(e) => setDevice(e.target.value as Device | "auto")}
                >
                  <option value="auto">{s.auto}</option>
                  <option value="iphone">{s.iphone}</option>
                  <option value="android">{s.android}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{s.length}</span>
                <SegmentedControl<AiLength>
                  aria-label={s.length}
                  size="sm"
                  value={length}
                  onChange={setLength}
                  options={[
                    { value: "short", label: s.short },
                    { value: "medium", label: s.medium },
                    { value: "long", label: s.long },
                  ]}
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{s.chatLang}</span>
                <SegmentedControl<Lang>
                  aria-label={s.chatLang}
                  size="sm"
                  value={chatLang}
                  onChange={setChatLang}
                  options={[
                    { value: "ar", label: s.arabic },
                    { value: "en", label: s.english },
                  ]}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={ids.prompt} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {s.prompt}
              </Label>
              <Textarea
                id={ids.prompt}
                readOnly
                value={prompt}
                rows={7}
                dir="ltr"
                className="font-mono text-[11.5px] leading-relaxed text-muted-foreground"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {AI_LINKS.map((l) => (
                <Button key={l.name} asChild variant="soft" size="xs" className="gap-1">
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    {s.open} {l.name}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">{s.howTo}</p>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <Label htmlFor={ids.reply} className="text-xs font-medium text-muted-foreground">
                  {s.reply}
                </Label>
                <Button variant="ghost" size="xs" onClick={() => void pasteFromClipboard()} className="gap-1">
                  <ClipboardPaste className="size-3.5" />
                  {s.paste}
                </Button>
              </div>
              <Textarea
                id={ids.reply}
                data-autofocus
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={s.replyPh}
                rows={8}
                dir="ltr"
                className="font-mono text-xs"
              />
            </div>

            {parsed && !parsed.ok && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{s.errors[parsed.error]}</span>
              </div>
            )}

            {result && sum && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3" aria-live="polite">
                <div className="flex items-center gap-3">
                  <PlatformMark platform={sum.platform} device={sum.device} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" dir="auto">
                      {result.title ?? appLabel}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {appLabel} · {sum.device === "iphone" ? s.iphone : s.android} · {sum.theme === "dark" ? s.dark : s.light} ·{" "}
                      {sum.messages.length} {s.msgs}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground" dir="auto">
                  {sum.group ? (
                    <>
                      <bdi className="font-medium text-foreground">{s.group}: {sum.group.name}</bdi> · {sum.group.members.length + 1} {s.members}
                    </>
                  ) : (
                    <>
                      <bdi className="font-medium text-foreground">{sum.me.name}</bdi> ⇄ <bdi className="font-medium text-foreground">{sum.them.name}</bdi>
                    </>
                  )}
                </div>
                <ol className="max-h-32 space-y-1 overflow-y-auto text-xs">
                  {sum.messages.slice(0, 6).map((m, i) => (
                    <li key={m.id} className={cn("truncate", m.sender === "me" ? "text-primary" : "text-foreground")} dir="auto">
                      <span className="text-muted-foreground">{i + 1}. </span>
                      {m.type === "text" || m.type === "sticker" || (m.type === "image" && m.text) ? m.text : `[${m.type}]`}
                    </li>
                  ))}
                  {sum.messages.length > 6 && <li className="text-muted-foreground">…</li>}
                </ol>
                {result.warnings.length > 0 && (
                  <ul className="space-y-1 border-t border-border pt-2 text-xs text-amber-700 dark:text-amber-400">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="flex gap-1.5">
                        <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                        {warningText(w, s)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
