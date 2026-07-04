import { Crown, Radio, Trophy, Users, Zap } from "lucide-react";
import type { CSSProperties, ElementType } from "react";
import { cn } from "@/lib/utils";
import type {
  FinalsView,
  GroupView,
  Lobby,
  Match,
  Player,
  TournamentData,
  WildcardPlayer,
} from "@/lib/tournament-data";

type OverlayView = "overview" | "titan" | "nexus" | "dominion" | "wildcard" | "finals";
type ObsSource = "bracket" | "route" | "round";
type RoutedPlayer = Player & { lobbyId: string };

const GROUP_META = {
  titan: { title: "Titan", label: "Group Titan", accent: "titan" },
  nexus: { title: "Nexus", label: "Group Nexus", accent: "nexus" },
  dominion: { title: "Dominion", label: "Group Dominion", accent: "dominion" },
} as const;

type GroupKey = keyof typeof GROUP_META;

const GROUP_ORDER = ["titan", "nexus", "dominion"] as const;
const FINALS_ROUND_LABELS = ["Round of 16", "Quarterfinals", "Semifinals", "Grand Final"] as const;

export function ObsOverlayView({
  data,
  error,
  isLoading,
  isRefreshing,
  lobbyId,
  round,
  source,
  syncStatus,
  syncSummary,
  transparent,
  view,
}: {
  data: TournamentData;
  error: Error | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lobbyId?: string;
  round?: number | string;
  source?: ObsSource;
  syncStatus: string;
  syncSummary: string;
  transparent?: boolean;
  view: OverlayView;
}) {
  const effectiveView = view === "overview" ? "titan" : view;
  const activeSource = resolveObsSource(effectiveView, source, round, lobbyId);
  const accent = overlayAccent(effectiveView);

  return (
    <div
      className={cn(
        "obs-overlay-root relative h-screen w-screen overflow-hidden text-foreground",
        transparent ? "bg-transparent" : "bg-background",
      )}
      style={{ "--tab-accent": `var(--${accent})` } as CSSProperties}
    >
      {!transparent && (
        <>
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" />
          <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(900px 520px at 12% 0%, color-mix(in oklab, var(--${accent}) 20%, transparent), transparent 68%), radial-gradient(1000px 620px at 100% 100%, color-mix(in oklab, var(--${accent}) 11%, transparent), transparent 62%)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, oklch(0 0 0 / 0.28), transparent 20%, transparent 80%, oklch(0 0 0 / 0.34))",
            }}
          />
        </>
      )}

      <div className="pointer-events-none absolute inset-5 border border-white/10">
        <span className="absolute -left-px -top-px h-8 w-8 border-l-2 border-t-2 border-[color:var(--tab-accent)]" />
        <span className="absolute -right-px -top-px h-8 w-8 border-r-2 border-t-2 border-[color:var(--tab-accent)]" />
        <span className="absolute -bottom-px -left-px h-8 w-8 border-b-2 border-l-2 border-[color:var(--tab-accent)]" />
        <span className="absolute -bottom-px -right-px h-8 w-8 border-b-2 border-r-2 border-[color:var(--tab-accent)]" />
      </div>

      <div className="relative flex h-full flex-col p-8">
        <OverlayHeader
          accent={accent}
          error={error}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          syncStatus={syncStatus}
          syncSummary={syncSummary}
          round={round}
          source={activeSource}
          view={effectiveView}
        />

        <main className="min-h-0 flex-1 py-5">
          {isGroupView(effectiveView) && activeSource === "bracket" && (
            <GroupBracketOverlay group={groupByKey(data, effectiveView)} groupKey={effectiveView} />
          )}
          {isGroupView(effectiveView) && activeSource === "route" && (
            <GroupRouteOverlay group={groupByKey(data, effectiveView)} groupKey={effectiveView} />
          )}
          {effectiveView === "titan" && activeSource === "round" && (
            <GroupOverlay
              group={data.groupTitan}
              groupKey="titan"
              lobbyId={lobbyId}
              round={round}
            />
          )}
          {effectiveView === "nexus" && activeSource === "round" && (
            <GroupOverlay
              group={data.groupNexus}
              groupKey="nexus"
              lobbyId={lobbyId}
              round={round}
            />
          )}
          {effectiveView === "dominion" && activeSource === "round" && (
            <GroupOverlay
              group={data.groupDominion}
              groupKey="dominion"
              lobbyId={lobbyId}
              round={round}
            />
          )}
          {effectiveView === "wildcard" && <WildcardOverlay data={data} />}
          {effectiveView === "finals" && <FinalsOverlay finals={data.finalsView} round={round} />}
        </main>

        <BroadcastFooter
          accent={accent}
          round={round}
          source={activeSource}
          syncSummary={syncSummary}
          view={effectiveView}
        />
      </div>
    </div>
  );
}

function OverlayHeader({
  accent,
  error,
  isLoading,
  isRefreshing,
  round,
  source,
  syncStatus,
  syncSummary,
  view,
}: {
  accent: string;
  error: Error | null;
  isLoading: boolean;
  isRefreshing: boolean;
  round?: number | string;
  source: ObsSource;
  syncStatus: string;
  syncSummary: string;
  view: OverlayView;
}) {
  const title = overlayTitle(view);
  const subtitle = overlaySubtitle(view, source, round);
  const loadingLabel = error
    ? "Sync issue"
    : isLoading
      ? "Loading"
      : isRefreshing
        ? "Refreshing"
        : syncStatus;
  const divisionLabel = overlayDivisionLabel(view, source);

  return (
    <header className="relative shrink-0 overflow-hidden border border-border/80 bg-surface-0/88 shadow-[0_24px_80px_-42px_var(--tab-accent)]">
      <div className="pointer-events-none absolute inset-0 slash-band opacity-50" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[color:var(--tab-accent)]" />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-8 px-6 py-4">
        <div className="flex min-w-0 items-center gap-5">
          <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden border border-border-strong bg-surface-1/90 clip-chamfer-sm shadow-[0_0_42px_-14px_var(--tab-accent)]">
            <img
              src="/legion-wars-logo-mark.png"
              alt=""
              className="h-[72px] w-[72px] object-contain brightness-110 contrast-125 drop-shadow-[0_3px_10px_rgba(0,0,0,0.65)]"
            />
            <span className="pointer-events-none absolute inset-x-1 top-0 h-px bg-[color:var(--tab-accent)]/75" />
            <span className="pointer-events-none absolute inset-y-1 right-0 w-px bg-[color:var(--tab-accent)]/55" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
              <span className="h-2 w-2" style={{ background: `var(--${accent})` }} />
              Legion Wars 2026
              <span className="text-muted-foreground/40">//</span>
              {divisionLabel}
            </div>
            <h1 className="mt-1 truncate font-heading text-7xl font-black uppercase italic leading-none tracking-tight text-white">
              {title}
            </h1>
            <div className="mt-1 font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {subtitle}
            </div>
          </div>
        </div>

        <div className="grid min-w-[560px] grid-cols-3 border border-border/80 bg-background/80">
          <HeaderStat label="Feed" value="Public Sheets" accent={accent} />
          <HeaderStat label="State" value={loadingLabel} accent={error ? "live" : accent} border />
          <HeaderStat label="Updated" value={syncSummary} accent={accent} border />
        </div>
      </div>
    </header>
  );
}

function BroadcastFooter({
  accent,
  round,
  source,
  syncSummary,
  view,
}: {
  accent: string;
  round?: number | string;
  source: ObsSource;
  syncSummary: string;
  view: OverlayView;
}) {
  const strap = overlayFooterStrap(view, source, round);

  return (
    <footer className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center border border-border/80 bg-surface-0/88">
      <div
        className="px-5 py-3 font-heading text-2xl font-black uppercase italic tracking-tight text-background"
        style={{ background: `var(--${accent})` }}
      >
        Live Bracket
      </div>
      <div className="truncate px-5 font-mono text-[12px] font-bold uppercase tracking-[0.26em] text-foreground">
        {strap}
      </div>
      <div className="border-l border-border/80 px-5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
        {syncSummary}
      </div>
    </footer>
  );
}

function OverviewOverlay({ data }: { data: TournamentData }) {
  const cards = GROUP_ORDER.map((key) => {
    const group = groupByKey(data, key);
    const progress = groupProgress(group);
    return {
      accent: GROUP_META[key].accent,
      label: GROUP_META[key].label,
      title: GROUP_META[key].title,
      meta: `${progress.decided}/${progress.total} decided`,
      value: `${progress.percent}%`,
    };
  });

  return (
    <div className="grid h-full grid-cols-[1.1fr_0.9fr] gap-5">
      <section className="relative overflow-hidden border border-border/80 bg-surface-1/70 p-6 slash-band">
        <div className="absolute inset-y-0 left-0 w-1 bg-finals" />
        <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-finals">
          // Tournament Map
        </div>
        <h2 className="mt-2 font-heading text-7xl font-black uppercase italic leading-none tracking-tight text-white">
          Public Bracket
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <OverviewStat label="Players Listed" value="192" accent="finals" />
          <OverviewStat label="Groups" value="03" accent="titan" />
          <OverviewStat label="Wildcard Slots" value="04" accent="wildcard" />
          <OverviewStat label="Finalists" value="16" accent="finals" />
        </div>
        <div className="mt-8 grid gap-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="flex items-center justify-between border border-border/70 bg-surface-0/70 px-4 py-3"
              style={{ borderLeft: `4px solid var(--${card.accent})` }}
            >
              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  {card.label}
                </div>
                <div
                  className="font-heading text-3xl font-black uppercase italic tracking-tight"
                  style={{ color: `var(--${card.accent})` }}
                >
                  {card.title}
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-4xl font-black italic tabular-nums text-white">
                  {card.value}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {card.meta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <RouteCard
          icon={Users}
          label="Group Stage"
          value="Titan / Nexus / Dominion"
          accent="titan"
        />
        <RouteCard icon={Zap} label="Wildcard" value="12 → 4" accent="wildcard" />
        <RouteCard
          icon={Trophy}
          label="National Finals"
          value="16 Player Bracket"
          accent="finals"
        />
        <RouteCard icon={Crown} label="Champion" value="01 Winner" accent="finals" />
      </section>
    </div>
  );
}

function GroupBracketOverlay({ group, groupKey }: { group: GroupView; groupKey: GroupKey }) {
  const accent = GROUP_META[groupKey].accent;
  const roundCount = group.progression.rounds.length;
  const lobbyCount = group.progression.rounds.reduce((sum, round) => sum + round.lobbies.length, 0);
  const route = groupRoutePlayers(group);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-5">
      <section className="grid shrink-0 grid-cols-[minmax(0,1fr)_640px] gap-5">
        <div
          className="relative overflow-hidden border border-border/80 bg-surface-1/75 p-5 slash-band"
          style={{ borderLeft: `4px solid var(--${accent})` }}
        >
          <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
            // Group Bracket Source
          </div>
          <div className="mt-1 flex items-end gap-4">
            <h2
              className="font-heading text-7xl font-black uppercase italic leading-none tracking-tight"
              style={{ color: `var(--${accent})` }}
            >
              {GROUP_META[groupKey].title}
            </h2>
            <span className="mb-2 font-mono text-[14px] font-bold uppercase tracking-[0.28em] text-foreground">
              Round 1-4 chart
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 border border-border/80 bg-surface-0/80 slab-shadow">
          <HeaderStat label="Rounds" value={String(roundCount).padStart(2, "0")} accent={accent} />
          <HeaderStat
            label="Lobbies"
            value={String(lobbyCount).padStart(2, "0")}
            accent={accent}
            border
          />
          <HeaderStat
            label="Direct"
            value={String(route.finals.length).padStart(2, "0")}
            accent="finals"
            border
          />
          <HeaderStat
            label="Wildcard"
            value={String(route.wildcard.length).padStart(2, "0")}
            accent="wildcard"
            border
          />
        </div>
      </section>

      <section className="grid min-h-0 grid-cols-[1.25fr_1fr_0.82fr_0.72fr] gap-4">
        {group.progression.rounds.map((round, index) => (
          <GroupBracketRoundColumn
            key={round.title}
            accent={accent}
            round={round}
            roundIndex={index}
          />
        ))}
      </section>
    </div>
  );
}

function GroupBracketRoundColumn({
  accent,
  round,
  roundIndex,
}: {
  accent: string;
  round: GroupView["progression"]["rounds"][number];
  roundIndex: number;
}) {
  const roundState = roundProgress(round);
  const dense = round.lobbies.length > 8;
  const compact = round.lobbies.length > 4;

  return (
    <section className="relative flex min-h-0 flex-col border border-border/80 bg-surface-1/70 p-3 slab-shadow">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1"
        style={{ background: `var(--${accent})` }}
      />
      <header className="shrink-0 border-b border-border/70 pb-2 pl-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              // Round {String(roundIndex + 1).padStart(2, "0")}
            </div>
            <h3 className="mt-0.5 font-heading text-2xl font-black uppercase italic leading-none tracking-tight text-white">
              {round.title}
            </h3>
          </div>
          <div className="text-right font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {roundState.decided}/{roundState.total}
          </div>
        </div>
      </header>

      <div
        className="mt-2 grid min-h-0 flex-1 gap-1.5"
        style={{ gridTemplateRows: `repeat(${round.lobbies.length}, minmax(0, 1fr))` }}
      >
        {round.lobbies.map((lobby) => (
          <GroupBracketLobbyNode
            key={lobby.id}
            accent={accent}
            compact={compact}
            dense={dense}
            lobby={lobby}
            roundIndex={roundIndex}
          />
        ))}
      </div>
    </section>
  );
}

function GroupBracketLobbyNode({
  accent,
  compact,
  dense,
  lobby,
  roundIndex,
}: {
  accent: string;
  compact: boolean;
  dense: boolean;
  lobby: Lobby;
  roundIndex: number;
}) {
  const routedPlayers = routedLobbyPlayers(lobby);
  const displayPlayers = routedPlayers.slice(0, roundIndex === 3 ? 4 : 2);
  const names = displayPlayers.map((player) => player.name).join(" / ");
  const statusText =
    routedPlayers.length > 0
      ? roundIndex === 3
        ? `${routedPlayers.filter((player) => player.state === "finals").length} Finals · ${
            routedPlayers.filter((player) => player.state === "wildcard").length
          } Wild`
        : `${routedPlayers.length} advance`
      : lobby.status;

  if (dense) {
    return (
      <article className="grid min-h-0 grid-cols-[100px_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden border border-border/45 bg-background/68 px-2 py-0.5">
        <div className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {lobby.id}
        </div>
        <div className="truncate font-heading text-[10px] font-black uppercase italic leading-none tracking-tight text-white">
          {names || "Awaiting qualifiers"}
        </div>
        <div
          className="shrink-0 font-mono text-[8px] font-black uppercase tracking-widest"
          style={{ color: `var(--${routedPlayers.length ? accent : "muted-foreground"})` }}
        >
          {statusText}
        </div>
      </article>
    );
  }

  return (
    <article className="min-h-0 overflow-hidden border border-border/55 bg-background/68 px-2 py-1.5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {lobby.id}
        </div>
        <div
          className="shrink-0 font-mono text-[8px] font-black uppercase tracking-widest"
          style={{ color: `var(--${routedPlayers.length ? accent : "muted-foreground"})` }}
        >
          {statusText}
        </div>
      </div>

      {roundIndex === 3 && !dense ? (
        <div className="mt-1 grid grid-cols-2 gap-1">
          {displayPlayers.map((player) => (
            <div
              key={`${lobby.id}-${player.seed}-${player.name}`}
              className="truncate border-t border-border/45 pt-1 font-heading text-[12px] font-black uppercase italic leading-none tracking-tight"
              style={{ color: `var(--${playerAccent(player, accent)})` }}
            >
              {player.name}
            </div>
          ))}
          {!displayPlayers.length && (
            <div className="truncate border-t border-border/45 pt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Awaiting qualifiers
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "mt-1 truncate border-t border-border/45 pt-1 font-heading font-black uppercase italic leading-none tracking-tight text-white",
            dense ? "text-[10px]" : compact ? "text-[12px]" : "text-sm",
          )}
        >
          {names || "Awaiting qualifiers"}
        </div>
      )}
    </article>
  );
}

function GroupRouteOverlay({ group, groupKey }: { group: GroupView; groupKey: GroupKey }) {
  const accent = GROUP_META[groupKey].accent;
  const roundFour = group.progression.rounds[3] ?? group.progression.rounds.at(-1);
  const route = groupRoutePlayers(group);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-5">
      <section className="grid shrink-0 grid-cols-[minmax(0,1fr)_560px] gap-5">
        <div
          className="relative overflow-hidden border border-border/80 bg-surface-1/75 p-5 slash-band"
          style={{ borderLeft: `4px solid var(--${accent})` }}
        >
          <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
            // Qualification Route Source
          </div>
          <div className="mt-1 flex items-end gap-4">
            <h2
              className="font-heading text-7xl font-black uppercase italic leading-none tracking-tight"
              style={{ color: `var(--${accent})` }}
            >
              {GROUP_META[groupKey].title}
            </h2>
            <span className="mb-2 font-mono text-[14px] font-bold uppercase tracking-[0.28em] text-foreground">
              Finals / Wildcard
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 border border-border/80 bg-surface-0/80 slab-shadow">
          <HeaderStat label="Round" value="R04" accent={accent} />
          <HeaderStat label="Nationals" value={`${route.finals.length}/4`} accent="finals" border />
          <HeaderStat
            label="Wildcard"
            value={`${route.wildcard.length}/4`}
            accent="wildcard"
            border
          />
        </div>
      </section>

      <section className="grid min-h-0 grid-cols-[0.95fr_1fr_1fr] gap-5">
        <div className="grid min-h-0 grid-rows-2 gap-4">
          {(roundFour?.lobbies ?? []).slice(0, 2).map((lobby) => (
            <RouteLobbyCard key={lobby.id} accent={accent} lobby={lobby} />
          ))}
        </div>

        <RouteBucket
          accent="finals"
          label="National Finals"
          players={route.finals}
          summary="Direct group qualifiers"
        />
        <RouteBucket
          accent="wildcard"
          label="Wildcard Pool"
          players={route.wildcard}
          summary="Group placements 5-8"
        />
      </section>
    </div>
  );
}

function RouteLobbyCard({ accent, lobby }: { accent: string; lobby: Lobby }) {
  const players = lobby.players.filter((player) => !isPlaceholderPlayer(player));

  return (
    <article
      className="min-h-0 overflow-hidden border border-border/80 bg-surface-1/80 p-3 slab-shadow"
      style={{ borderLeft: `4px solid var(--${accent})` }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 pb-2">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            {lobby.id}
          </div>
          <div className="font-heading text-2xl font-black uppercase italic leading-none tracking-tight text-white">
            {lobby.status}
          </div>
        </div>
        <div className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Round 4
        </div>
      </header>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(players.length ? players : lobby.players).map((player) => (
          <RouteLobbyChip
            key={`${lobby.id}-${player.seed}-${player.name}`}
            accent={accent}
            lobbyId={lobby.id}
            player={player}
          />
        ))}
      </div>
    </article>
  );
}

function RouteLobbyChip({
  accent,
  lobbyId,
  player,
}: {
  accent: string;
  lobbyId: string;
  player: Player;
}) {
  const rank = player.rank ?? Number(player.seed);
  const statusColor = playerAccent(player, accent);

  return (
    <div className="min-w-0 border border-border/50 bg-background/55 px-2.5 py-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center border font-mono text-[10px] font-black tabular-nums"
          style={{
            borderColor: `color-mix(in oklab, var(--${statusColor}) 45%, transparent)`,
            color: `var(--${statusColor})`,
          }}
        >
          {String(Number.isFinite(rank) ? rank : player.seed).padStart(2, "0")}
        </span>
        <span
          className="shrink-0 font-mono text-[8px] font-black uppercase tracking-widest"
          style={{ color: `var(--${statusColor})` }}
        >
          {player.stateLabel}
        </span>
      </div>
      <div className="mt-1 truncate font-heading text-base font-black uppercase italic leading-none tracking-tight text-white">
        {player.name}
      </div>
      <div className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
        {player.city || "TBD"} / {lobbyId}
      </div>
    </div>
  );
}

function RouteBucket({
  accent,
  label,
  players,
  summary,
}: {
  accent: string;
  label: string;
  players: RoutedPlayer[];
  summary: string;
}) {
  return (
    <section
      className="min-h-0 border border-border/80 bg-surface-1/80 p-5 slab-shadow"
      style={{ borderLeft: `4px solid var(--${accent})` }}
    >
      <header className="border-b border-border/70 pb-4">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {summary}
        </div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h3
            className="font-heading text-4xl font-black uppercase italic leading-none tracking-tight"
            style={{ color: `var(--${accent})` }}
          >
            {label}
          </h3>
          <div className="font-heading text-4xl font-black italic tabular-nums text-white">
            {players.length}
          </div>
        </div>
      </header>

      <div className="mt-4 grid gap-3">
        {Array.from({ length: 4 }, (_, index) => {
          const player = players[index];
          return player ? (
            <RoutePlayerRow
              key={`${label}-${player.lobbyId}-${player.seed}-${player.name}`}
              accent={accent}
              player={player}
            />
          ) : (
            <div
              key={`${label}-pending-${index}`}
              className="flex items-center justify-between gap-3 border border-border/50 bg-background/55 px-3 py-3"
            >
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-heading text-2xl font-black uppercase italic tracking-tight text-muted-foreground/50">
                Awaiting
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                TBD
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RoutePlayerRow({
  accent,
  compact,
  player,
}: {
  accent: string;
  compact?: boolean;
  player: RoutedPlayer;
}) {
  const rank = player.rank ?? Number(player.seed);

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 border border-border/50 bg-background/55",
        compact ? "px-3 py-2" : "px-3 py-3",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "grid shrink-0 place-items-center border font-mono font-black tabular-nums",
            compact ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs",
          )}
          style={{
            borderColor: `color-mix(in oklab, var(--${playerAccent(player, accent)}) 45%, transparent)`,
            color: `var(--${playerAccent(player, accent)})`,
          }}
        >
          {String(Number.isFinite(rank) ? rank : player.seed).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div
            className={cn(
              "truncate font-heading font-black uppercase italic leading-none tracking-tight text-white",
              compact ? "text-xl" : "text-2xl",
            )}
          >
            {player.name}
          </div>
          <div
            className={cn(
              "truncate font-mono uppercase tracking-widest text-muted-foreground",
              compact ? "mt-0.5 text-[9px]" : "mt-1 text-[10px]",
            )}
          >
            {player.city || "TBD"} / {player.lobbyId}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 font-mono font-black uppercase tracking-widest",
          compact ? "text-[9px]" : "text-[10px]",
        )}
        style={{ color: `var(--${playerAccent(player, accent)})` }}
      >
        {player.stateLabel}
      </div>
    </div>
  );
}

function GroupOverlay({
  group,
  groupKey,
  lobbyId,
  round,
}: {
  group: GroupView;
  groupKey: keyof typeof GROUP_META;
  lobbyId?: string;
  round?: number | string;
}) {
  const accent = GROUP_META[groupKey].accent;
  const selectedRoundIndex = selectedGroupRoundIndex(group, round);
  const selectedRound = group.progression.rounds[selectedRoundIndex] ?? group.progression.rounds[0];
  const selectedLobby = lobbyId
    ? group.progression.rounds
        .flatMap((candidate) => candidate.lobbies)
        .find((lobby) => lobby.id === lobbyId)
    : undefined;
  const lobbies = selectedLobby ? [selectedLobby] : (selectedRound?.lobbies ?? []);
  const progress = selectedRound
    ? roundProgress(selectedRound)
    : { decided: 0, total: 0, percent: 0 };
  const featured = lobbies.length === 1;
  const prominent = featured || lobbies.length <= 2;
  const lobbyGridClass = featured
    ? "grid-cols-1"
    : lobbies.length <= 2
      ? "grid-cols-2"
      : "grid-cols-4 content-start";
  const finalsPlayers = lobbies.flatMap((lobby) =>
    lobby.players.filter((player) => player.state === "finals" || player.state === "advance"),
  );
  const wildcardPlayers = lobbies.flatMap((lobby) =>
    lobby.players.filter((player) => player.state === "wildcard"),
  );

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-5">
      <section className="grid shrink-0 grid-cols-[minmax(0,1fr)_520px] gap-5">
        <div
          className="relative overflow-hidden border border-border/80 bg-surface-1/75 p-6 slash-band"
          style={{ borderLeft: `4px solid var(--${accent})` }}
        >
          <div className="pointer-events-none absolute right-6 top-5 font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground/30">
            {GROUP_META[groupKey].label}
          </div>
          <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
            // Legion Wars · Group Stage
          </div>
          <div className="mt-2 flex items-end gap-4">
            <h2
              className="font-heading text-8xl font-black uppercase italic leading-none tracking-tight"
              style={{ color: `var(--${accent})` }}
            >
              {GROUP_META[groupKey].title}
            </h2>
            <span className="mb-3 font-mono text-[15px] font-bold uppercase tracking-[0.28em] text-foreground">
              Live leaderboard
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 border border-border/80 bg-surface-0/80 slab-shadow">
          <HeaderStat label="Round" value={roundLabel(selectedRoundIndex)} accent={accent} />
          <HeaderStat
            label="Lobbies"
            value={selectedLobby ? selectedLobby.id : String(lobbies.length).padStart(2, "0")}
            accent={accent}
            border
          />
          <HeaderStat
            label="Decided"
            value={`${progress.decided}/${progress.total}`}
            accent={accent}
            border
          />
        </div>
      </section>

      <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_430px] gap-5">
        <div className={cn("grid min-h-0 gap-4", lobbyGridClass)}>
          {lobbies.map((lobby) => (
            <OverlayLobbyCard
              key={lobby.id}
              accent={accent}
              dense={!prominent && lobbies.length > 8}
              featured={prominent}
              lobby={lobby}
            />
          ))}
        </div>
        <QualificationPanel
          accent={accent}
          finalsPlayers={finalsPlayers}
          wildcardPlayers={wildcardPlayers}
        />
      </section>
    </div>
  );
}

function QualificationPanel({
  accent,
  finalsPlayers,
  wildcardPlayers,
}: {
  accent: string;
  finalsPlayers: Player[];
  wildcardPlayers: Player[];
}) {
  return (
    <aside className="relative min-h-0 overflow-hidden border border-border/80 bg-surface-1/80 slab-shadow">
      <div className="pointer-events-none absolute inset-0 slash-band opacity-35" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[color:var(--tab-accent)]" />
      <div className="relative flex h-full flex-col gap-3 p-4">
        <div className="border-b border-border/70 pb-3">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
            Advancement
          </div>
          <h3 className="mt-1 font-heading text-3xl font-black uppercase italic leading-none tracking-tight text-white">
            Qualification Path
          </h3>
        </div>

        <div className="grid min-h-0 gap-3">
          <AdvancementBucket
            accent="finals"
            label="National Finals"
            players={finalsPlayers}
            rule="Top 4"
            expectedCount={4}
            visibleLimit={3}
          />
          <AdvancementBucket
            accent="wildcard"
            label="Wildcard Pool"
            players={wildcardPlayers}
            rule="Group 5-8"
            visibleLimit={3}
          />
        </div>

        <div className="mt-auto grid shrink-0 grid-cols-2 gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
          <div className="border border-border/70 bg-background/70 px-3 py-2">
            <div className="text-muted-foreground">Finals lock</div>
            <div className="mt-1 text-[12px]" style={{ color: `var(--${accent})` }}>
              Top 4
            </div>
          </div>
          <div className="border border-border/70 bg-background/70 px-3 py-2">
            <div className="text-muted-foreground">Last chance</div>
            <div className="mt-1 text-[12px] text-wildcard">5-8</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AdvancementBucket({
  accent,
  label,
  players,
  rule,
  expectedCount,
  visibleLimit = 4,
}: {
  accent: string;
  label: string;
  players: Player[];
  rule: string;
  expectedCount?: number;
  visibleLimit?: number;
}) {
  const activePlayers = players.filter((player) => !isPlaceholderPlayer(player));
  const visiblePlayers = activePlayers.slice(0, visibleLimit);
  const overflowCount = Math.max(0, activePlayers.length - visiblePlayers.length);
  const rowCount = Math.max(visibleLimit, visiblePlayers.length);

  return (
    <section
      className="border border-border/70 bg-background/70 p-3"
      style={{ borderLeft: `4px solid var(--${accent})` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            {rule}
          </div>
          <div
            className="font-heading text-xl font-black uppercase italic leading-none tracking-tight"
            style={{ color: `var(--${accent})` }}
          >
            {label}
          </div>
        </div>
        <div className="font-heading text-2xl font-black italic tabular-nums text-white">
          {activePlayers.length}
          {expectedCount != null && (
            <span className="text-muted-foreground/40">/{expectedCount}</span>
          )}
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        {Array.from({ length: rowCount }, (_, index) => {
          const player = visiblePlayers[index];
          return (
            <div
              key={`${label}-${index}-${player?.name ?? "slot"}`}
              className="flex min-w-0 items-center justify-between gap-2 border-t border-border/50 pt-1.5 first:border-t-0 first:pt-0"
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate font-heading text-lg font-black uppercase italic leading-none tracking-tight text-white">
                {player?.name ?? "Awaiting"}
              </span>
              <span className="max-w-16 truncate text-right font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                {player?.city ?? "TBD"}
              </span>
            </div>
          );
        })}
        {overflowCount > 0 && (
          <div
            className="border-t border-border/50 pt-1.5 text-right font-mono text-[9px] font-bold uppercase tracking-[0.24em]"
            style={{ color: `var(--${accent})` }}
          >
            +{overflowCount} queued
          </div>
        )}
      </div>
    </section>
  );
}

function WildcardOverlay({ data }: { data: TournamentData }) {
  const byGroup = {
    Titan: data.wildcardView.players.filter((player) => player.sourceGroup === "Titan"),
    Nexus: data.wildcardView.players.filter((player) => player.sourceGroup === "Nexus"),
    Dominion: data.wildcardView.players.filter((player) => player.sourceGroup === "Dominion"),
  };

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-5">
      <section className="relative overflow-hidden border border-border/80 bg-surface-1/70 p-5 slash-band">
        <div className="absolute inset-y-0 left-0 w-1 bg-wildcard" />
        <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-wildcard">
          // Last Chance Route
        </div>
        <div className="mt-1 flex items-end justify-between gap-6">
          <h2 className="font-heading text-7xl font-black uppercase italic leading-none tracking-tight text-white">
            Wildcard Pool
          </h2>
          <div className="grid min-w-[520px] grid-cols-3 border border-border/80 bg-surface-0/75">
            <HeaderStat
              label="Pool"
              value={String(data.wildcardView.poolCount)}
              accent="wildcard"
            />
            <HeaderStat
              label="Advancing"
              value={String(data.wildcardView.finalSlots)}
              accent="wildcard"
              border
            />
            <HeaderStat label="Route" value="Nationals" accent="finals" border />
          </div>
        </div>
      </section>

      <section className="grid min-h-0 grid-cols-3 gap-4">
        {(["Titan", "Nexus", "Dominion"] as const).map((sourceGroup) => (
          <WildcardPoolCard
            key={sourceGroup}
            players={byGroup[sourceGroup]}
            sourceGroup={sourceGroup}
          />
        ))}
      </section>

      <section className="grid shrink-0 grid-cols-4 gap-4">
        {Array.from({ length: data.wildcardView.finalSlots }, (_, index) => {
          const slot = data.wildcardView.finalSlotPlayers[index];
          return (
            <div
              key={index}
              className="relative border border-wildcard/55 bg-surface-1/85 p-4 slab-shadow"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                WC Slot {String(index + 1).padStart(2, "0")}
              </div>
              <div className="mt-1 truncate font-heading text-3xl font-black uppercase italic tracking-tight text-wildcard">
                {slot?.pending === false ? slot.name : `Slot ${index + 1}`}
              </div>
              <div className="mt-1 truncate font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {slot?.pending === false ? slot.city || "Locked" : "Awaiting qualifier"}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function FinalsOverlay({ finals, round }: { finals: FinalsView; round?: number | string }) {
  const selectedIndex = normalizeRoundParam(round);
  const rounds =
    selectedIndex != null && finals.bracket.rounds[selectedIndex]
      ? [finals.bracket.rounds[selectedIndex]]
      : finals.bracket.rounds;
  const focused = rounds.length === 1;

  return (
    <div className="flex h-full flex-col gap-5">
      <section className="relative shrink-0 overflow-hidden border border-border/80 bg-surface-1/70 p-5 slash-band">
        <div className="absolute inset-y-0 left-0 w-1 bg-finals" />
        <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-finals">
          // National Finals
        </div>
        <div className="mt-1 flex items-end justify-between gap-6">
          <h2 className="font-heading text-7xl font-black uppercase italic leading-none tracking-tight text-white">
            Main Bracket
          </h2>
          <div className="grid min-w-[600px] grid-cols-3 border border-border/80 bg-surface-0/75">
            <HeaderStat label="Phase" value={finals.bracket.phase} accent="finals" />
            <HeaderStat label="Format" value={finals.bracket.mode} accent="finals" border />
            <HeaderStat
              label="Rounds"
              value={String(finals.bracket.rounds.length)}
              accent="finals"
              border
            />
          </div>
        </div>
      </section>

      <section
        className={cn("min-h-0 flex-1 gap-4", focused ? "grid grid-cols-1" : "grid grid-cols-4")}
      >
        {rounds.map((bracketRound, index) => (
          <div
            key={bracketRound.title}
            className={cn(
              "min-h-0 border border-border/80 bg-surface-1/70 slab-shadow",
              focused ? "p-5" : "p-4",
            )}
            style={{ borderLeft: "4px solid var(--finals)" }}
          >
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-border/70 pb-3">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-finals">
                  // Round {String((selectedIndex ?? index) + 1).padStart(2, "0")}
                </div>
                <h3
                  className={cn(
                    "font-heading font-black uppercase italic tracking-tight text-white",
                    focused ? "text-5xl" : "text-3xl",
                  )}
                >
                  {bracketRound.title}
                </h3>
              </div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {bracketRound.matches.length} matches
              </div>
            </div>
            <div
              className={cn(
                "grid gap-3",
                finalsMatchGridClass(bracketRound.matches.length, focused),
              )}
            >
              {bracketRound.matches.map((match) => (
                <OverlayMatchCard key={match.id} featured={focused} match={match} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function OverlayLobbyCard({
  accent,
  dense,
  featured,
  lobby,
}: {
  accent: string;
  dense?: boolean;
  featured?: boolean;
  lobby: Lobby;
}) {
  const visiblePlayers = lobby.players.filter((player) => !isPlaceholderPlayer(player));
  const players = visiblePlayers.length ? visiblePlayers : lobby.players;

  return (
    <article
      className={cn(
        "relative min-h-0 border border-border/80 bg-surface-1/85 slab-shadow",
        featured && "p-5",
      )}
      style={{ borderLeft: `4px solid var(--${accent})` }}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border/70",
          featured ? "pb-4" : "px-3 py-2",
        )}
      >
        <div className="min-w-0">
          <div className="truncate font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {lobby.id}
          </div>
          <div
            className={cn(
              "font-heading font-black uppercase italic tracking-tight text-white",
              featured ? "text-5xl" : "text-2xl",
            )}
          >
            {lobby.status}
          </div>
        </div>
        <div
          className="shrink-0 border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
          style={{
            borderColor: `color-mix(in oklab, var(--${accent}) 45%, transparent)`,
            color: `var(--${accent})`,
          }}
        >
          {players.length} players
        </div>
      </header>

      <div className={cn(featured ? "mt-5 grid gap-3" : "divide-y divide-border/45")}>
        {players.map((player, index) => (
          <OverlayPlayerRow
            key={`${player.seed}-${player.name}-${index}`}
            accent={accent}
            dense={dense}
            featured={featured}
            player={player}
          />
        ))}
      </div>
    </article>
  );
}

function OverlayPlayerRow({
  accent,
  dense,
  featured,
  player,
}: {
  accent: string;
  dense?: boolean;
  featured?: boolean;
  player: Player;
}) {
  const rank = player.rank ?? Number(player.seed);
  const statusColor = playerAccent(player, accent);

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-3",
        featured ? "border border-border/60 bg-surface-0/60 px-4 py-3" : "px-3 py-2",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "grid shrink-0 place-items-center border font-mono font-black tabular-nums",
            featured ? "h-10 w-10 text-sm" : "h-7 w-7 text-[10px]",
          )}
          style={{
            borderColor: `color-mix(in oklab, var(--${statusColor}) 35%, transparent)`,
            color: `var(--${statusColor})`,
          }}
        >
          {String(Number.isFinite(rank) ? rank : player.seed).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div
            className={cn(
              "truncate font-heading font-black uppercase italic leading-none tracking-tight",
              featured ? "text-4xl" : dense ? "text-base" : "text-xl",
              isPlaceholderPlayer(player) ? "text-muted-foreground/50" : "text-white",
            )}
          >
            {player.name}
          </div>
          {(player.city || player.region) && (
            <div
              className={cn(
                "mt-1 truncate font-mono uppercase tracking-widest text-muted-foreground",
                featured ? "text-[12px]" : "text-[9px]",
              )}
            >
              {player.city}
              {player.region && <span className="ml-2 opacity-70">/ {player.region}</span>}
            </div>
          )}
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 font-mono font-black uppercase tracking-widest",
          featured ? "text-[13px]" : "text-[9px]",
        )}
        style={{ color: `var(--${statusColor})` }}
      >
        {player.score != null ? String(player.score).padStart(2, "0") : player.stateLabel}
      </div>
    </div>
  );
}

function WildcardPoolCard({
  players,
  sourceGroup,
}: {
  players: WildcardPlayer[];
  sourceGroup: WildcardPlayer["sourceGroup"];
}) {
  const accent = sourceGroup === "Titan" ? "titan" : sourceGroup === "Nexus" ? "nexus" : "dominion";

  return (
    <article
      className="min-h-0 border border-border/80 bg-surface-1/85 slab-shadow"
      style={{ borderLeft: `4px solid var(--${accent})` }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            From
          </div>
          <div
            className="font-heading text-3xl font-black uppercase italic tracking-tight"
            style={{ color: `var(--${accent})` }}
          >
            {sourceGroup}
          </div>
        </div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Rank 5-8
        </div>
      </header>
      <div className="divide-y divide-border/45">
        {players.map((player) => (
          <div key={player.seed} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center border font-mono text-xs font-black tabular-nums"
                style={{ borderColor: `var(--${accent})`, color: `var(--${accent})` }}
              >
                {player.sourceRank}
              </span>
              <div className="min-w-0">
                <div className="truncate font-heading text-2xl font-black uppercase italic leading-none tracking-tight text-white">
                  {player.name}
                </div>
                <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {player.city || "Awaiting city"}
                </div>
              </div>
            </div>
            <div className="font-mono text-[10px] font-black uppercase tracking-widest text-wildcard">
              {player.statusLabel}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function OverlayMatchCard({ featured, match }: { featured?: boolean; match: Match }) {
  const isFinal = match.status === "final";
  const railColor = isFinal
    ? "var(--finals)"
    : "color-mix(in oklab, var(--border-strong) 70%, transparent)";

  return (
    <article
      className="border border-border/80 bg-surface-0/70 slab-shadow"
      style={{ borderLeft: `4px solid ${railColor}` }}
    >
      <header
        className={cn(
          "flex items-center justify-between border-b border-border/60",
          featured ? "px-4 py-3" : "px-3 py-2",
        )}
      >
        <div className="truncate font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {match.label}
        </div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-finals">
          {isFinal ? "Final" : match.status}
        </div>
      </header>
      <div className="divide-y divide-border/45">
        {match.entrants.map((entrant) => (
          <div
            key={`${match.id}-${entrant.seed}`}
            className={cn(
              "flex items-center justify-between gap-3",
              featured ? "px-4 py-3" : "px-3 py-2",
              entrant.winner && "bg-finals-soft/50",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-7 shrink-0 font-mono text-[10px] font-black text-muted-foreground">
                {entrant.seed}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "truncate font-heading font-black uppercase italic leading-none tracking-tight",
                    featured ? "text-2xl" : "text-xl",
                    entrant.pending ? "text-muted-foreground/55" : "text-white",
                  )}
                >
                  {entrant.name}
                </div>
                {entrant.city && (
                  <div className="mt-1 truncate font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    {entrant.city}
                  </div>
                )}
              </div>
            </div>
            <div
              className={cn(
                "min-w-10 text-right font-heading font-black italic tabular-nums",
                featured ? "text-4xl" : "text-3xl",
                entrant.winner ? "text-finals" : "text-foreground/80",
              )}
            >
              {entrant.score ?? "-"}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HeaderStat({
  accent,
  border,
  label,
  value,
}: {
  accent: string;
  border?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("min-w-0 px-4 py-3", border && "border-l border-border/70")}>
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-1 truncate font-heading text-2xl font-black uppercase italic tracking-tight"
        style={{ color: `var(--${accent})` }}
      >
        {value}
      </div>
    </div>
  );
}

function OverviewStat({ accent, label, value }: { accent: string; label: string; value: string }) {
  return (
    <div className="border border-border/70 bg-surface-0/70 p-4">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-1 font-heading text-5xl font-black uppercase italic tabular-nums tracking-tight"
        style={{ color: `var(--${accent})` }}
      >
        {value}
      </div>
    </div>
  );
}

function RouteCard({
  accent,
  icon: Icon,
  label,
  value,
}: {
  accent: string;
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div
      className="relative flex items-center gap-5 overflow-hidden border border-border/80 bg-surface-1/75 p-5 slab-shadow"
      style={{ borderLeft: `4px solid var(--${accent})` }}
    >
      <div
        className="grid h-16 w-16 shrink-0 place-items-center border"
        style={{
          borderColor: `color-mix(in oklab, var(--${accent}) 45%, transparent)`,
          color: `var(--${accent})`,
        }}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </div>
        <div className="font-heading text-4xl font-black uppercase italic tracking-tight text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function resolveObsSource(
  view: OverlayView,
  source?: ObsSource,
  round?: number | string,
  lobbyId?: string,
): ObsSource {
  if (source) return source;
  if (isGroupView(view)) return round || lobbyId ? "round" : "bracket";
  if (view === "finals") return "round";
  return "bracket";
}

function isGroupView(view: OverlayView): view is GroupKey {
  return view === "titan" || view === "nexus" || view === "dominion";
}

function overlayAccent(view: OverlayView) {
  if (view === "titan") return "titan";
  if (view === "nexus") return "nexus";
  if (view === "dominion") return "dominion";
  if (view === "wildcard") return "wildcard";
  return "finals";
}

function overlayTitle(view: OverlayView) {
  if (view === "titan") return "Titan";
  if (view === "nexus") return "Nexus";
  if (view === "dominion") return "Dominion";
  if (view === "wildcard") return "Wildcard";
  if (view === "finals") return "National Finals";
  return "Tournament Map";
}

function overlaySubtitle(view: OverlayView, source: ObsSource, round?: number | string) {
  if (isGroupView(view)) {
    if (source === "bracket") return `${GROUP_META[view].label} · Overall bracket`;
    if (source === "route") return `${GROUP_META[view].label} · Finals and Wildcard`;
    return `${GROUP_META[view].label} · ${roundSourceLabel(round)}`;
  }
  if (view === "wildcard") return "Last-chance bracket source";
  if (view === "finals") return `National Finals · ${finalsRoundSourceLabel(round)}`;
  return "Broadcast source";
}

function overlayDivisionLabel(view: OverlayView, source: ObsSource) {
  if (isGroupView(view)) {
    if (source === "bracket") return "Overall Group Bracket";
    if (source === "route") return "Qualification Route";
    return "Group Round Source";
  }
  if (view === "wildcard") return "Wildcard Bracket";
  if (view === "finals") return "Finals Source";
  return "OBS Source";
}

function overlayFooterStrap(view: OverlayView, source: ObsSource, round?: number | string) {
  if (isGroupView(view)) {
    if (source === "bracket") {
      return `${overlayTitle(view)}: Round 1-4 lobbies with each qualifying route`;
    }
    if (source === "route") {
      return `${overlayTitle(view)}: National Finals qualifiers and Wildcard pool`;
    }
    return `${overlayTitle(view)}: focused ${roundSourceLabel(round).toLowerCase()} lobby board`;
  }
  if (view === "wildcard") return "Wildcard bracket: pool to 4 National Finals slots";
  if (view === "finals") return `National Finals: ${finalsRoundSourceLabel(round)} browser source`;
  return "Legion Wars OBS browser source";
}

function roundSourceLabel(round?: number | string) {
  const roundIndex = normalizeRoundParam(round);
  return roundIndex == null ? "Current round" : roundLabel(roundIndex);
}

function finalsRoundSourceLabel(round?: number | string) {
  const roundIndex = normalizeRoundParam(round);
  return roundIndex == null
    ? "Full bracket"
    : (FINALS_ROUND_LABELS[roundIndex] ?? roundLabel(roundIndex));
}

function finalsMatchGridClass(matchCount: number, focused: boolean) {
  if (!focused) return "grid-cols-1";
  if (matchCount >= 4) return "grid-cols-4";
  if (matchCount === 2) return "grid-cols-2";
  return "mx-auto w-full max-w-[760px] grid-cols-1";
}

function groupByKey(data: TournamentData, key: GroupKey): GroupView {
  if (key === "titan") return data.groupTitan;
  if (key === "nexus") return data.groupNexus;
  return data.groupDominion;
}

function groupProgress(group: GroupView) {
  const total = group.progression.rounds.reduce((sum, round) => sum + round.players, 0);
  const decided = group.progression.rounds.reduce(
    (sum, round) =>
      sum +
      round.lobbies.reduce(
        (roundSum, lobby) =>
          roundSum + lobby.players.filter((player) => player.state !== "pending").length,
        0,
      ),
    0,
  );
  return {
    decided,
    total,
    percent: total > 0 ? Math.round((decided / total) * 100) : 0,
  };
}

function roundProgress(round: GroupView["progression"]["rounds"][number]) {
  const total = round.players;
  const decided = round.lobbies.reduce(
    (sum, lobby) => sum + lobby.players.filter((player) => player.state !== "pending").length,
    0,
  );
  return {
    decided,
    total,
    percent: total > 0 ? Math.round((decided / total) * 100) : 0,
  };
}

function groupRoutePlayers(group: GroupView) {
  const rounds = group.progression.rounds;
  const roundFour = rounds[3] ?? rounds[rounds.length - 1];
  const players: RoutedPlayer[] = (roundFour?.lobbies ?? []).flatMap((lobby) =>
    lobby.players
      .filter((player) => !isPlaceholderPlayer(player))
      .map((player) => ({ ...player, lobbyId: lobby.id })),
  );
  const byRoute = (left: RoutedPlayer, right: RoutedPlayer) => {
    const leftRank = sortablePlayerRank(left);
    const rightRank = sortablePlayerRank(right);
    return leftRank - rightRank || left.lobbyId.localeCompare(right.lobbyId);
  };

  return {
    finals: players
      .filter((player) => player.state === "finals" || player.state === "advance")
      .sort(byRoute),
    wildcard: players.filter((player) => player.state === "wildcard").sort(byRoute),
  };
}

function routedLobbyPlayers(lobby: Lobby) {
  return lobby.players.filter((player) => {
    if (isPlaceholderPlayer(player)) return false;
    return player.state === "advance" || player.state === "finals" || player.state === "wildcard";
  });
}

function playerAccent(player: Player, fallback: string) {
  if (player.state === "finals") return "finals";
  if (player.state === "wildcard") return "wildcard";
  if (player.state === "advance") return fallback;
  if (player.state === "live") return "live";
  return fallback;
}

function sortablePlayerRank(player: Player) {
  const candidate = player.rank ?? Number(player.seed);
  return Number.isFinite(candidate) ? candidate : 999;
}

function selectedGroupRoundIndex(group: GroupView, round?: number | string) {
  const explicitRound = normalizeRoundParam(round);
  if (explicitRound != null) return explicitRound;
  const liveRound = group.progression.rounds.findIndex((candidate) =>
    candidate.lobbies.some((lobby) => lobby.status === "Live" || lobby.status === "Ready"),
  );
  if (liveRound >= 0) return liveRound;
  const activeRound = group.progression.rounds.findIndex((candidate) =>
    candidate.lobbies.some((lobby) => lobby.status !== "Pending"),
  );
  return activeRound >= 0 ? activeRound : 0;
}

function normalizeRoundParam(round?: number | string) {
  if (!round) return null;
  const parsed = Number(round);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed - 1;
}

function roundLabel(roundIndex: number) {
  return `R${String(roundIndex + 1).padStart(2, "0")}`;
}

function isPlaceholderPlayer(player: Player) {
  return /^awaiting\s+(player|qualifier)$/i.test(player.name.trim());
}
