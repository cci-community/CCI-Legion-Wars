import { useCallback, useEffect, useRef, useState } from "react";
import { sheetConfig } from "@/data/sheet-config.js";
import { loadTournamentFeeds } from "@/data/sheet-data.js";
import {
  defaultTournamentData,
  type FinalsView,
  type GroupView,
  type Lobby,
  type LobbyStatus,
  type Match,
  type MatchEntrant,
  type MatchStatus,
  type Player,
  type PlayerState,
  type Round,
  type SyncMeta,
  type TournamentData,
  type WildcardFinalSlot,
  type WildcardPlayer,
  type WildcardViewData,
} from "./tournament-data";

// The preserved sheet parser is JavaScript; the adapter narrows its public fields below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SheetFeed = Record<string, any>;

type GroupDescriptor = {
  feedId: string;
  key: "groupTitan" | "groupNexus" | "groupDominion";
  label: string;
  short: "Titan" | "Nexus" | "Dominion";
  accent: GroupView["accent"];
};

const GROUPS: GroupDescriptor[] = [
  {
    feedId: "group-titan",
    key: "groupTitan",
    label: "Group Titan",
    short: "Titan",
    accent: "titan",
  },
  {
    feedId: "group-nexus",
    key: "groupNexus",
    label: "Group Nexus",
    short: "Nexus",
    accent: "nexus",
  },
  {
    feedId: "group-dominion",
    key: "groupDominion",
    label: "Group Dominion",
    short: "Dominion",
    accent: "dominion",
  },
];

const parserFallbackTournament = {
  id: "fallback-national-finals",
  label: "National Finals",
  type: "finals",
  status: [],
  bracket: defaultTournamentData.finalsView.bracket,
  lobbies: [],
  rules: [],
};

export interface LiveTournamentState {
  data: TournamentData;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useLiveTournamentData(): LiveTournamentState {
  const [data, setData] = useState<TournamentData>(defaultTournamentData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const syncInFlight = useRef(false);

  const sync = useCallback(async (force = false) => {
    if (!sheetConfig.enabled || syncInFlight.current) return;
    syncInFlight.current = true;
    if (force) setIsRefreshing(true);

    try {
      const result = await loadTournamentFeeds({
        config: sheetConfig,
        fallbackTournament: parserFallbackTournament,
        force,
        stageSelections: {},
      });
      setData(adaptWorkbookFeeds(result.feeds ?? [], result.meta));
      setError(null);
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error(String(caught));
      setError(nextError);
      setData({
        ...defaultTournamentData,
        meta: {
          mode: "fallback",
          message: "Showing fallback bracket. Refresh failed.",
          fetchedAt: null,
        },
      });
    } finally {
      syncInFlight.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void sync(false);

    if (
      !Number.isFinite(sheetConfig.autoRefreshIntervalMs) ||
      sheetConfig.autoRefreshIntervalMs <= 0
    ) {
      return undefined;
    }

    const intervalMs = Math.max(sheetConfig.autoRefreshIntervalMs, sheetConfig.minFetchIntervalMs);
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (navigator.onLine === false) return;
      void sync(false);
    }, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void sync(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [sync]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh: () => sync(true),
  };
}

export function adaptWorkbookFeeds(feeds: SheetFeed[], meta: SheetFeed = {}): TournamentData {
  const feedById = new Map(feeds.map((feed) => [feed.id, feed]));
  const groupTitan = adaptGroupFeed(
    feedById.get("group-titan"),
    GROUPS[0],
    defaultTournamentData.groupTitan,
  );
  const groupNexus = adaptGroupFeed(
    feedById.get("group-nexus"),
    GROUPS[1],
    defaultTournamentData.groupNexus,
  );
  const groupDominion = adaptGroupFeed(
    feedById.get("group-dominion"),
    GROUPS[2],
    defaultTournamentData.groupDominion,
  );
  const groups = [groupTitan, groupNexus, groupDominion];
  const finalsView = adaptFinalsFeed(
    feedById.get("national-finals"),
    defaultTournamentData.finalsView,
  );
  const wildcardView = adaptWildcardFeed(
    feedById.get("wildcard"),
    feeds,
    defaultTournamentData.wildcardView,
  );

  return {
    groups,
    groupTitan,
    groupNexus,
    groupDominion,
    finalsView,
    wildcardView,
    meta: {
      mode: normalizeSyncMode(meta.mode),
      message: cleanText(meta.message) || "Showing fallback bracket.",
      fetchedAt: cleanText(meta.fetchedAt) || null,
    },
  };
}

function adaptGroupFeed(
  feed: SheetFeed | undefined,
  descriptor: GroupDescriptor,
  fallback: GroupView,
): GroupView {
  if (!feed?.progression?.rounds) return fallback;

  const rounds = fallback.progression.rounds.map((fallbackRound) => {
    const sourceRound = (feed.progression?.rounds ?? []).find(
      (round: SheetFeed) => round.title === fallbackRound.title,
    );
    return adaptRound(sourceRound, fallbackRound);
  });

  return {
    id: descriptor.feedId,
    label: descriptor.label,
    short: descriptor.short,
    accent: descriptor.accent,
    status: normalizeStatus(feed.status, fallback.status),
    progression: {
      phase: descriptor.label,
      mode: feed.progression?.mode ?? "Lobby Progression",
      rounds,
    },
  };
}

function adaptRound(sourceRound: SheetFeed | undefined, fallbackRound: Round): Round {
  if (!sourceRound) return fallbackRound;
  const roundNumber = roundNumberFromTitle(sourceRound.title ?? fallbackRound.title);
  const sourceLobbies = Array.isArray(sourceRound.lobbies) ? sourceRound.lobbies : [];
  const hasGlobalRanks = roundNumber === 4 && hasRankRange(sourceLobbies, 5, 8);
  const lobbies = Array.isArray(sourceRound.lobbies)
    ? sourceRound.lobbies.map((lobby: SheetFeed) => adaptLobby(lobby, roundNumber, hasGlobalRanks))
    : fallbackRound.lobbies;

  return {
    title: sourceRound.title ?? fallbackRound.title,
    players: Number(sourceRound.players) || fallbackRound.players,
    expectedLobbies: Number(sourceRound.expectedLobbies) || fallbackRound.expectedLobbies,
    advance: sourceRound.advance ?? fallbackRound.advance,
    lobbies,
  };
}

function adaptLobby(lobby: SheetFeed, roundNumber: number, hasGlobalRanks = false): Lobby {
  const players = Array.isArray(lobby.players)
    ? lobby.players.map((player: SheetFeed, index: number) =>
        adaptPlayer(player, roundNumber, index, hasGlobalRanks),
      )
    : [];

  return {
    id: String(lobby.id ?? lobby.name ?? "Lobby"),
    status: normalizeLobbyStatus(lobby.status, players, roundNumber),
    players,
  };
}

function adaptPlayer(
  player: SheetFeed,
  roundNumber: number,
  index: number,
  hasGlobalRanks = false,
): Player {
  const rank = toNumberOrNull(player.rank);
  const state = normalizePlayerState(player.state, roundNumber, rank, hasGlobalRanks);
  return {
    seed: String(player.seed ?? player.slot ?? index + 1),
    name: publicName(player.name, "Awaiting player"),
    city: cleanText(player.city),
    region: cleanText(player.region) || undefined,
    rank,
    score: toNumberOrNull(player.score),
    state,
    stateLabel: playerStateLabel(state),
  };
}

function adaptFinalsFeed(feed: SheetFeed | undefined, fallback: FinalsView): FinalsView {
  if (!feed?.bracket?.rounds) return fallback;

  const rounds = fallback.bracket.rounds.map((fallbackRound) => {
    const sourceRound = (feed.bracket?.rounds ?? []).find(
      (round: SheetFeed) => round.title === fallbackRound.title,
    );
    if (!sourceRound) return fallbackRound;
    return {
      title: sourceRound.title,
      matches: Array.isArray(sourceRound.matches)
        ? sourceRound.matches.map((match: SheetFeed, index: number) => adaptMatch(match, index))
        : fallbackRound.matches,
    };
  });

  return {
    id: "national-finals",
    label: "National Finals",
    bracket: {
      phase: feed.bracket.phase ?? "National Finals",
      mode: feed.bracket.mode ?? "16-Player Single Elimination · Best of 3",
      rounds,
    },
  };
}

function adaptMatch(match: SheetFeed, index: number): Match {
  const entrants = Array.isArray(match.entrants) ? match.entrants : [];
  return {
    id: String(match.id ?? `Finals_M${index + 1}`),
    label: String(match.label ?? `Match ${index + 1}`),
    status: normalizeMatchStatus(match.status),
    bestOf: Number(match.bestOf) || 3,
    entrants: [adaptEntrant(entrants[0], "A"), adaptEntrant(entrants[1], "B")],
  };
}

function adaptEntrant(entrant: SheetFeed | undefined, seed: string): MatchEntrant {
  const name = publicName(entrant?.name, "Awaiting qualifier");
  return {
    seed: String(entrant?.seed ?? seed),
    name,
    city: cleanText(entrant?.city) || undefined,
    score: toNumberOrNull(entrant?.score),
    pending: Boolean(entrant?.pending) || /^awaiting|^winner/i.test(name),
    winner: Boolean(entrant?.winner),
  };
}

function adaptWildcardFeed(
  wildcardFeed: SheetFeed | undefined,
  feeds: SheetFeed[],
  fallback: WildcardViewData,
): WildcardViewData {
  const candidatePlayers = wildcardCandidatesFromGroups(feeds);
  const feedPlayers = wildcardPlayersFromFeed(wildcardFeed);
  const players = completeWildcardPlayers(candidatePlayers.length ? candidatePlayers : feedPlayers);
  const finalSlotPlayers = wildcardFinalSlots(wildcardFeed, fallback.finalSlotPlayers);

  return {
    id: "wildcard",
    label: "Wildcard",
    poolCount: candidatePlayers.length || feedPlayers.length || fallback.poolCount,
    finalSlots: 4,
    players,
    finalSlotPlayers,
  };
}

function wildcardCandidatesFromGroups(feeds: SheetFeed[]): WildcardPlayer[] {
  return GROUPS.flatMap((descriptor) => {
    const feed = feeds.find((candidate) => candidate.id === descriptor.feedId);
    const candidates = feed?.meta?.wildcardCandidates;
    if (!Array.isArray(candidates)) return [];
    return candidates.slice(0, 4).map((candidate: SheetFeed, index: number) => ({
      seed: String(candidate.seed ?? `${descriptor.short}-W${index + 1}`),
      name: publicName(candidate.name, "Awaiting qualifier"),
      city: cleanText(candidate.city),
      sourceGroup: descriptor.short,
      sourceRank: Number(candidate.placement ?? candidate.rank ?? index + 5),
      status: "wildcard",
      statusLabel: "Pool",
    }));
  });
}

function wildcardPlayersFromFeed(wildcardFeed: SheetFeed | undefined): WildcardPlayer[] {
  const lobbies = wildcardFeed?.progression?.rounds?.[0]?.lobbies;
  if (!Array.isArray(lobbies)) return [];
  return lobbies.flatMap((lobby: SheetFeed, lobbyIndex: number) => {
    const sourceGroup = GROUPS[lobbyIndex]?.short ?? "Titan";
    return (lobby.players ?? []).map((player: SheetFeed, index: number) => ({
      seed: String(player.seed ?? `W${lobbyIndex * 4 + index + 1}`),
      name: publicName(player.name, "Awaiting qualifier"),
      city: cleanText(player.city),
      sourceGroup,
      sourceRank: Number(player.rank ?? index + 5),
      status:
        normalizePlayerState(player.state, 4, toNumberOrNull(player.rank)) === "finals"
          ? "finals"
          : "wildcard",
      statusLabel:
        normalizePlayerState(player.state, 4, toNumberOrNull(player.rank)) === "finals"
          ? "Finals"
          : "Pool",
    }));
  });
}

function completeWildcardPlayers(players: WildcardPlayer[]): WildcardPlayer[] {
  const completed = [...players];
  for (const descriptor of GROUPS) {
    const existing = completed.filter((player) => player.sourceGroup === descriptor.short).length;
    for (let index = existing; index < 4; index += 1) {
      completed.push({
        seed: `${descriptor.short}-W${index + 1}`,
        name: "Awaiting qualifier",
        city: "",
        sourceGroup: descriptor.short,
        sourceRank: index + 5,
        status: "pending",
        statusLabel: "Pending",
      });
    }
  }
  return completed.sort((left, right) => {
    const groupDelta =
      GROUPS.findIndex((group) => group.short === left.sourceGroup) -
      GROUPS.findIndex((group) => group.short === right.sourceGroup);
    return groupDelta || left.sourceRank - right.sourceRank;
  });
}

function wildcardFinalSlots(
  wildcardFeed: SheetFeed | undefined,
  fallback: WildcardFinalSlot[],
): WildcardFinalSlot[] {
  const slots = wildcardFeed?.progression?.finalSlots;
  if (!Array.isArray(slots)) return fallback;
  return Array.from({ length: 4 }, (_, index) => {
    const slot = slots[index];
    return {
      seed: String(slot?.seed ?? `WQ${index + 1}`),
      name: publicName(slot?.name, "Awaiting qualifier"),
      city: cleanText(slot?.city),
      pending: Boolean(slot?.pending) || !slot?.name || /^awaiting/i.test(String(slot?.name)),
    };
  });
}

function normalizeStatus(status: unknown, fallback: { label: string; value: string }[]) {
  return Array.isArray(status) && status.length
    ? status.map((item) => ({ label: cleanText(item.label), value: cleanText(item.value) }))
    : fallback;
}

function normalizeLobbyStatus(
  status: unknown,
  players: Player[],
  roundNumber: number,
): LobbyStatus {
  const normalized = cleanText(status).toLowerCase();
  if (normalized === "live") return "Live";
  if (normalized === "ready") return "Ready";
  if (normalized === "final") return "Final";
  if (normalized === "qualified" || normalized === "pool ready") return "Qualified";
  if (normalized === "pending") return "Pending";
  if (!players.length || players.every((player) => player.state === "pending")) return "Pending";
  if (players.every((player) => player.state !== "pending"))
    return roundNumber === 4 ? "Qualified" : "Final";
  return "Ready";
}

function normalizeMatchStatus(status: unknown): MatchStatus {
  const normalized = cleanText(status).toLowerCase();
  if (normalized === "final") return "final";
  if (normalized === "live") return "live";
  if (normalized === "ready") return "ready";
  return "pending";
}

function normalizeSyncMode(mode: unknown): SyncMeta["mode"] {
  const normalized = cleanText(mode).toLowerCase();
  if (
    normalized === "loading" ||
    normalized === "live" ||
    normalized === "cached" ||
    normalized === "stale" ||
    normalized === "fallback"
  ) {
    return normalized;
  }
  return "fallback";
}

function normalizePlayerState(
  state: unknown,
  roundNumber: number,
  rank: number | null,
  hasGlobalRanks = false,
): PlayerState {
  const normalized = cleanText(state).toLowerCase();
  if (normalized === "advance") return "advance";
  if (normalized === "finals") return "finals";
  if (normalized === "wildcard") return "wildcard";
  if (normalized === "eliminated") return "eliminated";
  if (normalized === "live") return "live";
  if (normalized === "qualified") return roundNumber === 4 ? "finals" : "advance";

  if (rank == null) return "pending";
  if (roundNumber === 4) {
    if (hasGlobalRanks) {
      if (rank >= 1 && rank <= 4) return "finals";
      if (rank >= 5 && rank <= 8) return "wildcard";
      return "eliminated";
    }
    if (rank >= 1 && rank <= 2) return "finals";
    if (rank >= 3 && rank <= 4) return "wildcard";
    return "eliminated";
  }
  return rank >= 1 && rank <= 2 ? "advance" : "eliminated";
}

function playerStateLabel(state: PlayerState): string {
  if (state === "advance") return "Advance";
  if (state === "finals") return "Finals";
  if (state === "wildcard") return "Wildcard";
  if (state === "eliminated") return "Out";
  if (state === "live") return "Live";
  return "Pending";
}

function roundNumberFromTitle(title: string): number {
  const match = cleanText(title).match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function publicName(value: unknown, fallback: string): string {
  const text = cleanText(value);
  if (!text || text.startsWith("#")) return fallback;
  return text;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasRankRange(lobbies: SheetFeed[], minRank: number, maxRank: number): boolean {
  return lobbies.some((lobby) => {
    return (lobby.players ?? []).some((player: SheetFeed) => {
      const rank = toNumberOrNull(player.rank);
      return rank != null && rank >= minRank && rank <= maxRank;
    });
  });
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}
