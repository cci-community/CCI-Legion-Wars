import type { GroupView, PlayerState } from "@/lib/tournament-data";
import { LobbyCard } from "./LobbyCard";
import { RoundFilterChips, type LobbyFilter } from "./RoundFilterChips";
import { RoundSpine, type SpineStep } from "./RoundSpine";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

const ACCENT_VAR: Record<GroupView["accent"], string> = {
  titan: "--titan",
  nexus: "--nexus",
  dominion: "--dominion",
};

function roundProgress(round: GroupView["progression"]["rounds"][number]) {
  const total = round.players;
  let decided = 0;
  round.lobbies.forEach((l) =>
    l.players.forEach((p) => {
      if (p.state !== "pending") decided += 1;
    }),
  );
  return { decided, total, pct: Math.round((decided / total) * 100) };
}

function countStates(group: GroupView) {
  const counts: Record<Exclude<LobbyFilter, "all">, number> = {
    live: 0,
    advance: 0,
    pending: 0,
    eliminated: 0,
  };
  group.progression.rounds.forEach((r) =>
    r.lobbies.forEach((l) =>
      l.players.forEach((p: { state: PlayerState }) => {
        if (p.state === "live") counts.live++;
        else if (p.state === "advance" || p.state === "finals") counts.advance++;
        else if (p.state === "pending") counts.pending++;
        else if (p.state === "eliminated" || p.state === "wildcard") counts.eliminated++;
      }),
    ),
  );
  return counts;
}

export function GroupProgressionView({
  group,
  onSelectLobby,
}: {
  group: GroupView;
  onSelectLobby?: (id: string) => void;
}) {
  const accentVar = ACCENT_VAR[group.accent];
  const [filter, setFilter] = useState<LobbyFilter>("all");
  const counts = useMemo(() => countStates(group), [group]);

  const activeRoundIdx = group.progression.rounds.findIndex((r) =>
    r.lobbies.some((l) => l.status === "Live"),
  );
  const currentIdx =
    activeRoundIdx >= 0
      ? activeRoundIdx
      : Math.max(
          0,
          group.progression.rounds.findIndex((r) => r.lobbies.some((l) => l.status !== "Pending")),
        );

  const spineSteps: SpineStep[] = group.progression.rounds.map((r, i) => ({
    key: r.title,
    label: `R${String(i + 1).padStart(2, "0")}`,
    sub: `${r.lobbies.length} lob`,
    status: i < currentIdx ? "done" : i === currentIdx ? "current" : "future",
  }));

  return (
    <div className="fade-in space-y-6">
      <RoundSpine steps={spineSteps} accentVar={accentVar} />
      {/* Tactical group header */}
      <div className="relative">
        <div className="relative overflow-hidden border border-border/70 bg-surface-1/60 slash-band">
          <div
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ background: `var(${accentVar})` }}
          />
          <div className="absolute right-6 top-4 hidden font-mono text-[10px] tracking-widest text-muted-foreground/40 sm:block">
            PUBLIC VIEW // {group.label.toUpperCase()}
          </div>
          <div className="relative flex flex-wrap items-end justify-between gap-6 px-4 py-5 sm:px-6 sm:py-6">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5" style={{ background: `var(${accentVar})` }} />
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.28em]"
                  style={{ color: `var(${accentVar})` }}
                >
                  // Legion Wars · Group Stage
                </span>
              </div>
              <h1 className="font-heading text-5xl font-black uppercase italic leading-none tracking-tighter text-white sm:text-6xl">
                {group.label.replace(/^Group\s+/i, "").split(" ")[0]}

                <span
                  className="ml-2 bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(90deg, var(${accentVar}), rgba(255,255,255,0.35))`,
                  }}
                >
                  Division
                </span>
              </h1>
            </div>

            <div className="flex items-stretch border border-border/70 bg-surface-0/60 slab-shadow">
              {group.status.slice(0, 3).map((s, i) => (
                <div
                  key={s.label}
                  className={"px-4 py-3 sm:px-5 " + (i > 0 ? "border-l border-border/70" : "")}
                >
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {s.label}
                  </div>
                  <div
                    className="mt-0.5 font-heading text-2xl font-black uppercase italic tabular-nums tracking-tight text-white"
                    style={{ color: i === 1 ? `var(${accentVar})` : undefined }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RoundFilterChips value={filter} onChange={setFilter} counts={counts} />
        <div className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 sm:flex">
          <kbd>tap</kbd>
          <span>lobby for details</span>
        </div>
      </div>

      {/* Rounds grid */}
      <div className="-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-2 lg:mx-0 lg:snap-none lg:overflow-visible lg:px-0">
        <div className="grid gap-5 lg:grid-cols-4">
          {group.progression.rounds.map((round, ri) => {
            const p = roundProgress(round);
            const hasLive = round.lobbies.some((l) => l.status === "Live");
            const allPending = round.lobbies.every((l) => l.status === "Pending");
            const inProgress = !allPending && p.pct < 100;
            const isCurrent = ri === currentIdx;
            const isFuture = ri > currentIdx;

            const railColor = isCurrent
              ? `var(${accentVar})`
              : isFuture
                ? "var(--border-strong)"
                : `color-mix(in oklab, var(${accentVar}) 55%, transparent)`;

            return (
              <section
                key={round.title}
                className="min-w-[280px] snap-start space-y-3 lg:min-w-0 lg:snap-align-none"
              >
                {/* Tactical round header */}
                <header className="relative">
                  <div className="border-l-[3px] pl-3" style={{ borderColor: railColor }}>
                    <span
                      className={
                        "block font-mono text-[10px] font-bold uppercase tracking-[0.24em] " +
                        (isFuture ? "text-muted-foreground/50" : "")
                      }
                      style={{
                        color: isFuture ? undefined : `var(${accentVar})`,
                      }}
                    >
                      // Round {String(ri + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className={
                        "mt-0.5 font-heading text-2xl font-black uppercase italic tracking-tighter " +
                        (isFuture ? "text-muted-foreground/70" : "text-white")
                      }
                    >
                      {round.title.replace(/^Round\s+\d+\s*·?\s*/i, "")}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-[2px] flex-1 bg-white/[0.06]">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${p.pct}%`,
                            background: `var(${accentVar})`,
                            boxShadow: hasLive ? `0 0 6px 0 var(${accentVar})` : undefined,
                            opacity: 0.9,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[9px] font-bold tabular-nums text-muted-foreground/60">
                        {p.decided}/{p.total}
                      </span>
                    </div>
                  </div>
                </header>

                <div className="space-y-2">
                  {round.lobbies.map((lobby) => (
                    <LobbyCard
                      key={lobby.id}
                      lobby={lobby}
                      accentVar={accentVar}
                      filter={filter}
                      onSelect={onSelectLobby}
                    />
                  ))}

                  {round.lobbies.length === 0 && (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 border border-dashed border-border/60 clip-chamfer-sm">
                      <span className="text-tactical text-[9px] text-muted-foreground/50">
                        Awaiting bracket data
                      </span>
                    </div>
                  )}
                  {inProgress && hasLive === false && allPending === false && (
                    <div className="flex items-center justify-center gap-2 border border-border/40 bg-surface-1/30 py-2.5 clip-chamfer-sm">
                      <Loader2
                        className="h-3 w-3 animate-spin"
                        style={{ color: `var(${accentVar})` }}
                      />
                      <span className="text-tactical text-[9px] text-muted-foreground/70">
                        Awaiting next lobby
                      </span>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
