"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, Copy, ImageOff, Link2, LoaderCircle, RotateCcw, Share2, ShieldCheck } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { toast } from "@/shared/components/ui/toast";
import type { Scenario } from "../../types";
import { copyText, createShareLink, type ShareResult } from "../../services/share-link";
import type { StudioLabels } from "../labels";
import { fmt } from "./timing";

/** Links longer than this may be cut by some chat apps / email clients. */
const LONG_LINK = 8000;

type State = { status: "loading" } | { status: "ready"; result: ShareResult } | { status: "error" };

/** Share the scenario as a self-contained link (the chat lives in the URL hash). */
export function ShareDialog({
  open,
  onOpenChange,
  t,
  scenario,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: StudioLabels;
  scenario: Scenario;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const linkId = useId();
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const build = useCallback(() => {
    setState({ status: "loading" });
    createShareLink(scenario, window.location.href)
      .then((result) => setState({ status: "ready", result }))
      .catch(() => setState({ status: "error" }));
  }, [scenario]);

  useEffect(() => {
    // generate once per opening (the dialog is mounted only while open)
    let alive = true;
    createShareLink(scenario, window.location.href)
      .then((result) => alive && setState({ status: "ready", result }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => {
    if (state.status !== "ready") return;
    const ok = await copyText(state.result.url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      toast({ title: t.shareCopied, variant: "success" });
    } else {
      inputRef.current?.focus();
      inputRef.current?.select();
      toast({ title: t.shareCopyFailed, variant: "destructive" });
    }
  };

  const nativeShare = async () => {
    if (state.status !== "ready") return;
    try {
      await navigator.share({ title: t.shareTitle, url: state.result.url });
    } catch {
      /* cancelled */
    }
  };

  const result = state.status === "ready" ? state.result : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.shareTitle}
      description={t.shareHint}
      icon={<Link2 className="size-4" />}
      closeLabel={t.close}
      className="max-w-lg"
      footer={
        <>
          {canShare && (
            <Button variant="outline" onClick={() => void nativeShare()} disabled={!result} className="gap-1.5">
              <Share2 className="size-4" />
              {t.shareNative}
            </Button>
          )}
          <Button onClick={() => void copy()} disabled={!result} className="gap-1.5">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t.shareCopiedShort : t.shareCopy}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor={linkId} className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t.shareLink}
          </label>
          {state.status === "error" ? (
            <div role="alert" className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {t.shareError}
              <Button variant="outline" size="xs" onClick={build} className="gap-1">
                <RotateCcw className="size-3.5" />
                {t.retry}
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                id={linkId}
                ref={inputRef}
                data-autofocus
                readOnly
                value={result?.url ?? ""}
                placeholder={t.shareGenerating}
                onFocus={(e) => e.currentTarget.select()}
                dir="ltr"
                className="h-9 pe-9 font-mono text-xs"
              />
              {state.status === "loading" && (
                <LoaderCircle aria-hidden className="absolute end-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
          {result && (
            <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
              {fmt(t.shareLength, { count: result.url.length.toLocaleString() })}
              {result.url.length > LONG_LINK && ` · ${t.shareLong}`}
            </p>
          )}
        </div>

        {result && result.droppedImages > 0 && (
          <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            <ImageOff className="mt-0.5 size-3.5 shrink-0" />
            {fmt(t.shareImagesDropped, { count: result.droppedImages })}
          </p>
        )}

        <p className="flex items-start gap-2 rounded-lg bg-muted/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          {t.sharePrivacy}
        </p>
      </div>
    </Dialog>
  );
}
