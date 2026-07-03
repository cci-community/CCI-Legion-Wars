import { cn } from "@/lib/utils";
import type { PlayerState } from "@/lib/tournament-data";

export type LobbyFilter = "all" | "live" | "advance" | "pending" | "eliminated";

const FILTERS: { key: LobbyFilter; label: string; dotClass?: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live", dotClass: "bg-live" },
  { key: "advance", label: "Advancing", dotClass: "bg-advance" },
  { key: "pending", label: "Pending", dotClass: "bg-muted-foreground/60" },
  { key: "eliminated", label: "Out", dotClass: "bg-eliminated" },
];

export function RoundFilterChips({
  value,
  onChange,
  counts,
}: {
  value: LobbyFilter;
  onChange: (v: LobbyFilter) => void;
  counts: Record<Exclude<LobbyFilter, "all">, number>;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface-1 p-1">
      {FILTERS.map((f) => {
        const active = value === f.key;
        const count = f.key === "all" ? undefined : counts[f.key];
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium tracking-tight transition-colors",
              active
                ? "bg-surface-3 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.dotClass && <span className={cn("h-1 w-1 rounded-full", f.dotClass)} />}
            <span>{f.label}</span>
            {count != null && (
              <span
                className={cn(
                  "font-mono text-[9px] tabular-nums",
                  active ? "text-muted-foreground" : "text-muted-foreground/60",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function playerMatchesFilter(state: PlayerState, filter: LobbyFilter) {
  if (filter === "all") return true;
  if (filter === "live") return state === "live";
  if (filter === "advance") return state === "advance" || state === "finals";
  if (filter === "pending") return state === "pending";
  if (filter === "eliminated") return state === "eliminated" || state === "wildcard";
  return true;
}
