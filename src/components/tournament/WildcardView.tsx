import type { WildcardFinalSlot, WildcardPlayer } from "@/lib/tournament-data";
import { Zap, ArrowRight, Trophy } from "lucide-react";

const GROUP_COLOR: Record<WildcardPlayer["sourceGroup"], string> = {
  Titan: "titan",
  Nexus: "nexus",
  Dominion: "dominion",
};

export function WildcardView({
  players,
  finalSlots,
  poolCount,
  finalSlotPlayers,
}: {
  players: WildcardPlayer[];
  finalSlots: number;
  poolCount: number;
  finalSlotPlayers?: WildcardFinalSlot[];
}) {
  const byGroup = {
    Titan: players.filter((p) => p.sourceGroup === "Titan"),
    Nexus: players.filter((p) => p.sourceGroup === "Nexus"),
    Dominion: players.filter((p) => p.sourceGroup === "Dominion"),
  };

  return (
    <div className="fade-in space-y-6">
      {/* Tactical wildcard header */}
      <div className="relative overflow-hidden border-l-[3px] border-wildcard bg-surface-1">
        <div className="pointer-events-none absolute inset-0 slash-band opacity-60" />
        <div className="pointer-events-none absolute -right-16 top-0 h-full w-64 bg-gradient-to-l from-wildcard/15 to-transparent" />
        <div className="relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              <span className="h-1.5 w-1.5 bg-wildcard" />
              // Legion Wars · Last Chance
            </div>
            <h2 className="public-hero-title-reset mt-1.5 font-heading text-5xl font-black uppercase italic leading-none tracking-tighter text-foreground md:text-6xl">
              WILDCARD
              <span className="text-wildcard"> POOL</span>
            </h2>
          </div>
          <div className="flex items-stretch gap-0 divide-x divide-border/60 border border-border/60 bg-surface-0">
            <div className="px-4 py-2.5">
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Stage
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 font-heading text-lg font-bold uppercase italic tracking-tight text-wildcard">
                <Zap className="h-4 w-4" /> Pool
              </div>
            </div>
            <div className="px-4 py-2.5">
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Pool Size
              </div>
              <div className="mt-0.5 font-mono text-lg font-bold tabular-nums text-foreground">
                {poolCount}
              </div>
            </div>
            <div className="px-4 py-2.5">
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Advancing
              </div>
              <div className="mt-0.5 font-mono text-lg font-bold tabular-nums text-wildcard">
                {finalSlots}
              </div>
            </div>
          </div>
        </div>
        {/* Path rail */}
        <div className="relative flex items-center gap-3 border-t border-border/60 bg-surface-0/60 px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em]">
          <span className="text-muted-foreground">Route</span>
          <span className="text-muted-foreground/50">//</span>
          <span className="text-foreground">Pool 12</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-wildcard">Top 4</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-finals">Nationals</span>
        </div>
      </div>

      {/* Draw pending banner */}
      <div className="flex items-center gap-3 border-l-2 border-wildcard/70 bg-wildcard-soft/30 px-4 py-2.5">
        <span className="h-2 w-2 bg-wildcard" />
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="font-bold text-foreground">Wildcard pending</span>
          <span className="mx-2 text-muted-foreground/40">·</span>
          Bracket locks once all three groups complete Round 04
        </div>
      </div>

      {/* Pool slabs */}
      <div className="grid gap-4 lg:grid-cols-3">
        {(["Titan", "Nexus", "Dominion"] as const).map((g) => {
          const list = byGroup[g];
          const accent = GROUP_COLOR[g];
          return (
            <div
              key={g}
              className="relative overflow-hidden border border-border/70 bg-surface-1 slab-shadow"
              style={{ borderLeft: `3px solid var(--${accent})` }}
            >
              <header className="relative flex items-center justify-between border-b border-border/60 bg-surface-0/60 px-3.5 py-2.5">
                <div className="pointer-events-none absolute inset-0 slash-band opacity-40" />
                <div className="relative flex items-center gap-2">
                  <span className="h-1.5 w-1.5" style={{ background: `var(--${accent})` }} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                    From
                  </span>
                  <h3
                    className="font-heading text-base font-bold uppercase italic tracking-tight"
                    style={{ color: `var(--${accent})` }}
                  >
                    {g}
                  </h3>
                </div>
                <span className="relative font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Rank 5–8
                </span>
              </header>
              <ul className="divide-y divide-border/40">
                {list.map((p) => (
                  <li
                    key={p.seed}
                    className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-2/40"
                  >
                    <span
                      className="grid h-6 w-6 place-items-center border font-mono text-[10px] font-bold tabular-nums"
                      style={{
                        borderColor: `color-mix(in oklab, var(--${accent}) 40%, transparent)`,
                        color: `var(--${accent})`,
                        background: `color-mix(in oklab, var(--${accent}) 8%, transparent)`,
                      }}
                    >
                      {p.sourceRank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-xs font-bold uppercase tracking-wide text-foreground">
                        {p.name}
                      </div>
                      <div className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
                        {p.city}
                      </div>
                    </div>
                    <span className="border border-wildcard/40 bg-wildcard-soft/30 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-wildcard">
                      {p.statusLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Final slots — skewed slabs */}
      <section>
        <div className="mb-3 flex items-end justify-between border-b-2 border-wildcard/40 pb-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-wildcard">
              // Stage 04
            </span>
            <h3 className="font-heading text-2xl font-black uppercase italic tracking-tight text-foreground">
              Final Slots <span className="text-wildcard">→ Nationals</span>
            </h3>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
            0<span className="text-muted-foreground/40">/</span>
            {finalSlots}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: finalSlots }, (_, i) => {
            const slot = finalSlotPlayers?.[i];
            return (
              <div key={i} className="relative slab-skew slab-shadow">
                <div className="absolute -inset-px bg-gradient-to-br from-wildcard/40 via-transparent to-finals/20" />
                <div className="relative border border-wildcard/50 bg-surface-1 p-4">
                  <div className="slab-unskew space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                        WC_SLOT_{String(i + 1).padStart(2, "0")}
                      </code>
                      <Trophy className="h-3.5 w-3.5 text-wildcard/60" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-heading text-2xl font-black uppercase italic tracking-tight text-wildcard">
                        Slot {i + 1}
                      </span>
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {slot?.pending === false ? "Locked" : "Awaiting"}
                      </span>
                    </div>
                    <div className="min-h-[32px]">
                      <div className="truncate font-mono text-xs font-bold uppercase tracking-wide text-foreground">
                        {slot?.name ?? "Awaiting qualifier"}
                      </div>
                      {slot?.city && (
                        <div className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
                          {slot.city}
                        </div>
                      )}
                    </div>
                    <div className="h-[3px] w-full bg-gradient-to-r from-wildcard via-wildcard/40 to-transparent" />
                  </div>
                  {/* HUD ticks */}
                  <div className="pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-wildcard/60" />
                  <div className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-wildcard/60" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
