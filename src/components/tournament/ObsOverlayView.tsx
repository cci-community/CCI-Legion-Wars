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

const GROUP_META = {
  titan: { title: "Group A", division: "Titan", accent: "titan" },
  nexus: { title: "Group B", division: "Nexus", accent: "nexus" },
  dominion: { title: "Group C", division: "Dominion", accent: "dominion" },
} as const;

const GROUP_ORDER = ["titan", "nexus", "dominion"] as const;

export function ObsOverlayView({
  data,
  error,
  isLoading,
  isRefreshing,
  lobbyId,
  round,
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
  syncStatus: string;
  syncSummary: string;
  transparent?: boolean;
  view: OverlayView;
}) {
  const accent = overlayAccent(view);

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
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(900px 520px at 12% 0%, color-mix(in oklab, var(--${accent}) 20%, transparent), transparent 68%), radial-gradient(1000px 620px at 100% 100%, color-mix(in oklab, var(--${accent}) 11%, transparent), transparent 62%)`,
            }}
          />
        </>
      )}

      <div className="relative flex h-full flex-col p-8">
        <OverlayHeader
          accent={accent}
          error={error}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          syncStatus={syncStatus}
          syncSummary={syncSummary}
          view={view}
        />

        <main className="min-h-0 flex-1 pt-5">
          {view === "overview" && <OverviewOverlay data={data} />}
          {view === "titan" && (
            <GroupOverlay
              group={data.groupTitan}
              groupKey="titan"
              lobbyId={lobbyId}
              round={round}
            />
          )}
          {view === "nexus" && (
            <GroupOverlay
              group={data.groupNexus}
              groupKey="nexus"
              lobbyId={lobbyId}
              round={round}
            />
          )}
          {view === "dominion" && (
            <GroupOverlay
              group={data.groupDominion}
              groupKey="dominion"
              lobbyId={lobbyId}
              round={round}
            />
          )}
          {view === "wildcard" && <WildcardOverlay data={data} />}
          {view === "finals" && <FinalsOverlay finals={data.finalsView} round={round} />}
        </main>
      </div>
    </div>
  );
}

function OverlayHeader({
  accent,
  error,
  isLoading,
  isRefreshing,
  syncStatus,
  syncSummary,
  view,
}: {
  accent: string;
  error: Error | null;
  isLoading: boolean;
  isRefreshing: boolean;
  syncStatus: string;
  syncSummary: string;
  view: OverlayView;
}) {
  const title = overlayTitle(view);
  const subtitle = overlaySubtitle(view);
  const loadingLabel = error
    ? "Sync issue"
    : isLoading
      ? "Loading"
      : isRefreshing
        ? "Refreshing"
        : syncStatus;

  return (
    <header className="flex shrink-0 items-center justify-between gap-8 border-b border-border/80 pb-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-border-strong bg-surface-1/85 clip-chamfer-sm shadow-[0_0_32px_-12px_var(--tab-accent)]">
          <img
            src="/legion-wars-logo-mark.png"
            alt=""
            className="h-14 w-14 object-contain brightness-110 contrast-125 drop-shadow-[0_3px_10px_rgba(0,0,0,0.65)]"
          />
          <span className="pointer-events-none absolute inset-x-1 top-0 h-px bg-[color:var(--tab-accent)]/75" />
          <span className="pointer-events-none absolute inset-y-1 right-0 w-px bg-[color:var(--tab-accent)]/55" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
            <span className="h-2 w-2" style={{ background: `var(--${accent})` }} />
            Legion Wars 2026
            <span className="text-muted-foreground/40">//</span>
            Broadcast Overlay
          </div>
          <h1 className="mt-1 truncate font-heading text-6xl font-black uppercase italic leading-none tracking-tight text-white">
            {title}
          </h1>
          <div className="mt-1 font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-stretch border border-border/80 bg-surface-0/75 slab-shadow">
        <HeaderStat label="Source" value="Public Sheets" accent={accent} />
        <HeaderStat label="State" value={loadingLabel} accent={error ? "live" : accent} border />
        <HeaderStat label="Updated" value={syncSummary} accent={accent} border />
      </div>
    </header>
  );
}

function OverviewOverlay({ data }: { data: TournamentData }) {
  const cards = GROUP_ORDER.map((key) => {
    const group = groupByKey(data, key);
    const progress = groupProgress(group);
    return {
      accent: GROUP_META[key].accent,
      label: GROUP_META[key].title,
      title: GROUP_META[key].division,
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
        <RouteCard icon={Users} label="Group Stage" value="A / B / C" accent="titan" />
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

  return (
    <div className="flex h-full flex-col gap-5">
      <section className="grid shrink-0 grid-cols-[1fr_auto] gap-5">
        <div
          className="relative overflow-hidden border border-border/80 bg-surface-1/70 p-5 slash-band"
          style={{ borderLeft: `4px solid var(--${accent})` }}
        >
          <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
            // Legion Wars · Group Stage
          </div>
          <div className="mt-1 flex items-end gap-3">
            <h2 className="font-heading text-7xl font-black uppercase italic leading-none tracking-tight text-white">
              {GROUP_META[groupKey].title}
            </h2>
            <span
              className="mb-2 font-heading text-5xl font-black uppercase italic leading-none tracking-tight"
              style={{ color: `var(--${accent})` }}
            >
              {GROUP_META[groupKey].division}
            </span>
          </div>
        </div>
        <div className="grid min-w-[520px] grid-cols-3 border border-border/80 bg-surface-0/75 slab-shadow">
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

      <section className={cn("min-h-0 flex-1 gap-4", "grid", lobbyGridClass)}>
        {lobbies.map((lobby) => (
          <OverlayLobbyCard
            key={lobby.id}
            accent={accent}
            dense={!prominent && lobbies.length > 8}
            featured={prominent}
            lobby={lobby}
          />
        ))}
      </section>
    </div>
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
            className="min-h-0 border border-border/80 bg-surface-1/70 p-4 slab-shadow"
            style={{ borderLeft: "4px solid var(--finals)" }}
          >
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-border/70 pb-3">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-finals">
                  // Round {String((selectedIndex ?? index) + 1).padStart(2, "0")}
                </div>
                <h3 className="font-heading text-3xl font-black uppercase italic tracking-tight text-white">
                  {bracketRound.title}
                </h3>
              </div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {bracketRound.matches.length} matches
              </div>
            </div>
            <div className={cn("grid gap-3", focused && "grid-cols-2")}>
              {bracketRound.matches.map((match) => (
                <OverlayMatchCard key={match.id} match={match} />
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
  const statusColor =
    player.state === "finals"
      ? "finals"
      : player.state === "wildcard"
        ? "wildcard"
        : player.state === "advance"
          ? accent
          : player.state === "live"
            ? "live"
            : undefined;

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
            borderColor: `color-mix(in oklab, var(--${statusColor ?? accent}) 35%, transparent)`,
            color: `var(--${statusColor ?? accent})`,
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
        style={{ color: statusColor ? `var(--${statusColor})` : "var(--muted-foreground)" }}
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

function OverlayMatchCard({ match }: { match: Match }) {
  const isFinal = match.status === "final";
  const railColor = isFinal
    ? "var(--finals)"
    : "color-mix(in oklab, var(--border-strong) 70%, transparent)";

  return (
    <article
      className="border border-border/80 bg-surface-0/70 slab-shadow"
      style={{ borderLeft: `4px solid ${railColor}` }}
    >
      <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
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
              "flex items-center justify-between gap-3 px-3 py-2",
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
                    "truncate font-heading text-xl font-black uppercase italic leading-none tracking-tight",
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
                "min-w-10 text-right font-heading text-3xl font-black italic tabular-nums",
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

function overlayAccent(view: OverlayView) {
  if (view === "titan") return "titan";
  if (view === "nexus") return "nexus";
  if (view === "dominion") return "dominion";
  if (view === "wildcard") return "wildcard";
  return "finals";
}

function overlayTitle(view: OverlayView) {
  if (view === "titan") return "Group A";
  if (view === "nexus") return "Group B";
  if (view === "dominion") return "Group C";
  if (view === "wildcard") return "Wildcard";
  if (view === "finals") return "National Finals";
  return "Tournament Map";
}

function overlaySubtitle(view: OverlayView) {
  if (view === "titan") return "Titan Division";
  if (view === "nexus") return "Nexus Division";
  if (view === "dominion") return "Dominion Division";
  if (view === "wildcard") return "Rank 5-8 last chance pool";
  if (view === "finals") return "16-player single elimination bracket";
  return "Groups, wildcard, finals";
}

function groupByKey(data: TournamentData, key: keyof typeof GROUP_META): GroupView {
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
