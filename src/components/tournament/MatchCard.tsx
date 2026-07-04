import type { Match } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

export function MatchCard({ match, onSelect }: { match: Match; onSelect?: (id: string) => void }) {
  const isFinal = match.status === "final";
  const isPending = match.status === "pending";
  const isReady = match.status === "ready";
  // "live" collapses into a neutral in-progress presentation.

  const railColor = isFinal
    ? "var(--finals)"
    : isPending
      ? "color-mix(in oklab, var(--border-strong) 60%, transparent)"
      : "var(--border-strong)";

  const statusLabel = isFinal ? "Final" : isPending ? "Pending" : "Ready";

  return (
    <button
      onClick={() => onSelect?.(match.id)}
      data-match-id={match.id}
      className="group relative block w-full text-left"
    >
      {/* Meta row (unskewed, sits above slab) */}
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <code className="truncate font-mono text-[10px] font-bold text-foreground/80">
            {match.id.toUpperCase()}
          </code>
          <span className="border border-border/70 px-1 py-px font-mono text-[9px] font-bold uppercase text-muted-foreground/80">
            Bo{match.bestOf}
          </span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 border px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wider",
            isFinal
              ? "border-finals/40 text-finals"
              : isReady
                ? "border-border-strong text-foreground/80"
                : "border-border text-muted-foreground/60",
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Skewed parallelogram slab */}
      <div className="relative slab-skew">
        {/* Hover accent shell */}
        <div className="pointer-events-none absolute -inset-px bg-white/[0.08] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div
          className="relative border border-border/70 bg-surface-1/85 slab-shadow"
          style={{
            borderLeft: `4px solid ${railColor}`,
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {match.entrants.map((e, i) => {
            const isWinner = e.winner;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex items-center justify-between gap-2 border-b border-border/50 last:border-b-0",
                  isWinner && "bg-[color-mix(in_oklab,var(--finals)_8%,transparent)]",
                )}
              >
                {/* Name block */}
                <div className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-3 pr-2 slab-unskew">
                  <span
                    className={cn(
                      "w-5 shrink-0 font-mono text-[10px] font-bold tabular-nums",
                      isWinner ? "text-finals" : "text-muted-foreground/50",
                    )}
                  >
                    {String(e.seed).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate font-heading text-[15px] font-black uppercase italic leading-none tracking-tight",
                        isWinner
                          ? "text-white"
                          : e.pending
                            ? "text-muted-foreground/50"
                            : "text-foreground/85",
                      )}
                    >
                      {e.name}
                    </div>
                    {e.city && (
                      <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-tight text-muted-foreground/55">
                        {e.city}
                      </div>
                    )}
                  </div>
                </div>
                {/* Score slab */}
                <div
                  className={cn(
                    "flex h-full min-w-[42px] items-center justify-center self-stretch px-3 py-2 font-heading text-xl font-black italic tabular-nums slab-unskew",
                    e.score == null
                      ? "bg-white/[0.03] text-muted-foreground/30"
                      : isWinner
                        ? "bg-finals text-[oklch(0.16_0.005_260)]"
                        : "bg-white/[0.05] text-foreground/70",
                  )}
                >
                  {e.score ?? "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}
