import type { Player, WildcardFinalSlot, WildcardLobby } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { ArrowRight, Trophy, Zap } from "lucide-react";
import type { ReactNode } from "react";

export function WildcardView({
  finalSlots,
  poolCount,
  finalSlotPlayers,
  lobbies,
}: {
  finalSlots: number;
  poolCount: number;
  finalSlotPlayers?: WildcardFinalSlot[];
  lobbies: WildcardLobby[];
}) {
  const lockedSlots = finalSlotPlayers?.filter((slot) => slot.pending === false).length ?? 0;

  return (
    <div className="fade-in space-y-6">
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
              <span className="text-wildcard"> BRACKET</span>
            </h2>
          </div>
          <div className="flex items-stretch gap-0 divide-x divide-border/60 border border-border/60 bg-surface-0">
            <HeaderMetric icon={<Zap className="h-4 w-4" />} label="Stage" value="4 Lobbies" />
            <HeaderMetric label="Pool" value={`${poolCount}/12`} />
            <HeaderMetric label="Winners" value={`${lockedSlots}/${finalSlots}`} warning />
          </div>
        </div>
        <div className="relative flex flex-wrap items-center gap-3 border-t border-border/60 bg-surface-0/60 px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.26em]">
          <span className="text-muted-foreground">Route</span>
          <span className="text-muted-foreground/50">//</span>
          <span className="text-foreground">4 lobbies</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-wildcard">1 winner each</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-finals">Nationals</span>
        </div>
      </div>

      <div className="flex items-center gap-3 border-l-2 border-wildcard/70 bg-wildcard-soft/30 px-4 py-2.5">
        <span className="h-2 w-2 bg-wildcard" />
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="font-bold text-foreground">Wildcard format</span>
          <span className="mx-2 text-muted-foreground/40">·</span>3 players per lobby · winner
          advances
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {lobbies.map((lobby, index) => (
          <WildcardLobbyCard key={lobby.id} index={index} lobby={lobby} />
        ))}
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b-2 border-wildcard/40 pb-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-wildcard">
              // Final Route
            </span>
            <h3 className="font-heading text-2xl font-black uppercase italic tracking-tight text-foreground">
              Winners <span className="text-wildcard">→ Nationals</span>
            </h3>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
            {lockedSlots}
            <span className="text-muted-foreground/40">/</span>
            {finalSlots}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: finalSlots }, (_, i) => {
            const slot = finalSlotPlayers?.[i];
            return <WildcardSlotCard key={i} index={i} slot={slot} />;
          })}
        </div>
      </section>
    </div>
  );
}

function HeaderMetric({
  icon,
  label,
  value,
  warning,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="px-4 py-2.5">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 flex items-center gap-1.5 font-heading text-lg font-bold uppercase italic tracking-tight",
          warning ? "text-wildcard" : "text-foreground",
        )}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}

function WildcardLobbyCard({ index, lobby }: { index: number; lobby: WildcardLobby }) {
  const winner = lobby.players.find((player) => player.state === "finals");

  return (
    <article className="relative overflow-hidden border border-border/70 bg-surface-1 slab-shadow">
      <div className="pointer-events-none absolute inset-0 slash-band opacity-25" />
      <header className="relative flex items-center justify-between border-b border-border/60 bg-surface-0/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center border border-wildcard/45 bg-wildcard-soft/30 font-mono text-[10px] font-black text-wildcard">
            {index + 1}
          </span>
          <div>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
              Wildcard
            </span>
            <h3 className="font-heading text-lg font-black uppercase italic tracking-tight text-white">
              {lobby.label}
            </h3>
          </div>
        </div>
        <span
          className={cn(
            "border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.18em]",
            winner
              ? "border-finals/45 bg-finals-soft/30 text-finals"
              : "border-wildcard/35 bg-wildcard-soft/20 text-wildcard",
          )}
        >
          {winner ? "Locked" : lobby.status}
        </span>
      </header>

      <div className="relative divide-y divide-border/40">
        {lobby.players.map((player, playerIndex) => (
          <WildcardLobbyPlayer
            key={`${lobby.id}-${player.seed}-${player.name}`}
            player={player}
            playerIndex={playerIndex}
          />
        ))}
      </div>

      <footer className="relative border-t border-border/60 bg-surface-0/55 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {winner ? `${winner.name} to Nationals` : "Winner advances"}
      </footer>
    </article>
  );
}

function WildcardLobbyPlayer({ player, playerIndex }: { player: Player; playerIndex: number }) {
  const isWinner = player.state === "finals";
  const isOut = player.state === "eliminated";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3",
        isWinner && "bg-finals-soft/35 shadow-[inset_3px_0_0_var(--finals)]",
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center border font-mono text-[10px] font-black tabular-nums",
          isWinner
            ? "border-finals/60 text-finals"
            : isOut
              ? "border-border/50 text-muted-foreground/45"
              : "border-wildcard/40 text-wildcard",
        )}
      >
        {player.rank ?? playerIndex + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate font-mono text-xs font-bold uppercase tracking-wide",
            isOut ? "text-muted-foreground/55" : "text-foreground",
          )}
        >
          {player.name}
        </div>
        <div className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
          {player.city || "City pending"}
        </div>
      </div>
      <span
        className={cn(
          "border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em]",
          isWinner
            ? "border-finals/40 bg-finals-soft/30 text-finals"
            : "border-wildcard/35 bg-wildcard-soft/20 text-wildcard",
        )}
      >
        {player.stateLabel}
      </span>
    </div>
  );
}

function WildcardSlotCard({ index, slot }: { index: number; slot?: WildcardFinalSlot }) {
  const locked = slot?.pending === false;

  return (
    <div className="relative slab-skew slab-shadow">
      <div className="absolute -inset-px bg-gradient-to-br from-wildcard/40 via-transparent to-finals/20" />
      <div className="relative border border-wildcard/50 bg-surface-1 p-4">
        <div className="slab-unskew space-y-2">
          <div className="flex items-center justify-between">
            <code className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              WC_SLOT_{String(index + 1).padStart(2, "0")}
            </code>
            <Trophy className="h-3.5 w-3.5 text-wildcard/60" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-2xl font-black uppercase italic tracking-tight text-wildcard">
              Slot {index + 1}
            </span>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              {locked ? "Locked" : "Awaiting"}
            </span>
          </div>
          <div className="min-h-[32px]">
            <div className="truncate font-mono text-xs font-bold uppercase tracking-wide text-foreground">
              {locked ? slot.name : "Awaiting qualifier"}
            </div>
            {locked && slot.city && (
              <div className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
                {slot.city}
              </div>
            )}
          </div>
          <div className="h-[3px] w-full bg-gradient-to-r from-wildcard via-wildcard/40 to-transparent" />
        </div>
        <div className="pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-wildcard/60" />
        <div className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-wildcard/60" />
      </div>
    </div>
  );
}
