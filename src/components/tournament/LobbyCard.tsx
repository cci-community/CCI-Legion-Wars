import type { Lobby, PlayerState } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { playerMatchesFilter, type LobbyFilter } from "./RoundFilterChips";

const STATE_LABEL_TONE: Record<PlayerState, string> = {
  pending: "text-muted-foreground/55",
  advance: "text-[color:var(--tab-accent)]",
  finals: "text-finals",
  wildcard: "text-wildcard",
  eliminated: "text-muted-foreground/45",
  live: "text-muted-foreground/70",
};

function isVisibleSeededPlayer(name: string) {
  return !/^awaiting\s+(player|qualifier)$/i.test(name.trim());
}

export function LobbyCard({
  lobby,
  accentVar,
  filter = "all",
  onSelect,
}: {
  lobby: Lobby;
  accentVar: string;
  filter?: LobbyFilter;
  onSelect?: (id: string) => void;
}) {
  // "live" collapses into a neutral in-progress presentation.
  const isFinal = lobby.status === "Final" || lobby.status === "Qualified";
  const isPending = lobby.status === "Pending";
  const isReady = lobby.status === "Ready" || lobby.status === "Live";

  const statusLabel = isFinal ? lobby.status : isPending ? "Pending" : "Ready";
  const seededPlayers = lobby.players.filter((player) => isVisibleSeededPlayer(player.name));
  const seededLabel =
    seededPlayers.length === 1 ? "1 Player Seeded" : `${seededPlayers.length} Players Seeded`;

  const railColor = isFinal
    ? `color-mix(in oklab, var(${accentVar}) 65%, transparent)`
    : isReady
      ? "var(--border-strong)"
      : "color-mix(in oklab, var(--border-strong) 55%, transparent)";

  return (
    <button onClick={() => onSelect?.(lobby.id)} className="group relative block w-full text-left">
      {/* Meta rail */}
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <code className="truncate font-mono text-[10px] font-bold tracking-tight text-foreground/85">
          {lobby.id.toUpperCase()}
        </code>
        <span
          className={cn(
            "flex items-center gap-1 border px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wider",
            isFinal
              ? "border-[color:var(--tab-accent)]/40 text-[color:var(--tab-accent)]"
              : isReady
                ? "border-border-strong text-foreground/80"
                : "border-border text-muted-foreground/60",
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Skewed slab */}
      <div className="relative slab-skew">
        <div className="pointer-events-none absolute -inset-px bg-white/[0.06] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div
          className="relative border border-border/70 bg-surface-1/85 slab-shadow"
          style={{
            borderLeft: `4px solid ${railColor}`,
            opacity: isPending && seededPlayers.length === 0 ? 0.55 : 1,
          }}
        >
          {isPending ? (
            <div className="px-3 py-2.5 slab-unskew">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/65">
                  {seededLabel}
                </span>
                {seededPlayers.length > 0 && (
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[color:var(--tab-accent)]/80">
                    Seeded
                  </span>
                )}
              </div>

              {seededPlayers.length > 0 ? (
                <ul className="space-y-1">
                  {seededPlayers.map((p, i) => (
                    <li
                      key={`${p.seed}-${p.name}-${i}`}
                      className="flex min-w-0 items-center justify-between gap-2 border-t border-border/35 pt-1.5 first:border-t-0 first:pt-0"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-5 shrink-0 text-center font-mono text-[9px] font-bold tabular-nums text-muted-foreground/55">
                          {String(p.rank ?? p.seed).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-heading text-[12px] font-black uppercase italic leading-tight tracking-tight text-foreground/90">
                            {p.name}
                          </div>
                          {(p.city || p.region) && (
                            <div className="mt-px truncate font-mono text-[8px] uppercase tracking-tight text-muted-foreground/55">
                              {p.city}
                              {p.region && <span className="ml-1 opacity-60">/ {p.region}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-tighter text-muted-foreground/50">
                        {p.stateLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Awaiting seed data
                </span>
              )}
            </div>
          ) : (
            <ul>
              {lobby.players.map((p, i) => {
                const dim = !playerMatchesFilter(p.state, filter);
                const isAdvance = p.state === "advance" || p.state === "finals";
                const isWild = p.state === "wildcard";
                const isElim = p.state === "eliminated";
                return (
                  <li
                    key={i}
                    className={cn(
                      "relative flex items-center justify-between gap-2 border-b border-border/40 last:border-b-0 transition-opacity",
                      isAdvance && "bg-[color-mix(in_oklab,var(--tab-accent)_8%,transparent)]",
                      isWild && "bg-[color-mix(in_oklab,var(--wildcard)_7%,transparent)]",
                      dim && "opacity-25",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-3 pr-2 slab-unskew">
                      <span
                        className={cn(
                          "w-5 shrink-0 text-center font-mono text-[10px] font-bold tabular-nums",
                          isAdvance
                            ? "text-[color:var(--tab-accent)]"
                            : isWild
                              ? "text-wildcard"
                              : "text-muted-foreground/55",
                        )}
                      >
                        {String(p.rank ?? p.seed).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate font-heading text-[13px] font-black uppercase italic leading-tight tracking-tight",
                            isElim &&
                              "line-through decoration-eliminated/60 text-muted-foreground/50",
                            (isAdvance || p.state === "live") && "text-white",
                            !isAdvance && !isElim && "text-foreground/85",
                          )}
                        >
                          {p.name}
                        </div>
                        <div className="mt-px truncate font-mono text-[9px] uppercase tracking-tight text-muted-foreground/55">
                          {p.city}
                          {p.region && <span className="ml-1 opacity-60">/ {p.region}</span>}
                        </div>
                      </div>
                    </div>
                    {p.score != null ? (
                      <div
                        className={cn(
                          "flex min-w-[38px] items-center justify-center self-stretch px-3 font-heading text-base font-black italic tabular-nums slab-unskew",
                          isAdvance
                            ? "bg-[color-mix(in_oklab,var(--tab-accent)_65%,transparent)] text-[oklch(0.16_0.005_260)]"
                            : "bg-white/[0.05] text-foreground/80",
                        )}
                      >
                        {String(p.score).padStart(2, "0")}
                      </div>
                    ) : (
                      <div className="flex min-w-[52px] items-center justify-center px-2 slab-unskew">
                        <span
                          className={cn(
                            "font-mono text-[9px] font-bold uppercase tracking-tighter",
                            STATE_LABEL_TONE[p.state],
                          )}
                        >
                          {p.stateLabel}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {(isFinal || isReady) &&
        lobby.players.some((p) => p.state === "finals" || p.state === "wildcard") && (
          <div className="mt-1 flex items-center justify-between px-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/55">
            <span>1—2 · Finals</span>
            <span className="opacity-40">→</span>
            <span>3—4 · Wildcard</span>
          </div>
        )}
    </button>
  );
}
