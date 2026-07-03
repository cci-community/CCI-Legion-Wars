import { allLiveItems, type ViewKey } from "@/lib/tournament-helpers";
import { Radio, Layers } from "lucide-react";

interface Props {
  onSelect: (opts: { view: ViewKey; lobby?: string; match?: string }) => void;
}

export function LiveTicker({ onSelect }: Props) {
  const items = allLiveItems();
  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-live/30 bg-[color-mix(in_oklab,var(--live)_4%,var(--surface-1))]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center gap-1.5 bg-gradient-to-r from-[color-mix(in_oklab,var(--live)_4%,var(--surface-1))] via-[color-mix(in_oklab,var(--live)_4%,var(--surface-1))_80%] to-transparent pl-3 pr-6">
        <Radio className="h-3 w-3 text-live live-dot" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-live">
          Live
        </span>
      </div>
      <div className="relative flex overflow-hidden py-2 pl-24">
        <div className="flex shrink-0 items-center gap-6 whitespace-nowrap marquee">
          {[...items, ...items, ...items].map((it, i) => (
            <button
              key={`${it.id}-${i}`}
              onClick={() =>
                onSelect(
                  it.type === "match"
                    ? { view: it.view, match: it.id }
                    : { view: it.view, lobby: it.id },
                )
              }
              className="flex items-center gap-2 text-xs transition-opacity hover:opacity-100"
            >
              <Layers className="h-3 w-3 text-muted-foreground/60" />
              <code className="font-mono text-[10px] text-muted-foreground">{it.label}</code>
              <span className="text-foreground/85">{it.detail}</span>
              <span className="h-1 w-1 rounded-full bg-border-strong" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
