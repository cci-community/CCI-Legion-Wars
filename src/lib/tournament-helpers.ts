import {
  defaultTournamentData,
  type GroupView,
  type Lobby,
  type Match,
  type Player,
  type TournamentData,
} from "./tournament-data";

export type ViewKey = "finals" | "titan" | "nexus" | "dominion" | "wildcard";

export interface PlayerSearchIndex {
  key: string;
  name: string;
  city: string;
  region?: string;
  lobbyId?: string;
  matchId?: string;
  location: string;
  view: ViewKey;
  state: string;
}

export function groupsByView(
  data: TournamentData = defaultTournamentData,
): Record<Exclude<ViewKey, "finals" | "wildcard">, GroupView> {
  return {
    titan: data.groupTitan,
    nexus: data.groupNexus,
    dominion: data.groupDominion,
  };
}

export const GROUPS_BY_VIEW = groupsByView();

export function flattenPlayers(data: TournamentData = defaultTournamentData): PlayerSearchIndex[] {
  const out: PlayerSearchIndex[] = [];
  const groupMap = groupsByView(data);

  (["titan", "nexus", "dominion"] as const).forEach((view) => {
    const group = groupMap[view];
    group.progression.rounds.forEach((round) => {
      round.lobbies.forEach((lobby) => {
        lobby.players.forEach((player, index) => {
          if (!player.name || /^awaiting/i.test(player.name)) return;
          out.push({
            key: `${lobby.id}-${index}`,
            name: player.name,
            city: player.city,
            region: player.region,
            lobbyId: lobby.id,
            location: `${group.label} · ${round.title} · ${lobby.id}`,
            view,
            state: player.stateLabel,
          });
        });
      });
    });
  });

  data.wildcardView.lobbies.forEach((lobby) => {
    lobby.players.forEach((player, index) => {
      if (!player.name || /^awaiting/i.test(player.name)) return;
      out.push({
        key: `wc-${lobby.id}-${index}`,
        name: player.name,
        city: player.city,
        location: `Wildcard · ${lobby.label}`,
        view: "wildcard",
        state: player.stateLabel,
      });
    });
  });

  data.finalsView.bracket.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      match.entrants.forEach((entrant, index) => {
        if (entrant.pending || !entrant.name || /^awaiting/i.test(entrant.name)) return;
        out.push({
          key: `finals-${match.id}-${index}`,
          name: entrant.name,
          city: entrant.city ?? "",
          matchId: match.id,
          location: `Finals · ${round.title} · ${match.id}`,
          view: "finals",
          state: match.status,
        });
      });
    });
  });

  return out;
}

export function findLobbyById(
  id: string,
  data: TournamentData = defaultTournamentData,
): { lobby: Lobby; group: GroupView; roundTitle: string } | null {
  const groupMap = groupsByView(data);
  const normalizedId = id.toLowerCase();
  for (const view of ["titan", "nexus", "dominion"] as const) {
    const group = groupMap[view];
    for (const round of group.progression.rounds) {
      const lobby = round.lobbies.find((candidate) => candidate.id.toLowerCase() === normalizedId);
      if (lobby) return { lobby, group, roundTitle: round.title };
    }
  }
  return null;
}

export function findMatchById(
  id: string,
  data: TournamentData = defaultTournamentData,
): { match: Match; roundTitle: string } | null {
  const normalizedId = id.toLowerCase();
  for (const round of data.finalsView.bracket.rounds) {
    const match = round.matches.find((candidate) => candidate.id.toLowerCase() === normalizedId);
    if (match) return { match, roundTitle: round.title };
  }
  return null;
}

export function viewForLobbyId(id: string): ViewKey | null {
  const prefix = id.split("_")[0].toLowerCase();
  if (prefix === "titan" || prefix === "nexus" || prefix === "dominion") return prefix as ViewKey;
  return null;
}

export function allLiveItems(data: TournamentData = defaultTournamentData): {
  type: "lobby" | "match";
  id: string;
  label: string;
  detail: string;
  view: ViewKey;
}[] {
  const out: ReturnType<typeof allLiveItems> = [];
  const groupMap = groupsByView(data);

  (["titan", "nexus", "dominion"] as const).forEach((view) => {
    const group = groupMap[view];
    group.progression.rounds.forEach((round) => {
      round.lobbies.forEach((lobby) => {
        if (lobby.status === "Live") {
          const leading = [...lobby.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
          out.push({
            type: "lobby",
            id: lobby.id,
            label: lobby.id,
            detail: leading ? `${leading.name} leads · ${leading.score}` : round.title,
            view,
          });
        }
      });
    });
  });

  data.finalsView.bracket.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.status === "live") {
        const [left, right] = match.entrants;
        out.push({
          type: "match",
          id: match.id,
          label: match.id,
          detail: `${left.name} ${left.score ?? 0} - ${right.score ?? 0} ${right.name}`,
          view: "finals",
        });
      }
    });
  });

  return out;
}

export type { Lobby, Match, Player, GroupView, TournamentData };
