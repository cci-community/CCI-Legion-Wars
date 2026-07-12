export type PlayerState = "pending" | "advance" | "finals" | "wildcard" | "eliminated" | "live";
export type LobbyStatus = "Pending" | "Ready" | "Live" | "Qualified" | "Final";
export type MatchStatus = "pending" | "ready" | "live" | "final";

export interface Player {
  seed: string;
  name: string;
  city: string;
  region?: string;
  rank?: number | null;
  score?: number | null;
  state: PlayerState;
  stateLabel: string;
}

export interface Lobby {
  id: string;
  status: LobbyStatus;
  players: Player[];
}

export interface Round {
  title: string;
  players: number;
  expectedLobbies: number;
  advance: string;
  lobbies: Lobby[];
}

export interface GroupView {
  id: string;
  label: string;
  short: string;
  accent: "titan" | "nexus" | "dominion";
  status: { label: string; value: string }[];
  progression: {
    phase: string;
    mode: string;
    rounds: Round[];
  };
}

export interface MatchEntrant {
  seed: string;
  name: string;
  city?: string;
  score: number | null;
  pending?: boolean;
  winner?: boolean;
}

export interface Match {
  id: string;
  label: string;
  status: MatchStatus;
  bestOf: number;
  entrants: [MatchEntrant, MatchEntrant];
}

export interface FinalsView {
  id: string;
  label: string;
  bracket: {
    phase: string;
    mode: string;
    rounds: { title: string; matches: Match[] }[];
  };
}

export interface WildcardPlayer {
  seed: string;
  name: string;
  city: string;
  sourceGroup: "Titan" | "Nexus" | "Dominion" | "Wildcard";
  sourceLobby?: string;
  sourceRank: number;
  status: PlayerState;
  statusLabel: string;
}

export interface WildcardFinalSlot {
  seed: string;
  name: string;
  city: string;
  pending: boolean;
}

export interface WildcardLobby {
  id: string;
  label: string;
  status: LobbyStatus;
  players: Player[];
  winner?: WildcardFinalSlot;
}

export interface WildcardViewData {
  id: string;
  label: string;
  poolCount: number;
  finalSlots: number;
  players: WildcardPlayer[];
  lobbies: WildcardLobby[];
  finalSlotPlayers: WildcardFinalSlot[];
}

export interface SyncMeta {
  mode: "loading" | "live" | "cached" | "stale" | "fallback";
  message: string;
  fetchedAt: string | null;
}

export interface TournamentData {
  groups: GroupView[];
  groupTitan: GroupView;
  groupNexus: GroupView;
  groupDominion: GroupView;
  finalsView: FinalsView;
  wildcardView: WildcardViewData;
  meta: SyncMeta;
}

const GROUP_ROUND_SPECS = [
  { title: "Round 1", players: 64, expectedLobbies: 16, advance: "Top 2 advance" },
  { title: "Round 2", players: 32, expectedLobbies: 8, advance: "Top 2 advance" },
  { title: "Round 3", players: 16, expectedLobbies: 4, advance: "Top 2 advance" },
  {
    title: "Round 4",
    players: 8,
    expectedLobbies: 2,
    advance: "Top 4 Finals / 5th-8th Wildcard",
  },
] as const;

function placeholderPlayer(seed: string): Player {
  return {
    seed,
    name: "Awaiting player",
    city: "",
    rank: null,
    score: null,
    state: "pending",
    stateLabel: "Pending",
  };
}

function emptyGroup(
  id: string,
  label: string,
  short: GroupView["short"],
  accent: GroupView["accent"],
): GroupView {
  const rounds = GROUP_ROUND_SPECS.map((spec, roundIndex) => ({
    ...spec,
    lobbies: Array.from({ length: spec.expectedLobbies }, (_, lobbyIndex) => ({
      id: `${short}_R${roundIndex + 1}_L${lobbyIndex + 1}`,
      status: "Pending" as LobbyStatus,
      players: Array.from({ length: 4 }, (_, playerIndex) =>
        placeholderPlayer(`${lobbyIndex * 4 + playerIndex + 1}`),
      ),
    })),
  }));

  return {
    id,
    label,
    short,
    accent,
    status: [
      { label: "Stage", value: "Pending" },
      { label: "Advancing", value: "0/64" },
      { label: "Route", value: "R4 · Top 4 Finals / 5-8 Wildcard" },
    ],
    progression: {
      phase: label,
      mode: "Lobby Progression",
      rounds,
    },
  };
}

function pendingEntrant(seed: string, name: string): MatchEntrant {
  return { seed, name, score: null, pending: true };
}

function emptyFinals(): FinalsView {
  return {
    id: "national-finals",
    label: "National Finals",
    bracket: {
      phase: "National Finals",
      mode: "16-Player Single Elimination · Best of 3",
      rounds: [
        {
          title: "Round of 16",
          matches: Array.from({ length: 8 }, (_, index) => ({
            id: `Finals_R16_M${index + 1}`,
            label: `Match ${index + 1}`,
            status: "pending" as MatchStatus,
            bestOf: 3,
            entrants: [
              pendingEntrant(`F${index * 2 + 1}`, "Awaiting qualifier"),
              pendingEntrant(`F${index * 2 + 2}`, "Awaiting qualifier"),
            ],
          })),
        },
        {
          title: "Quarterfinals",
          matches: Array.from({ length: 4 }, (_, index) => ({
            id: `Finals_QF_M${index + 1}`,
            label: `QF ${index + 1}`,
            status: "pending" as MatchStatus,
            bestOf: 3,
            entrants: [
              pendingEntrant(`QF${index * 2 + 1}`, "Winner R16"),
              pendingEntrant(`QF${index * 2 + 2}`, "Winner R16"),
            ],
          })),
        },
        {
          title: "Semifinals",
          matches: Array.from({ length: 2 }, (_, index) => ({
            id: `Finals_SF_M${index + 1}`,
            label: `SF ${index + 1}`,
            status: "pending" as MatchStatus,
            bestOf: 3,
            entrants: [
              pendingEntrant(`SF${index * 2 + 1}`, "Winner QF"),
              pendingEntrant(`SF${index * 2 + 2}`, "Winner QF"),
            ],
          })),
        },
        {
          title: "Grand Final",
          matches: [
            {
              id: "Finals_GF_M1",
              label: "Grand Final",
              status: "pending",
              bestOf: 3,
              entrants: [pendingEntrant("GF1", "Winner SF1"), pendingEntrant("GF2", "Winner SF2")],
            },
          ],
        },
      ],
    },
  };
}

function emptyWildcard(): WildcardViewData {
  const lobbies: WildcardLobby[] = Array.from({ length: 4 }, (_, lobbyIndex) => ({
    id: `Wildcard_L${lobbyIndex + 1}`,
    label: `Lobby ${lobbyIndex + 1}`,
    status: "Pending",
    players: Array.from({ length: 3 }, (_, playerIndex) => ({
      ...placeholderPlayer(`W${lobbyIndex * 3 + playerIndex + 1}`),
      stateLabel: "Pending",
    })),
  }));

  return {
    id: "wildcard",
    label: "Wildcard",
    poolCount: 12,
    finalSlots: 4,
    players: lobbies.flatMap((lobby, lobbyIndex) =>
      lobby.players.map((player, index) => ({
        seed: player.seed,
        name: "Awaiting qualifier",
        city: "",
        sourceGroup: "Wildcard",
        sourceLobby: lobby.label,
        sourceRank: lobbyIndex * 3 + index + 1,
        status: "pending" as PlayerState,
        statusLabel: "Pending",
      })),
    ),
    lobbies,
    finalSlotPlayers: Array.from({ length: 4 }, (_, index) => ({
      seed: `WQ${index + 1}`,
      name: "Awaiting qualifier",
      city: "",
      pending: true,
    })),
  };
}

export const groupTitan = emptyGroup("group-titan", "Group Titan", "Titan", "titan");
export const groupNexus = emptyGroup("group-nexus", "Group Nexus", "Nexus", "nexus");
export const groupDominion = emptyGroup("group-dominion", "Group Dominion", "Dominion", "dominion");
export const groups = [groupTitan, groupNexus, groupDominion];
export const finalsView = emptyFinals();
export const wildcardView = emptyWildcard();

export const defaultTournamentData: TournamentData = {
  groups,
  groupTitan,
  groupNexus,
  groupDominion,
  finalsView,
  wildcardView,
  meta: {
    mode: "loading",
    message: "Loading brackets...",
    fetchedAt: null,
  },
};
