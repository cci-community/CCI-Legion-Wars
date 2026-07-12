import { Crown, Shield, Trophy, Users, Zap } from "lucide-react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type {
  FinalsView,
  GroupView,
  Lobby,
  Match,
  Player,
  TournamentData,
  WildcardLobby,
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
const BROADCAST_PHASES = [
  { key: "groups", label: "Groups", detail: "R1-R4" },
  { key: "wildcard", label: "Wildcard", detail: "Last chance" },
  { key: "finals", label: "Finals", detail: "Top 16" },
  { key: "champion", label: "Crown", detail: "Champion" },
] as const;

function accentVarStyle(accent: string): CSSProperties {
  return { "--panel-accent": `var(--${accent})` } as CSSProperties;
}

function accentValueStyle(value: string): CSSProperties {
  return { "--panel-accent": value } as CSSProperties;
}

function ObsBackdrop({ accent }: { accent: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 obs-stage-backdrop" />
      <div className="pointer-events-none absolute inset-0 obs-arcane-radial opacity-85" />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-55" />
      <div className="pointer-events-none absolute inset-0 hex-grid opacity-45" />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-35" />
      <div className="pointer-events-none absolute inset-0 obs-royal-vignette" />
      <div
        className="pointer-events-none absolute left-1/2 top-[-18rem] h-[34rem] w-[64rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, var(--${accent}) 22%, transparent), transparent 68%)`,
        }}
      />
    </>
  );
}

function BroadcastOrnamentFrame() {
  return (
    <div className="pointer-events-none absolute inset-5 obs-ceremonial-border">
      <FrameCorner className="left-[-1px] top-[-1px]" />
      <FrameCorner className="right-[-1px] top-[-1px] rotate-90" />
      <FrameCorner className="bottom-[-1px] right-[-1px] rotate-180" />
      <FrameCorner className="bottom-[-1px] left-[-1px] -rotate-90" />
      <div className="obs-frame-crown absolute left-1/2 top-[-18px] h-9 w-[260px] -translate-x-1/2" />
      <div className="obs-frame-crown absolute bottom-[-18px] left-1/2 h-9 w-[260px] -translate-x-1/2 rotate-180" />
    </div>
  );
}

function FrameCorner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("absolute h-24 w-24 text-finals", className)}
      fill="none"
      viewBox="0 0 96 96"
    >
      <path d="M3 58V3h55" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 70V15h58" stroke="currentColor" strokeOpacity=".34" strokeWidth="1.2" />
      <path d="M3 25h22V3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M45 3 3 45" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.2" />
      <path
        d="M26 20h28l12 12-34 34-12-12V26z"
        stroke="currentColor"
        strokeOpacity=".34"
        strokeLinejoin="miter"
        strokeWidth="1.2"
      />
      <path d="M31 30h26M30 41h17" stroke="currentColor" strokeOpacity=".52" strokeWidth="1.2" />
    </svg>
  );
}

function BroadcastGlyph({ accent, className }: { accent: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("text-[color:var(--tab-accent)]", className)}
      fill="none"
      viewBox="0 0 80 80"
      style={{ color: `var(--${accent})` }}
    >
      <path
        d="M40 4 67 18v28L40 76 13 46V18z"
        stroke="currentColor"
        strokeOpacity=".82"
        strokeWidth="2"
      />
      <path
        d="M40 13 57 23v18L40 62 23 41V23z"
        stroke="var(--finals)"
        strokeOpacity=".74"
        strokeWidth="1.35"
      />
      <path
        d="M40 19c8 6 12 13 12 21 0 7-4 13-12 20-8-7-12-13-12-20 0-8 4-15 12-21Z"
        stroke="currentColor"
        strokeOpacity=".42"
        strokeWidth="1.4"
      />
      <path d="M26 54 40 18l14 36" stroke="currentColor" strokeOpacity=".6" strokeWidth="1.7" />
      <path d="M30 39h20" stroke="var(--finals)" strokeLinecap="square" strokeWidth="2" />
      <path d="m16 19 24 22 24-22" stroke="currentColor" strokeOpacity=".22" />
      <path d="M20 56c8 6 15 9 20 9s12-3 20-9" stroke="var(--finals)" strokeOpacity=".28" />
    </svg>
  );
}

function BroadcastPanel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={cn("obs-broadcast-panel", className)} style={style}>
      <div className="obs-panel-content h-full">{children}</div>
    </section>
  );
}

function PanelCornerMarks({ accent = "finals" }: { accent?: string }) {
  return (
    <>
      <span
        className="obs-corner-mark pointer-events-none absolute left-2 top-2 z-[2] h-6 w-6 border-l border-t"
        style={{ borderColor: `var(--${accent})` }}
      />
      <span
        className="obs-corner-mark pointer-events-none absolute bottom-2 right-2 z-[2] h-6 w-6 border-b border-r"
        style={{ borderColor: `var(--${accent})` }}
      />
    </>
  );
}

function SigilNumber({
  accent,
  active,
  complete,
  value,
}: {
  accent: string;
  active?: boolean;
  complete?: boolean;
  value: ReactNode;
}) {
  return (
    <span
      className={cn(
        "obs-medallion h-10 w-10 font-heading text-xl font-black italic tabular-nums",
        active && "obs-medallion-active",
        !active && complete && "text-finals",
        !active && !complete && "text-muted-foreground",
      )}
      style={{
        borderColor: active
          ? `color-mix(in oklab, var(--${accent}) 72%, var(--finals))`
          : undefined,
      }}
    >
      {value}
    </span>
  );
}

function BroadcastChevron({ accent = "finals" }: { accent?: string }) {
  return (
    <svg aria-hidden="true" className="h-8 w-12" fill="none" viewBox="0 0 48 32">
      <path
        d="M2 16h35"
        stroke={`var(--${accent})`}
        strokeLinecap="square"
        strokeOpacity=".72"
        strokeWidth="2"
      />
      <path
        d="m30 6 12 10-12 10"
        stroke="var(--finals)"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="2"
      />
      <path d="M11 10h8M11 22h8" stroke={`var(--${accent})`} strokeOpacity=".36" />
    </svg>
  );
}

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
          <ObsBackdrop accent={accent} />
        </>
      )}

      <BroadcastOrnamentFrame />

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
    <header className="obs-broadcast-panel obs-broadcast-header relative shrink-0">
      <div className="obs-panel-content relative grid grid-cols-[auto_minmax(0,1fr)_minmax(420px,600px)] items-center gap-7 px-7 py-4">
        <div className="obs-logo-crest relative grid h-32 w-32 shrink-0 place-items-center">
          <BroadcastGlyph accent={accent} className="absolute inset-0 opacity-55" />
          <div className="obs-logo-crest-ring absolute inset-3" />
          <img
            src="/legion-wars-logo-mark.png"
            alt=""
            className="relative h-[94px] w-[94px] object-contain brightness-125 contrast-125 drop-shadow-[0_10px_22px_rgba(0,0,0,0.9)]"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-3 font-mono text-[12px] font-bold uppercase tracking-[0.36em] text-muted-foreground">
            <span className="obs-pip" style={{ color: `var(--${accent})` }} />
            Legion Wars 2026
            <span className="text-muted-foreground/40">//</span>
            {divisionLabel}
          </div>
          <h1 className="mt-1 truncate font-heading text-[5.15rem] font-black uppercase italic leading-[0.84] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]">
            {title}
          </h1>
          <div className="mt-1 font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {subtitle}
          </div>
          <BroadcastPhaseRail accent={accent} round={round} source={source} view={view} />
        </div>

        <div className="obs-header-stats grid grid-cols-3">
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
    <footer className="obs-broadcast-panel obs-broadcast-footer grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center">
      <div
        className="obs-panel-content obs-footer-label px-5 py-3 font-heading text-2xl font-black uppercase italic tracking-tight text-background"
        style={{ background: `var(--${accent})` }}
      >
        Live Bracket
      </div>
      <div className="obs-panel-content truncate px-5 font-mono text-[12px] font-bold uppercase tracking-[0.26em] text-foreground">
        {strap}
      </div>
      <div className="obs-panel-content border-l border-finals/20 px-5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
        {syncSummary}
      </div>
    </footer>
  );
}

function BroadcastPhaseRail({
  accent,
  round,
  source,
  view,
}: {
  accent: string;
  round?: number | string;
  source: ObsSource;
  view: OverlayView;
}) {
  const activeKey = isGroupView(view)
    ? "groups"
    : view === "wildcard"
      ? "wildcard"
      : view === "finals"
        ? "finals"
        : "groups";

  return (
    <div className="obs-phase-rail relative mt-4 flex max-w-[1120px] items-center gap-2">
      <div className="absolute left-7 right-7 top-5 h-px bg-gradient-to-r from-transparent via-finals/70 to-transparent" />
      {BROADCAST_PHASES.map((phase, index) => {
        const active = phase.key === activeKey;
        const complete =
          phase.key === "groups" && (view === "wildcard" || view === "finals")
            ? true
            : phase.key === "wildcard" && view === "finals";
        return (
          <div
            key={phase.key}
            className={cn(
              "obs-phase-step relative grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-2.5 py-2",
              active && "obs-phase-step-active",
            )}
            style={
              {
                "--phase-accent": active ? `var(--${accent})` : "var(--border-strong)",
              } as CSSProperties
            }
          >
            <SigilNumber accent={accent} active={active} complete={complete} value={index + 1} />
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate font-mono text-[8px] font-black uppercase tracking-[0.14em]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {phase.label}
              </span>
              <span className="block truncate font-mono text-[7px] uppercase tracking-[0.1em] text-muted-foreground/75">
                {phase.key === "finals" && view === "finals"
                  ? finalsRoundSourceLabel(round)
                  : phase.key === "groups" && isGroupView(view)
                    ? source === "route"
                      ? "R4 route lock"
                      : source === "round"
                        ? roundSourceLabel(round)
                        : phase.detail
                    : phase.detail}
              </span>
            </span>
          </div>
        );
      })}
    </div>
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
              className="obs-match-card flex items-center justify-between border border-border/70 px-4 py-3"
              style={accentVarStyle(card.accent)}
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
        <BroadcastPanel className="obs-title-plate p-5" style={accentVarStyle(accent)}>
          <PanelCornerMarks accent={accent} />
          <div className="flex items-center gap-5">
            <BroadcastGlyph accent={accent} className="h-16 w-16 shrink-0" />
            <div className="min-w-0">
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
                Stage Board
              </div>
              <div className="mt-1 flex items-end gap-4">
                <h2
                  className="font-heading text-6xl font-black uppercase italic leading-none tracking-tight"
                  style={{ color: `var(--${accent})` }}
                >
                  {GROUP_META[groupKey].title}
                </h2>
                <span className="mb-2 font-mono text-[14px] font-bold uppercase tracking-[0.28em] text-foreground">
                  Round 1-4 bracket board
                </span>
              </div>
            </div>
          </div>
          <GroupStageFlow accent={accent} />
        </BroadcastPanel>

        <div
          className="obs-broadcast-panel obs-stat-plate grid grid-cols-4"
          style={accentVarStyle(accent)}
        >
          <PanelCornerMarks accent={accent} />
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

      <section className="relative grid min-h-0 grid-cols-[1.25fr_1fr_0.82fr_0.72fr] gap-4">
        {group.progression.rounds.map((round, index) => (
          <div key={round.title} className="relative min-h-0">
            {index < group.progression.rounds.length - 1 && (
              <div className="pointer-events-none absolute -right-8 top-1/2 z-10 -translate-y-1/2">
                <BroadcastChevron accent={index === 2 ? "finals" : accent} />
              </div>
            )}
            <GroupBracketRoundColumn accent={accent} round={round} roundIndex={index} />
          </div>
        ))}
      </section>
    </div>
  );
}

function GroupStageFlow({ accent }: { accent: string }) {
  const steps = [
    { label: "Round 1", value: "64" },
    { label: "Round 2", value: "32" },
    { label: "Round 3", value: "16" },
    { label: "Round 4", value: "8" },
    { label: "Route", value: "4 + 4" },
  ];

  return (
    <div className="relative mt-4 grid grid-cols-5 gap-2">
      <div className="obs-route-wire absolute left-8 right-8 top-1/2 h-px -translate-y-1/2" />
      {steps.map((step, index) => (
        <div
          key={step.label}
          className="obs-stage-step relative px-3 py-2"
          style={
            {
              "--stage-step-accent":
                index === steps.length - 1 ? "var(--finals)" : `var(--${accent})`,
            } as CSSProperties
          }
        >
          {index > 0 && (
            <span className="absolute -left-3 top-1/2 grid h-5 w-5 -translate-y-1/2 rotate-45 place-items-center border border-finals/45 bg-background/95 shadow-[0_0_18px_-8px_var(--finals)]">
              <span
                className="h-1.5 w-1.5 bg-current"
                style={{ color: index === steps.length - 1 ? "var(--finals)" : `var(--${accent})` }}
              />
            </span>
          )}
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            {step.label}
          </div>
          <div
            className="mt-0.5 font-heading text-2xl font-black uppercase italic leading-none tabular-nums tracking-tight"
            style={{ color: index === steps.length - 1 ? "var(--finals)" : `var(--${accent})` }}
          >
            {step.value}
          </div>
        </div>
      ))}
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
    <section
      className="obs-broadcast-panel obs-bracket-lane obs-round-lane relative flex h-full min-h-0 flex-col p-3"
      style={accentVarStyle(accent)}
    >
      <PanelCornerMarks accent={accent} />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-1"
        style={{ background: `var(--${accent})` }}
      />
      <header className="obs-panel-content shrink-0 border-b border-finals/20 pb-2 pl-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <SigilNumber
              accent={accent}
              active={roundIndex === 3}
              complete={roundState.decided > 0}
              value={String(roundIndex + 1).padStart(2, "0")}
            />
            <div className="min-w-0">
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                Round Lane
              </div>
              <h3 className="mt-0.5 font-heading text-2xl font-black uppercase italic leading-none tracking-tight text-white">
                {round.title}
              </h3>
              <div className="mt-1 truncate font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {round.advance}
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {roundState.decided}/{roundState.total}
          </div>
        </div>
      </header>

      <div
        className="obs-panel-content mt-2 grid min-h-0 flex-1 gap-1.5"
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
      <article className="obs-match-card grid min-h-0 grid-cols-[100px_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden border border-border/45 px-2 py-0.5">
        <div className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {lobby.id}
        </div>
        <div className="obs-player-name truncate font-heading text-[11px] font-black uppercase leading-none tracking-tight text-white">
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
    <article className="obs-match-card min-h-0 overflow-hidden border border-border/55 px-2 py-1.5">
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
              className="obs-player-name truncate border-t border-border/45 pt-1 font-heading text-sm font-black uppercase leading-none tracking-tight"
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
            "obs-player-name mt-1 truncate border-t border-border/45 pt-1 font-heading font-black uppercase leading-none tracking-tight text-white",
            dense ? "text-[11px]" : compact ? "text-sm" : "text-base",
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
        <BroadcastPanel className="obs-title-plate p-5" style={accentVarStyle(accent)}>
          <PanelCornerMarks accent={accent} />
          <div className="flex items-center gap-5">
            <BroadcastGlyph accent={accent} className="h-16 w-16 shrink-0" />
            <div>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
                Qualification Route
              </div>
              <div className="mt-1 flex items-end gap-4">
                <h2
                  className="font-heading text-6xl font-black uppercase italic leading-none tracking-tight"
                  style={{ color: `var(--${accent})` }}
                >
                  {GROUP_META[groupKey].title}
                </h2>
                <span className="mb-2 font-mono text-[14px] font-bold uppercase tracking-[0.28em] text-foreground">
                  Round 4 output board
                </span>
              </div>
            </div>
          </div>
        </BroadcastPanel>

        <div
          className="obs-broadcast-panel obs-stat-plate grid grid-cols-3"
          style={accentVarStyle(accent)}
        >
          <PanelCornerMarks accent={accent} />
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

      <section className="grid min-h-0 grid-cols-[0.9fr_150px_1fr_1fr] gap-5">
        <div className="grid min-h-0 grid-rows-2 gap-4">
          {(roundFour?.lobbies ?? []).slice(0, 2).map((lobby) => (
            <RouteLobbyCard key={lobby.id} accent={accent} lobby={lobby} />
          ))}
        </div>

        <RouteFlowColumn accent={accent} />

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

function RouteFlowColumn({ accent }: { accent: string }) {
  return (
    <div className="obs-route-spine relative grid min-h-0 grid-rows-[1fr_auto_1fr] items-stretch">
      <RouteSplitDestination accent="finals" label="National Finals" range="Rank 1-4" />

      <div
        className="obs-route-hub relative grid min-h-[170px] content-center gap-3 px-2 py-4 text-center"
        style={{ borderColor: `color-mix(in oklab, var(--${accent}) 55%, var(--border))` }}
      >
        <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          Round 4
        </div>
        <div
          className="font-heading text-4xl font-black uppercase italic leading-none tracking-tight"
          style={{ color: `var(--${accent})` }}
        >
          Split
        </div>
        <div className="grid gap-2">
          <div className="obs-route-lane obs-route-lane-finals">
            <span>1-4</span>
            <strong>Finals</strong>
          </div>
          <div className="obs-route-lane obs-route-lane-wildcard">
            <span>5-8</span>
            <strong>Wildcard</strong>
          </div>
        </div>
      </div>

      <RouteSplitDestination accent="wildcard" label="Wildcard Pool" range="Rank 5-8" />
    </div>
  );
}

function RouteSplitDestination({
  accent,
  label,
  range,
}: {
  accent: "finals" | "wildcard";
  label: string;
  range: string;
}) {
  return (
    <div className="obs-route-destination relative grid place-items-center">
      <div
        className="obs-route-arrow"
        style={{ background: `var(--${accent})`, color: `var(--${accent})` }}
      />
      <div
        className="obs-route-destination-card grid w-full gap-1 px-2 py-3 text-center"
        style={accentVarStyle(accent)}
      >
        <div
          className="font-mono text-[8px] font-black uppercase tracking-[0.18em]"
          style={{ color: `var(--${accent})` }}
        >
          {range}
        </div>
        <div className="font-heading text-xl font-black uppercase italic leading-none text-white">
          {label}
        </div>
      </div>
    </div>
  );
}

function RouteLobbyCard({ accent, lobby }: { accent: string; lobby: Lobby }) {
  const players = lobby.players.filter((player) => !isPlaceholderPlayer(player));

  return (
    <article
      className="obs-broadcast-panel obs-route-source-card min-h-0 p-3"
      style={accentVarStyle(accent)}
    >
      <PanelCornerMarks accent={accent} />
      <header className="obs-panel-content flex items-center justify-between gap-3 border-b border-finals/20 pb-2">
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
      <div className="obs-panel-content mt-3 grid grid-cols-2 gap-2">
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
    <div className="obs-match-card min-w-0 border border-border/50 px-2.5 py-2">
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
      <div className="obs-player-name mt-1 truncate font-heading text-base font-black uppercase leading-none tracking-tight text-white">
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
      className="obs-broadcast-panel obs-route-bucket min-h-0 p-5"
      style={accentVarStyle(accent)}
    >
      <PanelCornerMarks accent={accent} />
      <header className="obs-panel-content border-b border-finals/20 pb-4">
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

      <div className="obs-panel-content mt-4 grid gap-3">
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
              className="obs-match-card flex items-center justify-between gap-3 border border-border/50 px-3 py-3"
            >
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-heading text-2xl font-black uppercase italic tracking-tight text-foreground/75">
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
        "obs-match-card flex min-w-0 items-center justify-between gap-3 border border-border/50",
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
              "obs-player-name truncate font-heading font-black uppercase leading-none tracking-tight text-white",
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
  const normalizedLobbyId = lobbyId?.trim().toLowerCase();
  const selectedLobby = lobbyId
    ? group.progression.rounds
        .flatMap((candidate) => candidate.lobbies)
        .find((lobby) => lobby.id.toLowerCase() === normalizedLobbyId)
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
        <BroadcastPanel className="obs-title-plate p-6" style={accentVarStyle(accent)}>
          <PanelCornerMarks accent={accent} />
          <div className="pointer-events-none absolute right-6 top-5 font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground/30">
            {GROUP_META[groupKey].label}
          </div>
          <div className="flex items-center gap-5">
            <BroadcastGlyph accent={accent} className="h-20 w-20 shrink-0" />
            <div>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
                Legion Wars / Group Stage
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
          </div>
        </BroadcastPanel>
        <div
          className="obs-broadcast-panel obs-stat-plate grid grid-cols-3"
          style={accentVarStyle(accent)}
        >
          <PanelCornerMarks accent={accent} />
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
    <aside className="obs-broadcast-panel relative min-h-0">
      <PanelCornerMarks accent={accent} />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-1 bg-[color:var(--tab-accent)]" />
      <div className="relative flex h-full flex-col gap-3 p-4">
        <div className="border-b border-finals/20 pb-3">
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
    <section className="obs-match-card border border-border/70 p-3" style={accentVarStyle(accent)}>
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
  const lockedSlots = data.wildcardView.finalSlotPlayers.filter((slot) => !slot.pending).length;

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-5">
      <BroadcastPanel className="obs-title-plate p-5" style={accentVarStyle("wildcard")}>
        <PanelCornerMarks accent="wildcard" />
        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <BroadcastGlyph accent="wildcard" className="h-16 w-16 shrink-0" />
            <div>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-wildcard">
                Last Chance Bracket
              </div>
              <div className="mt-1 flex items-end gap-4">
                <h2 className="font-heading text-6xl font-black uppercase italic leading-none tracking-tight text-white">
                  Wildcard
                </h2>
                <span className="mb-2 font-mono text-[14px] font-bold uppercase tracking-[0.28em] text-foreground">
                  4 lobbies / 4 Nationals slots
                </span>
              </div>
            </div>
          </div>
          <div className="grid min-w-[520px] grid-cols-3 border border-wildcard/25 bg-surface-0/75">
            <HeaderStat
              label="Pool"
              value={String(data.wildcardView.poolCount)}
              accent="wildcard"
            />
            <HeaderStat
              label="Locked"
              value={`${lockedSlots}/${data.wildcardView.finalSlots}`}
              accent="wildcard"
              border
            />
            <HeaderStat label="Route" value="Nationals" accent="finals" border />
          </div>
        </div>
      </BroadcastPanel>

      <section className="grid min-h-0 grid-cols-[repeat(4,minmax(0,1fr))_420px] gap-4">
        {data.wildcardView.lobbies.map((lobby, index) => (
          <WildcardPoolCard key={lobby.id} index={index} lobby={lobby} />
        ))}
        <WildcardFinalSlotsPanel data={data.wildcardView} />
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
  const isGrandFinal = focused && selectedIndex === finals.bracket.rounds.length - 1;

  return (
    <div className="flex h-full flex-col gap-5">
      <BroadcastPanel className="obs-title-plate shrink-0 p-5" style={accentVarStyle("finals")}>
        <PanelCornerMarks accent="finals" />
        <div className="flex items-end justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <BroadcastGlyph accent="finals" className="h-16 w-16 shrink-0" />
            <div className="min-w-0">
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.34em] text-finals">
                National Finals Bracket
              </div>
              <h2 className="mt-1 font-heading text-6xl font-black uppercase italic leading-none tracking-tight text-white">
                Main Bracket
              </h2>
              <FinalsPathRail finals={finals} selectedIndex={selectedIndex} />
            </div>
          </div>
          <div className="grid min-w-[600px] grid-cols-3 border border-finals/30 bg-surface-0/75">
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
      </BroadcastPanel>

      <section
        className={cn(
          "min-h-0 flex-1 gap-4",
          focused ? "grid grid-cols-[minmax(0,1fr)_420px]" : "grid grid-cols-4",
        )}
      >
        <div
          className={cn(
            "grid min-h-0 gap-4",
            focused ? "grid-cols-1" : "grid-cols-4",
            isGrandFinal && "content-center",
          )}
        >
          {rounds.map((bracketRound, index) => (
            <div
              key={bracketRound.title}
              className={cn(
                "obs-broadcast-panel relative min-h-0",
                focused ? "p-5" : "p-4",
                isGrandFinal && "obs-champion-glow mx-auto w-full max-w-[980px]",
              )}
              style={accentVarStyle("finals")}
            >
              <PanelCornerMarks accent="finals" />
              <div className="obs-panel-content relative mb-4 flex items-end justify-between gap-3 border-b border-finals/25 pb-3">
                <div className="flex items-center gap-3">
                  <SigilNumber
                    accent="finals"
                    active={focused}
                    complete={bracketRound.matches.some((match) => match.status === "final")}
                    value={(selectedIndex ?? index) + 1}
                  />
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-finals">
                      Finals Lane
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
                </div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {bracketRound.matches.length} matches
                </div>
              </div>
              <div
                className={cn(
                  "obs-panel-content relative grid gap-3",
                  finalsMatchGridClass(bracketRound.matches.length, focused),
                )}
              >
                {bracketRound.matches.map((match) => (
                  <OverlayMatchCard
                    key={match.id}
                    featured={focused && bracketRound.matches.length <= 2}
                    match={match}
                    trophy={isGrandFinal}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {focused && <FinalsWinnerPathPanel finals={finals} selectedIndex={selectedIndex ?? 0} />}
      </section>
    </div>
  );
}

function FinalsPathRail({
  finals,
  selectedIndex,
}: {
  finals: FinalsView;
  selectedIndex: number | null;
}) {
  return (
    <div className="obs-finals-path relative mt-4 grid max-w-[980px] grid-cols-[repeat(4,minmax(0,1fr))_150px] gap-2">
      <div className="obs-route-wire absolute left-6 right-6 top-1/2 h-px -translate-y-1/2" />
      {finals.bracket.rounds.map((round, index) => {
        const decided = round.matches.filter((match) => match.status === "final").length;
        const active = selectedIndex === index || (selectedIndex == null && index === 0);
        return (
          <div
            key={round.title}
            className={cn(
              "obs-phase-step relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-3 py-2",
              active && "obs-phase-step-active",
            )}
            style={{ "--phase-accent": "var(--finals)" } as CSSProperties}
          >
            <SigilNumber accent="finals" active={active} complete={decided > 0} value={index + 1} />
            <div className="min-w-0">
              <div className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {round.title}
              </div>
              <div
                className={cn(
                  "mt-0.5 font-heading text-2xl font-black uppercase italic leading-none tabular-nums tracking-tight",
                  active ? "text-finals" : "text-white",
                )}
              >
                {decided}/{round.matches.length}
              </div>
            </div>
          </div>
        );
      })}
      <div
        className="obs-phase-step obs-phase-step-active relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-3 py-2"
        style={{ "--phase-accent": "var(--finals)" } as CSSProperties}
      >
        <SigilNumber accent="finals" active value={<Crown className="h-5 w-5" />} />
        <div className="min-w-0">
          <div className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Champion
          </div>
          <div className="mt-0.5 font-heading text-2xl font-black uppercase italic leading-none text-finals">
            Crown
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalsWinnerPathPanel({
  finals,
  selectedIndex,
}: {
  finals: FinalsView;
  selectedIndex: number;
}) {
  const finalRound = finals.bracket.rounds.at(-1);
  const grandFinal = finalRound?.matches[0];
  const champion = grandFinal ? matchWinner(grandFinal) : undefined;
  const activeRound = finals.bracket.rounds[selectedIndex];
  const nextRound = finals.bracket.rounds[selectedIndex + 1];
  const activeWinners =
    activeRound?.matches.flatMap((match) => {
      const winner = matchWinner(match);
      return winner ? [winner] : [];
    }) ?? [];
  const activeMatchCount = activeRound?.matches.length ?? 0;

  return (
    <aside
      className="obs-broadcast-panel obs-champion-glow obs-winner-path-panel relative min-h-0 p-3"
      style={accentVarStyle("finals")}
    >
      <PanelCornerMarks accent="finals" />
      <div className="relative flex h-full flex-col">
        <header className="obs-path-header border-b border-finals/30 pb-2">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            National Finals
          </div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <h3 className="font-heading text-3xl font-black uppercase italic leading-none tracking-tight text-finals">
              Finals Progression
            </h3>
            <div className="obs-medallion obs-medallion-active h-10 w-10">
              <Crown className="h-6 w-6 text-background" />
            </div>
          </div>
        </header>

        <div className="mt-2 grid gap-1.5">
          <WinnerPathStep
            active
            detail={
              nextRound
                ? `${activeMatchCount} ${winnerCountLabel(activeMatchCount)} advance to ${nextRound.title}`
                : "Grand Final winner becomes champion"
            }
            label="Current Round"
            value={`Locked: ${activeWinners.length}`}
          />
          <WinnerPathStep
            detail={
              nextRound
                ? `${nextRound.matches.length} ${matchCountLabel(nextRound.matches.length)} to be filled`
                : "Final winner claims the title"
            }
            label="Next Round"
            value={nextRound?.title ?? "Champion Crown"}
          />
          <WinnerPathStep
            champion
            detail={champion?.city || "Winner of Grand Final"}
            label="Champion"
            value={champion?.name ?? "Not Decided"}
          />
        </div>

        <div className="obs-path-ribbon mt-2 shrink-0 border border-finals/45 bg-background/62 p-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                Grand Final
              </div>
              <div className="mt-0.5 font-heading text-xl font-black uppercase italic leading-none text-finals">
                Finalist Slots
              </div>
            </div>
            <BroadcastChevron accent="finals" />
          </div>
          <div className="mt-2 grid gap-2">
            {(grandFinal?.entrants ?? []).map((entrant) => (
              <div
                key={`${grandFinal?.id}-${entrant.seed}`}
                className={cn(
                  "obs-match-card flex min-w-0 items-center justify-between gap-2 border px-2 py-1.5",
                  entrant.winner
                    ? "border-finals/60 bg-finals-soft/45"
                    : "border-border/55 bg-surface-0/60",
                )}
              >
                <span className="min-w-0">
                  <span
                    className={cn(
                      "obs-player-name block truncate font-heading text-xl font-black uppercase leading-none",
                      entrant.pending ? "text-foreground/70" : "text-white",
                    )}
                  >
                    {entrant.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
                    {entrant.winner ? "Champion locked" : `Finalist slot ${entrant.seed}`}
                  </span>
                </span>
                <span className="font-heading text-2xl font-black italic tabular-nums text-finals">
                  {entrant.score ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function WinnerPathStep({
  active,
  champion,
  detail,
  label,
  value,
}: {
  active?: boolean;
  champion?: boolean;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "obs-match-card relative border px-3 py-2",
        champion
          ? "border-finals/70 bg-finals-soft/45"
          : active
            ? "border-finals/50 bg-finals-soft/25"
            : "border-border/55 bg-background/55",
      )}
    >
      <div className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 truncate font-heading text-lg font-black uppercase italic leading-none tracking-tight",
          champion ? "text-finals" : "text-white",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
        {detail}
      </div>
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
      className={cn("obs-broadcast-panel relative min-h-0", featured && "p-5")}
      style={accentVarStyle(accent)}
    >
      <PanelCornerMarks accent={accent} />
      <header
        className={cn(
          "obs-panel-content flex items-center justify-between gap-3 border-b border-finals/20",
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

      <div
        className={cn(
          "obs-panel-content",
          featured ? "mt-5 grid gap-3" : "divide-y divide-border/45",
        )}
      >
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
        featured ? "obs-match-card border border-border/60 px-4 py-3" : "px-3 py-2",
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
              "obs-player-name truncate font-heading font-black uppercase leading-none tracking-tight",
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

function WildcardPoolCard({ index, lobby }: { index: number; lobby: WildcardLobby }) {
  const accent = "wildcard";
  const winner = lobby.players.find((player) => player.state === "finals");

  return (
    <article
      className="obs-broadcast-panel obs-wildcard-source min-h-0"
      style={accentVarStyle(accent)}
    >
      <PanelCornerMarks accent={accent} />
      <header className="obs-panel-content flex items-center justify-between gap-3 border-b border-finals/20 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BroadcastGlyph accent={accent} className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              Wildcard
            </div>
            <div
              className="font-heading text-3xl font-black uppercase italic tracking-tight text-wildcard"
              style={{ color: `var(--${accent})` }}
            >
              {lobby.label}
            </div>
          </div>
        </div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {winner ? "Winner Locked" : `Lobby ${index + 1}`}
        </div>
      </header>
      <div className="obs-panel-content divide-y divide-border/45">
        {lobby.players.map((player, playerIndex) => (
          <div
            key={`${lobby.id}-${player.seed}-${player.name}`}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              player.state === "finals" && "bg-finals-soft/35 shadow-[inset_3px_0_0_var(--finals)]",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center border font-mono text-xs font-black tabular-nums"
                style={{
                  borderColor: player.state === "finals" ? "var(--finals)" : `var(--${accent})`,
                  color: player.state === "finals" ? "var(--finals)" : `var(--${accent})`,
                }}
              >
                {player.rank ?? playerIndex + 1}
              </span>
              <div className="min-w-0">
                <div className="obs-player-name truncate font-heading text-2xl font-black uppercase leading-none tracking-tight text-white">
                  {player.name}
                </div>
                <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {player.city || "Awaiting city"}
                </div>
              </div>
            </div>
            <div className="font-mono text-[10px] font-black uppercase tracking-widest text-wildcard">
              {player.stateLabel}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function WildcardFinalSlotsPanel({ data }: { data: TournamentData["wildcardView"] }) {
  return (
    <aside
      className="obs-broadcast-panel obs-champion-glow relative min-h-0 p-4"
      style={accentVarStyle("wildcard")}
    >
      <PanelCornerMarks accent="wildcard" />
      <div className="relative flex h-full flex-col">
        <header className="border-b border-finals/30 pb-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Nationals Route
          </div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <h3 className="font-heading text-4xl font-black uppercase italic leading-none tracking-tight text-wildcard">
              Nationals Slots
            </h3>
            <div className="obs-medallion obs-medallion-active h-12 w-12">
              <Shield className="h-6 w-6 text-background" />
            </div>
          </div>
        </header>

        <div className="mt-4 grid min-h-0 flex-1 content-start gap-3">
          {Array.from({ length: data.finalSlots }, (_, index) => {
            const slot = data.finalSlotPlayers[index];
            const locked = slot?.pending === false;
            return (
              <div
                key={index}
                className={cn(
                  "obs-match-card grid grid-cols-[46px_minmax(0,1fr)] items-center gap-3 border px-3 py-3",
                  locked
                    ? "border-finals/55 bg-finals-soft/35"
                    : "border-border/55 bg-background/55",
                )}
              >
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center border font-heading text-2xl font-black italic tabular-nums",
                    locked ? "border-finals/60 text-finals" : "border-wildcard/50 text-wildcard",
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="obs-player-name block truncate font-heading text-2xl font-black uppercase leading-none tracking-tight text-white">
                    {locked ? slot.name : `Wildcard Slot ${index + 1}`}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {locked ? slot.city || "National Finals" : "Awaiting qualifier"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t border-border/70 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Wildcard winners complete the 16-player National Finals bracket
        </div>
      </div>
    </aside>
  );
}

function OverlayMatchCard({
  featured,
  match,
  trophy,
}: {
  featured?: boolean;
  match: Match;
  trophy?: boolean;
}) {
  const isFinal = match.status === "final";
  const winner = matchWinner(match);
  const railColor = isFinal
    ? "var(--finals)"
    : "color-mix(in oklab, var(--border-strong) 70%, transparent)";

  return (
    <article
      className={cn(
        "obs-match-card relative overflow-hidden border border-border/80",
        trophy && "obs-grand-final-match",
      )}
      style={accentValueStyle(railColor)}
    >
      <header
        className={cn(
          "relative flex items-center justify-between border-b border-border/60",
          featured ? "px-4 py-3" : "px-3 py-2",
        )}
      >
        <div className="truncate font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {match.label}
        </div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-finals">
          {winner ? "Winner locked" : isFinal ? "Final" : match.status}
        </div>
      </header>
      <div className="relative divide-y divide-border/45">
        {match.entrants.map((entrant) => (
          <div
            key={`${match.id}-${entrant.seed}`}
            className={cn(
              "flex items-center justify-between gap-3",
              featured ? "px-4 py-3" : "px-3 py-2",
              entrant.winner && "bg-finals-soft/55 shadow-[inset_3px_0_0_var(--finals)]",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "grid shrink-0 place-items-center border font-mono font-black",
                  featured ? "h-9 w-9 text-xs" : "h-7 w-7 text-[10px]",
                  entrant.winner
                    ? "border-finals/60 text-finals"
                    : "border-border/60 text-muted-foreground",
                )}
              >
                {entrant.seed}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "obs-player-name truncate font-heading font-black uppercase leading-none tracking-tight",
                    featured ? "text-3xl" : "text-xl",
                    entrant.pending ? "text-foreground/75" : "text-white",
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
                featured ? "text-5xl" : "text-3xl",
                entrant.winner ? "text-finals" : "text-foreground/80",
              )}
            >
              {entrant.score ?? "-"}
            </div>
          </div>
        ))}
      </div>
      {trophy && (
        <div className="relative border-t border-finals/40 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          {winner ? `${winner.name} is the National Champion` : "Champion will be decided here"}
        </div>
      )}
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
        className="mt-1 truncate font-heading text-[1.35rem] font-black uppercase italic leading-none tracking-tight"
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
      className="obs-match-card relative flex items-center gap-5 overflow-hidden border border-border/80 p-5 slab-shadow"
      style={accentVarStyle(accent)}
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

function matchWinner(match: Match) {
  return match.entrants.find((entrant) => entrant.winner && !entrant.pending);
}

function matchCountLabel(count: number) {
  return count === 1 ? "match" : "matches";
}

function winnerCountLabel(count: number) {
  return count === 1 ? "winner" : "winners";
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
    if (source === "bracket") return "Stage Board";
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
