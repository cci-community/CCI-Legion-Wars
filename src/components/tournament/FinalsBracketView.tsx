import { Fragment } from "react";
import type { FinalsView, Match } from "@/lib/tournament-data";
import { MatchCard } from "./MatchCard";
import { RoundSpine, type SpineStep } from "./RoundSpine";
import { Trophy } from "lucide-react";

const TOTAL_SLOTS = 8;
const isGrandFinalRound = (title: string) => /grand\s*final/i.test(title);

export function FinalsBracketView({
  finals,
  onSelectMatch,
}: {
  finals: FinalsView;
  onSelectMatch?: (id: string) => void;
}) {
  const totalMatches = finals.bracket.rounds.reduce((a, r) => a + r.matches.length, 0);
  const grandFinal = finals.bracket.rounds.at(-1)?.matches[0];
  const champion = grandFinal?.entrants.find((entrant) => entrant.winner && !entrant.pending);

  const currentIdx = finals.bracket.rounds.findIndex((r) =>
    r.matches.some((m) => m.status === "ready" || m.status === "live"),
  );
  const spineSteps: SpineStep[] = finals.bracket.rounds.map((r, i) => ({
    key: r.title,
    label: `R${String(i + 1).padStart(2, "0")}`,
    sub: r.title.replace(/^Round\s+\d+\s*·?\s*/i, "").slice(0, 8),
    status:
      currentIdx < 0
        ? i === finals.bracket.rounds.length - 1
          ? "current"
          : "done"
        : i < currentIdx
          ? "done"
          : i === currentIdx
            ? "current"
            : "future",
  }));
  spineSteps.push({
    key: "champ",
    label: "CHMP",
    sub: "Trophy",
    status: "future",
  });

  const roundCount = finals.bracket.rounds.length;
  // Build grid template: alternating round + connector, then champion column.
  const columns: string[] = [];
  for (let i = 0; i < roundCount; i++) {
    columns.push("minmax(180px, 1fr)");
    columns.push("28px"); // connector column (also before champion)
  }
  columns.push("240px"); // champion (fixed, compact)

  return (
    <div className="fade-in space-y-6">
      <RoundSpine steps={spineSteps} accentVar="--finals" />

      {/* Tactical finals header */}
      <div className="relative overflow-hidden border border-border/70 bg-surface-1/60 slash-band">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-finals" />
        <div className="absolute right-6 top-4 hidden font-mono text-[10px] tracking-widest text-muted-foreground/40 sm:block">
          PUBLIC VIEW // NATIONAL FINALS
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-6 px-4 py-5 sm:px-6 sm:py-6">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-finals" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-finals">
                // Legion Wars · S01 · Championship
              </span>
            </div>
            <h1 className="public-hero-title-reset font-heading text-5xl font-black uppercase italic leading-none tracking-tighter text-white sm:text-6xl">
              Grand{" "}
              <span className="bg-gradient-to-r from-finals to-white/60 bg-clip-text text-transparent">
                Bracket
              </span>
            </h1>
          </div>
          <div className="flex items-stretch border border-border/70 bg-surface-0/60 slab-shadow">
            <HStat label="Phase" value={finals.bracket.phase} accent="text-finals" />
            <HStat label="Format" value={finals.bracket.mode} border />
            <HStat label="Matches" value={String(totalMatches)} border />
          </div>
        </div>
      </div>

      {/* Mobile: stacked rounds list */}
      <div className="space-y-5 lg:hidden">
        {finals.bracket.rounds.map((round, ri) => (
          <section key={round.title} className="space-y-2">
            <header className="border-l-2 border-finals/80 pl-3">
              <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-finals">
                // Round {String(ri + 1).padStart(2, "0")}
              </span>
              <h3
                className={
                  (isGrandFinalRound(round.title) ? "public-hero-title-reset " : "") +
                  "mt-0.5 font-heading text-xl font-black uppercase italic tracking-tighter text-white"
                }
              >
                {round.title.replace(/^Round\s+\d+\s*·?\s*/i, "")}
              </h3>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                {round.matches.length} match{round.matches.length === 1 ? "" : "es"}
              </span>
            </header>
            <div className="space-y-2">
              {round.matches.map((m) => (
                <MatchCard key={m.id} match={m} onSelect={onSelectMatch} />
              ))}
            </div>
          </section>
        ))}
        <section className="relative border border-finals/50 bg-surface-0 p-5 slab-shadow">
          <div className="flex items-center gap-3">
            <div className="relative grid h-14 w-14 shrink-0 rotate-45 place-items-center border-2 border-finals bg-[color-mix(in_oklab,var(--finals)_10%,transparent)]">
              <Trophy className="h-5 w-5 -rotate-45 text-finals" />
            </div>
            <div className="min-w-0">
              <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-finals">
                Grand Finals
              </span>
              <h4 className="public-hero-title-reset font-heading text-2xl font-black uppercase italic tracking-tighter text-white">
                {champion?.name ?? "Champion Awaiting"}
              </h4>
              {champion?.city && (
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                  {champion.city}
                </span>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-finals" />
          <div className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-finals" />
        </section>
      </div>

      {/* Desktop: bracket board with connectors */}
      <div className="relative hidden overflow-hidden border border-border bg-surface-1/40 p-3 sm:p-5 lg:block">
        <div className="pointer-events-none absolute inset-0 hex-grid" aria-hidden />
        <div className="pointer-events-none absolute inset-0 scanlines opacity-70" aria-hidden />
        <div className="relative -mx-1 overflow-x-auto px-1 pb-2">
          <div
            className="grid min-w-[1180px] gap-x-2 lg:min-w-0 lg:gap-x-3"
            style={{
              gridTemplateColumns: columns.join(" "),
              gridTemplateRows: "auto minmax(560px, 1fr)",
            }}
          >
            {finals.bracket.rounds.map((round, ri) => {
              const colStart = ri * 2 + 1; // 1-based
              return (
                <Fragment key={round.title}>
                  <header
                    className="mb-4 border-l-2 border-finals/80 pl-3"
                    style={{ gridColumn: colStart, gridRow: 1 }}
                  >
                    <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-finals">
                      // Round {String(ri + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className={
                        (isGrandFinalRound(round.title) ? "public-hero-title-reset " : "") +
                        "mt-0.5 font-heading text-2xl font-black uppercase italic tracking-tighter text-white"
                      }
                    >
                      {round.title.replace(/^Round\s+\d+\s*·?\s*/i, "")}
                    </h3>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                      {round.matches.length} match{round.matches.length === 1 ? "" : "es"}
                    </span>
                  </header>
                  <RoundBody matches={round.matches} onSelect={onSelectMatch} colStart={colStart} />
                  {/* Connector column immediately to the right */}
                  <ConnectorColumn
                    fromCount={round.matches.length}
                    toCount={
                      ri < roundCount - 1
                        ? finals.bracket.rounds[ri + 1].matches.length
                        : 1 /* finals → champion */
                    }
                    colStart={colStart + 1}
                    isChampion={ri === roundCount - 1}
                  />
                </Fragment>
              );
            })}

            {/* Champion header + body */}
            <header
              className="mb-4 border-l-2 border-finals pl-3"
              style={{ gridColumn: roundCount * 2 + 1, gridRow: 1 }}
            >
              <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-finals">
                // Winner Crowning
              </span>
              <h3 className="public-hero-title-reset mt-0.5 font-heading text-2xl font-black uppercase italic tracking-tighter text-white">
                Champion
              </h3>
            </header>
            <div className="relative" style={{ gridColumn: roundCount * 2 + 1, gridRow: 2 }}>
              <div className="relative flex h-full items-center justify-center">
                {/* Subtle radial spotlight backdrop */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(closest-side at 50% 50%, color-mix(in oklab, var(--finals) 18%, transparent) 0%, transparent 70%)",
                  }}
                  aria-hidden
                />
                {/* Radiating rays */}
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i / 12) * Math.PI * 2;
                    const x2 = 50 + Math.cos(a) * 60;
                    const y2 = 50 + Math.sin(a) * 60;
                    return (
                      <line
                        key={i}
                        x1="50"
                        y1="50"
                        x2={x2}
                        y2={y2}
                        stroke="oklch(0.85 0.16 88)"
                        strokeWidth="0.3"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>

                <div className="relative z-10 w-full max-w-[220px] px-1">
                  {/* Trophy diamond */}
                  <div className="mx-auto grid h-20 w-20 rotate-45 place-items-center border-2 border-finals bg-[color-mix(in_oklab,var(--finals)_12%,var(--surface-0))] shadow-[0_0_40px_-6px_var(--finals)]">
                    <Trophy className="h-7 w-7 -rotate-45 text-finals" />
                  </div>

                  {/* Plaque */}
                  <div className="relative mt-5 border border-finals/50 bg-surface-0/90 slab-shadow">
                    <div className="pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-finals" />
                    <div className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-finals" />
                    <div className="px-4 py-4 text-center">
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-finals">
                        // Season 01
                      </span>
                      <h4 className="mt-1 font-heading text-2xl font-black uppercase italic leading-none tracking-tighter text-white">
                        {champion?.name ?? "Awaiting"}
                      </h4>
                      <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                        {champion?.city ?? "Winner of GF · M1"}
                      </span>
                      <div className="mx-auto mt-3 h-[3px] w-10 bg-finals" />
                    </div>
                  </div>

                  {/* Meta ticks */}
                  <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <span className="h-1 w-1 bg-finals" />
                      Champion
                    </span>
                    <span>Legion Wars</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoundBody({
  matches,
  onSelect,
  colStart,
}: {
  matches: Match[];
  onSelect?: (id: string) => void;
  colStart: number;
}) {
  const span = TOTAL_SLOTS / matches.length;
  return (
    <div
      className="grid"
      style={{
        gridColumn: colStart,
        gridRow: 2,
        gridTemplateRows: `repeat(${TOTAL_SLOTS}, 1fr)`,
      }}
    >
      {matches.map((m, mi) => (
        <div
          key={m.id}
          className="flex min-h-0 items-center px-0.5"
          style={{ gridRow: `${mi * span + 1} / span ${span}` }}
        >
          <div className="w-full">
            <MatchCard match={m} onSelect={onSelect} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SVG L-connectors: for each pair of source matches, draws two
 * horizontal stubs, joins them with a vertical bar, then a single
 * horizontal to the target's centerline. viewBox is normalized to
 * 100×TOTAL_SLOTS so vertical positions are exact regardless of
 * grid pixel height.
 */
function ConnectorColumn({
  fromCount,
  toCount,
  colStart,
  isChampion,
}: {
  fromCount: number;
  toCount: number;
  colStart: number;
  isChampion?: boolean;
}) {
  const pairSize = fromCount / toCount; // usually 2, or 1 when finals → champion
  return (
    <div
      className="relative hidden lg:block"
      style={{ gridColumn: colStart, gridRow: 2 }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${TOTAL_SLOTS}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`c-grad-${colStart}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.85 0.16 88 / 0.55)" />
            <stop offset="100%" stopColor="oklch(0.85 0.16 88 / 0.95)" />
          </linearGradient>
        </defs>
        {Array.from({ length: toCount }, (_, j) => {
          const rowsPerSource = TOTAL_SLOTS / fromCount;
          const y1 = (j * pairSize + 0.5) * rowsPerSource;
          const y2 = ((j + 1) * pairSize - 0.5) * rowsPerSource;
          const yT = (y1 + y2) / 2;
          const stroke = `url(#c-grad-${colStart})`;
          const sw = 1.6;
          if (pairSize === 1) {
            // straight-through (finals → champion)
            return (
              <line
                key={j}
                x1="0"
                y1={yT}
                x2="100"
                y2={yT}
                stroke={stroke}
                strokeWidth={sw}
                vectorEffect="non-scaling-stroke"
              />
            );
          }
          return (
            <g key={j}>
              <line
                x1="0"
                y1={y1}
                x2="50"
                y2={y1}
                stroke={stroke}
                strokeWidth={sw}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="0"
                y1={y2}
                x2="50"
                y2={y2}
                stroke={stroke}
                strokeWidth={sw}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="50"
                y1={y1}
                x2="50"
                y2={y2}
                stroke={stroke}
                strokeWidth={sw}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="50"
                y1={yT}
                x2="100"
                y2={yT}
                stroke={stroke}
                strokeWidth={sw}
                vectorEffect="non-scaling-stroke"
              />
              {/* junction dots */}
              <circle cx="50" cy={yT} r="0.9" fill="oklch(0.85 0.16 88)" />
            </g>
          );
        })}
        {/* Trophy hint for champion connector */}
        {isChampion && <circle cx="95" cy={TOTAL_SLOTS / 2} r="1.2" fill="oklch(0.85 0.16 88)" />}
      </svg>
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
