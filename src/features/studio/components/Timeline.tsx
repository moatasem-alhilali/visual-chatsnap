import type { Scenario } from "../types";
import type { StudioLabels } from "./labels";

interface TimelineItem {
  id: string;
  index: number;
  at: string;
  mine: boolean;
  preview: string;
}

function buildTimelineItems(scenario: Scenario): TimelineItem[] {
  let cumulative = 0;
  return scenario.messages.map((message, index) => {
    cumulative += message.delayMs + (message.sender === "them" ? message.typingMs : 0);
    return {
      id: message.id,
      index,
      at: (cumulative / 1000).toFixed(1),
      mine: message.sender === "me",
      preview: message.type === "voice" ? "🎤" : message.text.slice(0, 22) || "…",
    };
  });
}

export function Timeline({ scenario, t }: { scenario: Scenario; t: StudioLabels }) {
  const items = buildTimelineItems(scenario);

  return (
    <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.timeline}
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex min-w-[120px] shrink-0 flex-col gap-1 rounded-lg border p-2 ${
              item.mine ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>#{item.index + 1}</span>
              <span>
                {item.at}
                {t.seconds}
              </span>
            </div>
            <span className="truncate text-xs" dir="auto">
              {item.preview}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <span className="py-3 text-xs text-muted-foreground">{t.empty}</span>
        )}
      </div>
    </div>
  );
}
