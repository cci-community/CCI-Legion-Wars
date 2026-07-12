import { ArrowRight, Users, Zap, Trophy, Crown } from "lucide-react";
import type { ViewKey } from "@/lib/tournament-helpers";
import { type GroupView, type TournamentData } from "@/lib/tournament-data";

function groupProgress(g: GroupView) {
  let decided = 0;
  let total = 0;
  g.progression.rounds.forEach((r) =>
    r.lobbies.forEach((l) =>
      l.players.forEach((p) => {
        total += 1;
        if (p.state !== "pending") decided += 1;
      }),
    ),
  );
  const roundIdx = g.progression.rounds.findIndex((r) =>
    r.lobbies.some((l) => l.status === "Live" || l.status === "Ready"),
  );
  const firstDecidedRound = g.progression.rounds.findIndex((r) =>
    r.lobbies.some((l) => l.players.some((p) => p.state !== "pending")),
  );
  const activeRound = roundIdx >= 0 ? roundIdx : firstDecidedRound >= 0 ? firstDecidedRound : 0;
  return { decided, total, activeRound, pct: total ? Math.round((decided / total) * 100) : 0 };
}

export function OverviewMap({
  onNavigate,
  data,
}: {
  onNavigate: (v: ViewKey) => void;
  data: TournamentData;
}) {
  const groups = [
    { data: data.groupTitan, key: "titan" as ViewKey, accent: "--titan" },
    { data: data.groupNexus, key: "nexus" as ViewKey, accent: "--nexus" },
    { data: data.groupDominion, key: "dominion" as ViewKey, accent: "--dominion" },
  ];

  const finalsMatches = data.finalsView.bracket.rounds.reduce((a, r) => a + r.matches.length, 0);
  const groupProgressRows = groups.map((group) => ({
    ...group,
    progress: groupProgress(group.data),
  }));
  const listedPlayers = 192;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden border border-border/70 bg-surface-1/60 slash-band">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-foreground" />
        <div className="absolute right-6 top-4 hidden font-mono text-[10px] tracking-widest text-muted-foreground/40 sm:block">
          PUBLIC VIEW // TOURNAMENT ROUTE
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-6 px-4 py-5 sm:px-6 sm:py-6">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-foreground" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/80">
                // Legion Wars · S01 · Overview
              </span>
            </div>
            <h1 className="public-hero-title-reset font-heading text-5xl font-black uppercase italic leading-none tracking-tighter text-white sm:text-6xl">
              Tournament{" "}
              <span className="bg-gradient-to-r from-finals via-white/70 to-foreground/40 bg-clip-text text-transparent">
                Map
              </span>
            </h1>
          </div>
          <div className="flex items-stretch border border-border/70 bg-surface-0/60 slab-shadow">
            <HStat label="Stages" value="04" />
            <HStat label="Players" value={String(listedPlayers || "—")} border />
            <HStat label="Finalists" value="16" border accent="text-finals" />
            <HStat label="Champion" value="01" border />
          </div>
        </div>
      </div>

      {/* Group tier */}
      <section className="space-y-3">
        <StageLabel
          n="01"
          title="Group Stage"
          sub={`${listedPlayers || "—"} public players · 3 divisions · 4 rounds`}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {groupProgressRows.map((g) => {
            const p = g.progress;
            return (
              <button
                key={g.key}
                onClick={() => onNavigate(g.key)}
                className="group relative overflow-hidden border border-border/70 bg-surface-1 text-left slab-shadow transition-transform hover:-translate-y-0.5"
                style={{ borderLeft: `3px solid var(${g.accent})` }}
              >
                <div className="pointer-events-none absolute inset-0 slash-band opacity-40" />
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 opacity-30 blur-2xl"
                  style={{ background: `var(${g.accent})` }}
                />
                <div className="relative flex items-start gap-3 p-4">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center border-2"
                    style={{
                      borderColor: `var(${g.accent})`,
                      background: `color-mix(in oklab, var(${g.accent}) 12%, transparent)`,
                    }}
                  >
                    <Users className="h-4 w-4" style={{ color: `var(${g.accent})` }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                      Division
                    </div>
                    <div
                      className="mt-0.5 font-heading text-2xl font-black uppercase italic leading-none tracking-tight"
                      style={{ color: `var(${g.accent})` }}
                    >
                      {g.data.label.replace(/^Group\s+/i, "")}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <div className="relative grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
                  <MiniStat label="Round" value={String(p.activeRound + 1).padStart(2, "0")} />
                  <MiniStat label="Decided" value={`${p.decided}/${p.total}`} />
                  <MiniStat label="Progress" value={`${p.pct}%`} />
                </div>
                {/* progress bar */}
                <div className="relative h-[3px] w-full bg-white/[0.05]">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${p.pct}%`, background: `var(${g.accent})` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Wildcard */}
      <section className="space-y-3">
        <StageLabel n="02" title="Wildcard Pool" sub="Rank 5–8 fight for the last 4 seats" />
        <button
          onClick={() => onNavigate("wildcard")}
          className="group relative block w-full overflow-hidden border border-border/70 bg-surface-1 text-left slab-shadow transition-transform hover:-translate-y-0.5"
          style={{ borderLeft: "3px solid var(--wildcard)" }}
        >
          <div className="pointer-events-none absolute inset-0 slash-band opacity-40" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-wildcard/15 to-transparent" />
          <div className="relative grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="grid h-11 w-11 place-items-center border-2 border-wildcard bg-wildcard-soft/40">
              <Zap className="h-5 w-5 text-wildcard" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Last Chance Route
              </div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <div className="font-heading text-2xl font-black uppercase italic tracking-tight text-wildcard">
                  {data.wildcardView.poolCount} → {data.wildcardView.finalSlots}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  Pool locks after Group R4
                </div>
              </div>
            </div>
            <ArrowRight className="hidden h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
          </div>
        </button>
      </section>

      {/* Finals + Champion */}
      <section className="space-y-3">
        <StageLabel n="03" title="National Finals" sub="16-player single elimination · Best of 3" />
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
          <button
            onClick={() => onNavigate("finals")}
            className="group relative overflow-hidden border border-border/70 bg-surface-1 text-left slab-shadow transition-transform hover:-translate-y-0.5"
            style={{ borderLeft: "3px solid var(--finals)" }}
          >
            <div className="pointer-events-none absolute inset-0 hex-grid opacity-50" />
            <div className="relative flex items-center gap-3 p-4">
              <div className="grid h-11 w-11 place-items-center border-2 border-finals bg-[color-mix(in_oklab,var(--finals)_10%,transparent)]">
                <Trophy className="h-5 w-5 text-finals" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  Bracket
                </div>
                <div className="mt-0.5 font-heading text-2xl font-black uppercase italic tracking-tight text-white">
                  Grand Bracket
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  {finalsMatches} matches · 4 rounds
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </button>

          {/* connector chevron */}
          <div className="hidden items-center justify-center md:flex">
            <div className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
              <div className="h-px w-6 bg-border-strong" />
              <ArrowRight className="h-3 w-3" />
              <div className="h-px w-6 bg-border-strong" />
            </div>
          </div>

          <div className="relative overflow-hidden border border-finals/60 bg-[color-mix(in_oklab,var(--finals)_5%,var(--surface-1))] slab-shadow">
            <div className="pointer-events-none absolute inset-0 hex-grid opacity-60" />
            <div
              className="pointer-events-none absolute -inset-8 opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--finals), transparent 60%)" }}
            />
            <div className="relative flex items-center gap-3 p-4">
              <div className="relative grid h-11 w-11 rotate-45 place-items-center border-2 border-finals bg-[color-mix(in_oklab,var(--finals)_15%,transparent)]">
                <Crown className="h-5 w-5 -rotate-45 text-finals" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-finals">
                  Winner Crowning
                </div>
                <div className="mt-0.5 font-heading text-2xl font-black uppercase italic tracking-tight text-white">
                  Champion
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  01 winner · Awaiting
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HStat({
  label,
  value,
  accent,
  border,
}: {
  label: string;
  value: string;
  accent?: string;
  border?: boolean;
}) {
  return (
    <div className={"px-4 py-3 sm:px-5 " + (border ? "border-l border-border/70" : "")}>
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </div>
      <div
        className={
          "mt-0.5 font-heading text-2xl font-black uppercase italic tabular-nums tracking-tight " +
          (accent ?? "text-white")
        }
      >
        {value}
      </div>
    </div>
  );
}

function StageLabel({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b-2 border-border/50 pb-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
        // Stage {n}
      </span>
      <h2 className="font-heading text-xl font-black uppercase italic tracking-tight text-foreground">
        {title}
      </h2>
      <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 md:inline">
        {sub}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2">
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[13px] font-bold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
