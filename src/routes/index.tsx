import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Radio, Command as CmdIcon, RefreshCw, Search, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TournamentData } from "@/lib/tournament-data";
import { useLiveTournamentData } from "@/lib/live-tournament-data";
import type { ViewKey } from "@/lib/tournament-helpers";
import { OverviewMap } from "@/components/tournament/OverviewMap";
import { GroupProgressionView } from "@/components/tournament/GroupProgressionView";
import { FinalsBracketView } from "@/components/tournament/FinalsBracketView";
import { WildcardView } from "@/components/tournament/WildcardView";
import { CommandPalette } from "@/components/tournament/CommandPalette";
import { LobbyDrawer } from "@/components/tournament/LobbyDrawer";
import { MatchDrawer } from "@/components/tournament/MatchDrawer";
import { MobileTabBar } from "@/components/tournament/MobileTabBar";
import { ObsOverlayView } from "@/components/tournament/ObsOverlayView";
import { toast } from "sonner";

type TabKey = ViewKey | "overview";
const VALID_VIEWS: TabKey[] = ["overview", "finals", "titan", "nexus", "dominion", "wildcard"];

interface Search {
  mode?: "obs";
  view?: TabKey;
  lobby?: string;
  match?: string;
  round?: number;
  transparent?: 1;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const view =
      typeof search.view === "string" && VALID_VIEWS.includes(search.view as TabKey)
        ? (search.view as TabKey)
        : undefined;
    const mode = search.mode === "obs" ? "obs" : undefined;
    const lobby = typeof search.lobby === "string" ? search.lobby : undefined;
    const match = typeof search.match === "string" ? search.match : undefined;
    const round =
      typeof search.round === "number"
        ? search.round
        : typeof search.round === "string" && Number.isFinite(Number(search.round))
          ? Number(search.round)
          : undefined;
    const transparent = search.transparent === "1" || search.transparent === 1 ? 1 : undefined;
    return { mode, view, lobby, match, round, transparent };
  },
  head: () => ({
    meta: [
      { title: "Legion Wars — Live Tournament Bracket" },
      {
        name: "description",
        content:
          "Follow Legion Wars: Group Titan, Nexus, and Dominion lobby progression, Wildcard last-chance stage, and the 16-player National Finals bracket.",
      },
      { property: "og:title", content: "Legion Wars — Live Tournament Bracket" },
      {
        property: "og:description",
        content: "Esports bracket viewer: groups, wildcard, and National Finals.",
      },
    ],
  }),
  component: Index,
});

const TABS: {
  key: TabKey;
  label: string;
  accent: string;
}[] = [
  { key: "overview", label: "Overview", accent: "finals" },
  { key: "titan", label: "Group A", accent: "titan" },
  { key: "nexus", label: "Group B", accent: "nexus" },
  { key: "dominion", label: "Group C", accent: "dominion" },
  { key: "wildcard", label: "Wildcard", accent: "wildcard" },
  { key: "finals", label: "Finals", accent: "finals" },
];

const AUTO_SYNC_SECONDS = 120;

function useAggStats(data: TournamentData) {
  return useMemo(() => {
    let advancing = 0;
    let eliminated = 0;
    let decidedMatches = 0;
    let totalMatches = 0;
    data.groups.forEach((g) =>
      g.progression.rounds.forEach((r) =>
        r.lobbies.forEach((l) => {
          l.players.forEach((p) => {
            if (p.state === "advance" || p.state === "finals") advancing += 1;
            if (p.state === "eliminated") eliminated += 1;
          });
        }),
      ),
    );
    data.finalsView.bracket.rounds.forEach((r) =>
      r.matches.forEach((m) => {
        totalMatches += 1;
        if (m.status === "final") decidedMatches += 1;
      }),
    );
    return {
      totalPlayers: 192,
      advancing,
      eliminated,
      decidedMatches,
      totalMatches,
    };
  }, [data]);
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function Index() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const tab: TabKey = search.view ?? "overview";
  const obsMode = search.mode === "obs";
  const { data, isLoading, isRefreshing, error, refresh } = useLiveTournamentData();
  const stats = useAggStats(data);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [clockTick, setClockTick] = useState(0);

  const setTab = (v: TabKey) => {
    navigate({ search: { view: v }, replace: false });
  };

  const openLobby = (id: string) => {
    navigate({ search: (prev: Search) => ({ ...prev, lobby: id, match: undefined }) });
  };
  const openMatch = (id: string) => {
    navigate({
      search: (prev: Search) => ({ ...prev, match: id, lobby: undefined, view: "finals" }),
    });
  };
  const closeDrawers = () =>
    navigate({
      search: (prev: Search) => ({ ...prev, lobby: undefined, match: undefined }),
    });

  const handlePaletteNavigate = (opts: { view?: ViewKey; lobby?: string; match?: string }) => {
    navigate({
      search: {
        view: (opts.view ?? tab) as TabKey,
        lobby: opts.lobby,
        match: opts.match,
      },
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inTyping =
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (inTyping) return;
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      const idx = Number(e.key);
      if (idx >= 1 && idx <= TABS.length) {
        e.preventDefault();
        setTab(TABS[idx - 1].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const activeAccent = TABS.find((t) => t.key === tab)?.accent ?? "finals";

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--tab-accent", `var(--${activeAccent})`);
    root.style.setProperty("--tab-accent-soft", `var(--${activeAccent}-soft)`);
  }, [activeAccent]);

  useEffect(() => {
    document.body.classList.toggle("obs-mode", obsMode);
    document.body.classList.toggle("obs-transparent-mode", obsMode && search.transparent === 1);
    return () => {
      document.body.classList.remove("obs-mode", "obs-transparent-mode");
    };
  }, [obsMode, search.transparent]);

  const updatedSeconds = data.meta.fetchedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(data.meta.fetchedAt).getTime()) / 1000))
    : 0;
  void clockTick;

  const syncInSeconds = data.meta.fetchedAt
    ? Math.max(0, AUTO_SYNC_SECONDS - updatedSeconds)
    : AUTO_SYNC_SECONDS;
  const syncStatus = error
    ? "Sync issue"
    : isLoading
      ? "Loading brackets"
      : isRefreshing
        ? "Refreshing"
        : data.meta.mode === "live"
          ? "Live data"
          : data.meta.mode === "cached"
            ? "Cached data"
            : data.meta.mode === "stale"
              ? "Stale data"
              : data.meta.mode === "fallback"
                ? "Fallback view"
                : data.meta.message;
  const syncSummary = data.meta.fetchedAt
    ? `Updated ${formatDuration(updatedSeconds)} ago`
    : "Waiting for public feeds";
  const nextSyncLabel = `Next refresh ${formatDuration(syncInSeconds)}`;
  const syncTone = error
    ? "border-live/50 bg-live/10 text-live"
    : data.meta.mode === "live"
      ? "border-advance/45 bg-advance/10 text-advance"
      : "border-border bg-surface-1/85 text-muted-foreground";

  const doRefresh = async () => {
    await refresh();
    toast("Refreshed", { description: "Bracket data reloaded" });
  };

  if (obsMode) {
    return (
      <ObsOverlayView
        data={data}
        error={error}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        lobbyId={search.lobby}
        round={search.round}
        syncStatus={syncStatus}
        syncSummary={syncSummary}
        transparent={search.transparent === 1}
        view={tab}
      />
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      {/* Ambient light — radial gradient tinted by active tab accent */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-700"
        style={{
          background: `radial-gradient(1100px 700px at 18% -5%, color-mix(in oklab, var(--${activeAccent}) 14%, transparent), transparent 65%), radial-gradient(900px 600px at 100% 100%, color-mix(in oklab, var(--${activeAccent}) 8%, transparent), transparent 60%)`,
        }}
      />
      <div className="grid-lines pointer-events-none fixed inset-0" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-4 pb-20 sm:px-6 sm:pb-8 lg:px-8">
        {/* Header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden border border-border-strong bg-surface-2/85 clip-chamfer-sm shadow-[0_0_24px_-10px_var(--finals)]">
              <img
                src="/legion-wars-logo-mark.png"
                alt=""
                className="h-10 w-10 object-contain brightness-110 contrast-125 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
                loading="eager"
              />
              <span className="pointer-events-none absolute inset-x-1 top-0 h-px bg-finals/70" />
              <span className="pointer-events-none absolute inset-y-1 right-0 w-px bg-finals/50" />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-display text-[18px] uppercase tracking-tight text-white">
                Legion Wars <span className="text-finals">2026</span>
              </h1>
              <div className="flex min-w-0 items-center gap-1.5 text-tactical text-[9px] text-muted-foreground">
                <span className="truncate">Official public bracket viewer</span>
                <span className="hidden opacity-40 sm:inline">//</span>
                <span className="hidden sm:inline">CCI Volunteer Legion</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div
              className={cn(
                "hidden min-w-0 items-center gap-2 px-3 py-1.5 md:flex clip-chamfer-sm",
                syncTone,
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0",
                  error ? "bg-live" : data.meta.mode === "live" ? "bg-advance" : "bg-finals",
                )}
              />
              <span className="text-tactical text-[9px] text-foreground">{syncStatus}</span>
              <span className="hidden font-mono text-[10px] text-muted-foreground/75 lg:inline">
                {syncSummary}
              </span>
            </div>
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 border border-border bg-surface-1 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-foreground sm:flex clip-chamfer-sm"
            >
              <Search className="h-3 w-3" />
              <span className="text-tactical text-[10px]">Search players</span>
              <kbd className="ml-6">⌘K</kbd>
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="grid h-8 w-8 place-items-center border border-border bg-surface-1 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:hidden clip-chamfer-sm"
              aria-label="Open command palette"
            >
              <CmdIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={doRefresh}
              disabled={isRefreshing}
              className="grid h-8 w-8 place-items-center border border-border bg-surface-1 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground clip-chamfer-sm"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Stats bar — slab rail */}
        <div className="relative mt-4 grid grid-cols-2 gap-0 overflow-hidden border border-border bg-surface-1 clip-chamfer-sm sm:grid-cols-4">
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full w-[3px] bg-[color:var(--tab-accent)]/70"
          />
          <StatCell
            label="Players Listed"
            value={stats.totalPlayers}
            accentBar="var(--muted-foreground)"
            border
          />
          <StatCell
            label="Advancing"
            value={stats.advancing}
            accent="text-advance"
            accentBar="var(--advance)"
            border
          />
          <StatCell
            label="Eliminated"
            value={stats.eliminated}
            accentBar="var(--eliminated, var(--muted-foreground))"
            border
          />
          <StatCell
            label="Finals Matches"
            value={`${stats.decidedMatches}/${stats.totalMatches}`}
            accentBar="var(--finals)"
          />
        </div>

        {/* Tabs — tactical rail */}
        <nav
          className="sticky top-0 z-20 -mx-4 mt-4 border-y border-border bg-background/85 px-4 backdrop-blur-md sm:mx-0 sm:border sm:clip-chamfer-sm"
          role="tablist"
        >
          <div className="flex snap-x snap-mandatory items-center gap-0 overflow-x-auto scrollbar-hide">
            <span className="hidden shrink-0 items-center gap-1.5 border-r border-border pr-3 pl-1 text-tactical text-[9px] text-muted-foreground sm:flex">
              <span className="h-1 w-1 bg-[color:var(--tab-accent)]" />
              VIEW
            </span>
            {TABS.map((t, i) => {
              const active = tab === t.key;
              const isOverview = t.key === "overview";
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "group relative shrink-0 snap-start px-3 py-2.5 text-[12px] font-medium tracking-tight transition-colors uppercase text-tactical min-h-[44px]",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {isOverview ? (
                      <Map className="h-3 w-3 opacity-80" />
                    ) : (
                      <span
                        className="h-1.5 w-1.5 transition-opacity"
                        style={{
                          background: `var(--${t.accent})`,
                          opacity: active ? 1 : 0.4,
                        }}
                      />
                    )}
                    {t.label}
                    <kbd className="ml-1 hidden lg:inline">{i + 1}</kbd>
                  </span>
                  {active && (
                    <span
                      className="absolute inset-x-2 -bottom-px h-[2px]"
                      style={{ background: `var(--${t.accent})` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active view */}
        <main className="mt-4 pb-8">
          {tab === "overview" && <OverviewMap data={data} onNavigate={(v) => setTab(v)} />}
          {tab === "finals" && (
            <FinalsBracketView finals={data.finalsView} onSelectMatch={openMatch} />
          )}
          {tab === "titan" && (
            <GroupProgressionView group={data.groupTitan} onSelectLobby={openLobby} />
          )}
          {tab === "nexus" && (
            <GroupProgressionView group={data.groupNexus} onSelectLobby={openLobby} />
          )}
          {tab === "dominion" && (
            <GroupProgressionView group={data.groupDominion} onSelectLobby={openLobby} />
          )}
          {tab === "wildcard" && (
            <WildcardView
              players={data.wildcardView.players}
              finalSlots={data.wildcardView.finalSlots}
              poolCount={data.wildcardView.poolCount}
              finalSlotPlayers={data.wildcardView.finalSlotPlayers}
            />
          )}
        </main>

        <footer className="mt-7 grid gap-3 border-t border-border/80 py-4 text-[10px] text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-tactical">
            <span className="h-1.5 w-1.5 bg-[color:var(--tab-accent)]" />
            <span>CCI VOLUNTEER LEGION</span>
            <span className="opacity-40">//</span>
            <span>LEGION WARS 2026</span>
            <span className="opacity-40">//</span>
            <span>PUBLIC BRACKET VIEWER</span>
            <span className="opacity-40">//</span>
            <span>PUBLIC FEEDS ONLY</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-tactical sm:justify-end">
            <Radio className="h-3 w-3" />
            <span>{syncStatus}</span>
            <span className="opacity-40">//</span>
            <span>{syncSummary}</span>
            <span className="opacity-40">//</span>
            <span>{nextSyncLabel}</span>
          </div>
        </footer>
      </div>

      <MobileTabBar value={tab} onChange={(v) => setTab(v as TabKey)} />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={handlePaletteNavigate}
        data={data}
      />
      <LobbyDrawer
        lobbyId={search.lobby}
        open={!!search.lobby}
        onOpenChange={(o) => !o && closeDrawers()}
        data={data}
      />
      <MatchDrawer
        matchId={search.match}
        open={!!search.match}
        onOpenChange={(o) => !o && closeDrawers()}
        data={data}
      />
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
  accentBar,
  border,
}: {
  label: string;
  value: number | string;
  accent?: string;
  accentBar?: string;
  border?: boolean;
}) {
  return (
    <div className={cn("relative px-3 py-2.5", border && "sm:border-r sm:border-border")}>
      <div className="flex items-center gap-1.5 text-tactical text-[10px] text-muted-foreground">
        {accentBar && (
          <span
            aria-hidden
            className="h-2 w-[3px]"
            style={{ background: accentBar, opacity: 0.7 }}
          />
        )}
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-display text-2xl tabular-nums tracking-tight",
          accent ?? "text-white",
        )}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}
