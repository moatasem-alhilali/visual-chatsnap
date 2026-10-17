"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** Collapsible settings group with an icon, a title and a collapsed summary. */
export function PanelSection({
  icon,
  title,
  summary,
  defaultOpen = true,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="border-b border-border/70 last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((o) => !o)}
          className="group flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-start outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/30"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-inset ring-border/60 transition-colors group-hover:text-foreground [&_svg]:size-3.5">
            {icon}
          </span>
          <span className="text-[13px] font-semibold text-foreground">{title}</span>
          {summary && (
            <span
              className={cn(
                "ms-auto truncate text-xs text-muted-foreground transition-opacity duration-200",
                open ? "opacity-0" : "opacity-100",
              )}
            >
              {summary}
            </span>
          )}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-studio",
              !summary && "ms-auto",
              open ? "rotate-0" : "-rotate-90 rtl:rotate-90",
            )}
          />
        </button>
      </h3>
      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-studio",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pt-0.5 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Small uppercase label used inside sections. */
export function FieldLabel({ children, htmlFor, id }: { children: React.ReactNode; htmlFor?: string; id?: string }) {
  const cls = "mb-1.5 block text-xs font-medium text-muted-foreground";
  return htmlFor ? (
    <label htmlFor={htmlFor} id={id} className={cls}>
      {children}
    </label>
  ) : (
    <p id={id} className={cls}>
      {children}
    </p>
  );
}
