// Copyright (c) 2026 CCI Volunteer Legion and ATLNO.exe.
// This module intentionally derives only public qualifier/bracket state from published sheet tabs.

const TRUTHY_QUALIFIER_VALUES = new Set(["1", "yes", "y", "true", "qualified", "qualify", "winner", "win", "w"]);
const GROUP_ROUND_BY_ENTRANT_COUNT = new Map([
  [2, "Grand Final"],
  [4, "Semifinals"],
  [8, "Quarterfinals"]
]);
const GROUP_ROUND_SPECS = [
  {
    number: 1,
    title: "Round 1",
    players: 64,
    lobbies: 16,
    advance: "Top 2 advance",
    result: "32 advance"
  },
  {
    number: 2,
    title: "Round 2",
    players: 32,
    lobbies: 8,
    advance: "Top 2 advance",
    result: "16 advance"
  },
  {
    number: 3,
    title: "Round 3",
    players: 16,
    lobbies: 4,
    advance: "Top 2 advance",
    result: "8 advance"
  },
  {
    number: 4,
    title: "Round 4",
    players: 8,
    lobbies: 2,
    advance: "1st-2nd Finals / 3rd-4th Wildcard",
    result: "4 Finals + 4 Wildcard"
  }
];
const FINALS_ROUND_TITLES = new Map([
  ["ro16", "Round of 16"],
  ["round of 16", "Round of 16"],
  ["quarterfinal", "Quarterfinals"],
  ["quarterfinals", "Quarterfinals"],
  ["semifinal", "Semifinals"],
  ["semifinals", "Semifinals"],
  ["grand final", "Grand Final"],
  ["final", "Grand Final"]
]);
const GROUP_ROUTE_STAGE_NAMES = new Set(["round of 8", "round 8", "round four", "round 4", "round of eight"]);

export function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => cleanText(value) !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => cleanText(value) !== "")) rows.push(row);
  return rows;
}

export function buildTournamentFromSheet(csvText, fallbackTournament, fetchedAt = new Date(), requestedStageName = "") {
  return buildGroupFeedFromCsv(csvText, {
    id: "legacy-group",
    label: "Google Sheet",
    shortLabel: "Sheet",
    type: "group",
    summary: "Public qualifier slots from the published sheet"
  }, fallbackTournament, fetchedAt, requestedStageName);
}

export function buildGroupFeedFromCsv(csvText, feedConfig, fallbackTournament, fetchedAt = new Date(), requestedStageName = "") {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error(`${feedConfig.label} did not include enough rows to build a bracket.`);
  }

  const [headers, ...bodyRows] = rows;
  const playerColumns = findPlayerColumns(headers);
  if (!playerColumns.length) {
    throw new Error(`${feedConfig.label} needs Player columns to derive qualifiers.`);
  }

  const parsedStages = parseGroupStages(bodyRows, playerColumns);
  const activeStage = chooseActiveStage(parsedStages, requestedStageName);
  if (!activeStage) {
    throw new Error(`${feedConfig.label} did not contain lobby rows.`);
  }

  const availableStages = parsedStages.map((stage) => ({
    name: stage.name,
    lobbyCount: stage.lobbies.length,
    qualifierCount: countStageQualifiers(stage)
  }));
  const lobbies = activeStage.lobbies.map((lobby) => normalizeLobby(lobby, feedConfig));
  const progression = feedConfig.type === "wildcard" ?
    buildWildcardProgression(lobbies, activeStage, feedConfig) :
    buildGroupProgression(parsedStages, feedConfig);
  const bracket = buildGroupBracket(lobbies, activeStage.name, feedConfig);
  const qualifiedCount = lobbies.reduce((count, lobby) => {
    return count + lobby.qualifiers.filter((qualifier) => !qualifier.pending).length;
  }, 0);
  const expectedCount = lobbies.length * 2;
  const routeStage = feedConfig.type === "group" ? chooseGroupRouteStage(parsedStages) : activeStage;
  const rankedPlayers = rankedStagePlayers(routeStage);
  const routeCounts = calculateRouteCounts(routeStage, qualifiedCount, feedConfig);
  const routeCandidates = feedConfig.type === "group" ? extractGroupRouteCandidates(routeStage, feedConfig) : {
    directCandidates: [],
    wildcardCandidates: []
  };
  const directNationalCount = routeCounts.directNationalCount;
  const wildcardCount = routeCounts.wildcardCount;
  const nationalCount = routeCounts.nationalCount;
  const wildcardPoolCount = feedConfig.type === "wildcard" ? countPublicPlayers(activeStage) : wildcardCount;
  const visibleProgressCount = feedConfig.type === "wildcard" ? nationalCount : qualifiedCount;
  const visibleExpectedCount = feedConfig.type === "wildcard" ? 4 : expectedCount;
  const status = feedConfig.type === "wildcard" ? [
    { label: "Feed", value: feedConfig.shortLabel ?? feedConfig.label },
    { label: "Stage", value: activeStage.name },
    { label: "Pool", value: `${wildcardPoolCount}/12` },
    { label: "Final slots", value: `${visibleProgressCount}/${visibleExpectedCount}` }
  ] : [
    { label: "Feed", value: feedConfig.shortLabel ?? feedConfig.label },
    { label: "Stage", value: activeStage.name },
    { label: "Advancing", value: `${qualifiedCount}/${expectedCount}` },
    { label: "Route", value: `${routeStageLabel(routeStage.name)}: Top 4 / 5-8` }
  ];

  return {
    ...fallbackTournament,
    id: feedConfig.id,
    label: feedConfig.label,
    shortLabel: feedConfig.shortLabel ?? feedConfig.label,
    type: feedConfig.type,
    status,
    bracket,
    progression,
    lobbies,
    meta: {
      source: "sheet",
      sourceLabel: feedConfig.label,
      feedId: feedConfig.id,
      feedType: feedConfig.type,
      gid: feedConfig.gid,
      stage: activeStage.name,
      availableStages,
      fetchedAt: fetchedAt.toISOString(),
      routeStage: routeStage.name,
      qualifiedCount,
      expectedCount: visibleExpectedCount,
      lobbyQualifiedCount: qualifiedCount,
      lobbyExpectedCount: expectedCount,
      lobbyCount: lobbies.length,
      nationalCount,
      wildcardCount,
      directNationalCount,
      directCandidates: routeCandidates.directCandidates,
      wildcardCandidates: routeCandidates.wildcardCandidates,
      wildcardPoolCount,
      expectedWildcardPoolCount: feedConfig.type === "wildcard" ? 12 : undefined,
      summary: feedConfig.summary
    }
  };
}

export function buildFinalsFeedFromCsv(csvText, feedConfig, fallbackTournament, fetchedAt = new Date()) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error(`${feedConfig.label} did not include enough rows to build finals.`);
  }

  const [headers, ...bodyRows] = rows;
  const columns = findFinalsColumns(headers);
  const rounds = [];
  let currentRound = "";

  bodyRows.forEach((row) => {
    const roundCell = cleanText(row[columns.round]);
    if (roundCell) currentRound = roundCell;
    const roundName = roundTitle(currentRound);
    const matchLabel = cleanText(row[columns.match]) || `Match ${rounds.reduce((count, round) => count + round.matches.length, 0) + 1}`;
    if (!roundName || !matchLabel) return;

    let round = rounds.find((candidate) => candidate.title === roundName);
    if (!round) {
      round = {
        id: slugify(roundName),
        title: roundName,
        matches: []
      };
      rounds.push(round);
    }

    const playerA = normalizeName(row[columns.playerA]) || "Awaiting qualifier";
    const playerB = normalizeName(row[columns.playerB]) || "Awaiting qualifier";
    const scoreA = parseScore(row[columns.scoreA]);
    const scoreB = parseScore(row[columns.scoreB]);
    const winner = normalizeName(row[columns.winner]);
    const hasScore = Number.isInteger(scoreA) || Number.isInteger(scoreB);
    const matchStatus = winner ? "final" : (playerA === "Awaiting qualifier" || playerB === "Awaiting qualifier" ? "pending" : (hasScore ? "live" : "ready"));
    const entrants = [
      {
        seed: "A",
        name: playerA,
        score: scoreA,
        pending: playerA === "Awaiting qualifier",
        winner: namesMatch(playerA, winner)
      },
      {
        seed: "B",
        name: playerB,
        score: scoreB,
        pending: playerB === "Awaiting qualifier",
        winner: namesMatch(playerB, winner)
      }
    ];

    round.matches.push({
      id: `${round.id}-${slugify(matchLabel)}`,
      label: matchLabel,
      status: matchStatus,
      bestOf: roundName === "Grand Final" ? 5 : 3,
      feed: winner ? `Winner: ${winner}` : "Winner advances",
      starts: roundName,
      entrants
    });
  });

  const entrantNames = new Set();
  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      match.entrants.forEach((entrant) => {
        if (!entrant.pending) entrantNames.add(entrant.name);
      });
    });
  });

  const pendingSlots = Math.max(0, (feedConfig.finalistSlots ?? 16) - entrantNames.size);

  return {
    ...fallbackTournament,
    id: feedConfig.id,
    label: feedConfig.label,
    shortLabel: feedConfig.shortLabel ?? feedConfig.label,
    type: "finals",
    status: [
      { label: "Feed", value: "National Finals" },
      { label: "Format", value: "16-player final" },
      { label: "Rounds", value: `${rounds.length}` },
      { label: "Players", value: `${entrantNames.size}/${feedConfig.finalistSlots ?? 16}` }
    ],
    bracket: {
      phase: "National Finals",
      mode: "16-player single elimination",
      rounds
    },
    lobbies: finalistCards(entrantNames, pendingSlots),
    meta: {
      source: "sheet",
      sourceLabel: feedConfig.label,
      feedId: feedConfig.id,
      feedType: "finals",
      gid: feedConfig.gid,
      stage: "National Finals",
      availableStages: [],
      fetchedAt: fetchedAt.toISOString(),
      qualifiedCount: entrantNames.size,
      expectedCount: feedConfig.finalistSlots ?? 16,
      lobbyCount: 0,
      nationalCount: entrantNames.size,
      wildcardCount: 0,
      directNationalCount: Math.min(12, entrantNames.size),
      summary: feedConfig.summary
    }
  };
}

export async function loadTournamentFeeds({ config, fallbackTournament, force = false, stageSelections = {} }) {
  const results = await Promise.all(config.feeds.map(async (feed) => {
    return loadFeed({ config, feed, fallbackTournament, force, stageName: stageSelections[feed.id] ?? "" });
  }));
  const feeds = applyDerivedWildcardPool(results.map((result) => result.tournament));
  return {
    tournament: buildWorkbookTournament(feeds, fallbackTournament),
    feeds,
    meta: mergeFeedMeta(results)
  };
}

export async function loadTournamentFromSheet({ config, fallbackTournament, force = false, stageName = "" }) {
  if (Array.isArray(config.feeds) && config.feeds.length) {
    const result = await loadTournamentFeeds({ config, fallbackTournament, force, stageSelections: { [config.feeds[0].id]: stageName } });
    return {
      tournament: result.feeds[0] ?? result.tournament,
      meta: result.meta
    };
  }
  const legacyFeed = {
    id: "legacy-feed",
    label: config.sourceLabel ?? "Google Sheet",
    type: "group",
    csvUrl: config.csvUrl
  };
  return loadFeed({ config, feed: legacyFeed, fallbackTournament, force, stageName });
}

async function loadFeed({ config, feed, fallbackTournament, force = false, stageName = "" }) {
  const now = Date.now();
  const cacheKey = `${config.cacheKey}:${feed.id}`;
  const cache = readCache(cacheKey);
  const cacheIsFresh = cache && now - cache.savedAt < config.minFetchIntervalMs;

  if (!force && cacheIsFresh) {
    return {
      tournament: buildFeedFromCsv(cache.csvText, feed, fallbackTournament, new Date(cache.fetchedAt), stageName),
      meta: {
        mode: "cached",
        message: "Showing recent bracket data.",
        fetchedAt: cache.fetchedAt,
        feedId: feed.id
      }
    };
  }

  try {
    const csvText = await fetchCsv(feed.csvUrl, config.requestTimeoutMs, force);
    const fetchedAt = new Date();
    writeCache(cacheKey, {
      csvText,
      fetchedAt: fetchedAt.toISOString(),
      savedAt: now
    });

    return {
      tournament: buildFeedFromCsv(csvText, feed, fallbackTournament, fetchedAt, stageName),
      meta: {
        mode: "live",
        message: "Brackets updated.",
        fetchedAt: fetchedAt.toISOString(),
        feedId: feed.id
      }
    };
  } catch (error) {
    if (cache?.csvText) {
      return {
        tournament: buildFeedFromCsv(cache.csvText, feed, fallbackTournament, new Date(cache.fetchedAt), stageName),
        meta: {
          mode: "stale",
          message: `Showing saved ${feed.shortLabel ?? feed.label} data. Refresh failed.`,
          fetchedAt: cache.fetchedAt,
          feedId: feed.id
        }
      };
    }

    return {
      tournament: {
        ...fallbackTournament,
        id: feed.id,
        label: feed.label,
        type: feed.type,
        meta: {
          source: "fallback",
          sourceLabel: feed.label,
          feedId: feed.id,
          feedType: feed.type,
          fetchedAt: null
        }
      },
      meta: {
        mode: "fallback",
        message: `Showing fallback ${feed.shortLabel ?? feed.label} bracket.`,
        fetchedAt: null,
        feedId: feed.id
      }
    };
  }
}

function buildFeedFromCsv(csvText, feed, fallbackTournament, fetchedAt, stageName) {
  if (feed.type === "finals") return buildFinalsFeedFromCsv(csvText, feed, fallbackTournament, fetchedAt);
  return buildGroupFeedFromCsv(csvText, feed, fallbackTournament, fetchedAt, stageName);
}

function applyDerivedWildcardPool(feeds) {
  const wildcard = feeds.find((feed) => feed.type === "wildcard");
  if (!wildcard) return feeds;

  const existingPoolCount = wildcard.meta?.wildcardPoolCount ?? countFeedPlayers(wildcard);
  if (existingPoolCount > 0) return feeds;

  const groups = feeds.filter((feed) => feed.type === "group");
  const candidates = groups.flatMap((feed) => feed.meta?.wildcardCandidates ?? []);
  if (!candidates.length) return feeds;

  const candidateCards = groups.map((feed) => wildcardPoolCard(feed)).filter(Boolean);
  const enhancedWildcard = {
    ...wildcard,
    status: [
      { label: "Feed", value: wildcard.shortLabel ?? wildcard.label },
      { label: "Stage", value: "Wildcard Pool" },
      { label: "Pool", value: `${candidates.length}/12` },
      { label: "Final slots", value: `${wildcard.meta?.nationalCount ?? 0}/4` }
    ],
    lobbies: candidateCards,
    progression: buildWildcardProgression(candidateCards, { name: "Wildcard Pool" }, wildcard),
    meta: {
      ...wildcard.meta,
      stage: "Wildcard Pool",
      derivedFromGroups: true,
      wildcardPoolCount: candidates.length,
      expectedWildcardPoolCount: 12,
      wildcardCandidates: candidates
    }
  };

  return feeds.map((feed) => feed.id === wildcard.id ? enhancedWildcard : feed);
}

function buildGroupProgression(stages, feedConfig) {
  const groupName = publicGroupName(feedConfig);
  const rounds = GROUP_ROUND_SPECS.map((spec) => {
    const stage = findStageForGroupRound(stages, spec.number);
    const lobbies = (stage?.lobbies ?? []).map((lobby, index) => {
      return normalizeProgressionLobby(lobby, feedConfig, spec, index);
    });

    return {
      id: `${slugify(groupName)}-r${spec.number}`,
      title: spec.title,
      sourceStage: stage?.name ?? "",
      players: spec.players,
      expectedLobbies: spec.lobbies,
      advance: spec.advance,
      result: spec.result,
      lobbies
    };
  });

  return {
    type: "group",
    phase: groupName,
    mode: "Lobby progression",
    rounds
  };
}

function buildWildcardProgression(lobbies, activeStage, feedConfig) {
  const pool = lobbies.flatMap((lobby) => lobby.players ?? []);
  const poolLobbies = pool.length ?
    lobbies.map((lobby, index) => normalizeWildcardPoolCard(lobby, index)) :
    wildcardPlaceholderPool();
  const qualifiers = pool
    .filter((player) => {
      return (Number.isInteger(player.rank) && player.rank >= 1 && player.rank <= 4) || player.qualified;
    })
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 4);

  const finalSlots = Array.from({ length: 4 }, (_, index) => {
    const player = qualifiers[index];
    return player ? {
      seed: `WQ${index + 1}`,
      name: player.name,
      city: player.city,
      placement: index + 1,
      pending: false,
      state: "qualified",
      stateLabel: "Finals"
    } : {
      seed: `WQ${index + 1}`,
      name: "Awaiting qualifier",
      city: "",
      placement: index + 1,
      pending: true,
      state: "pending",
      stateLabel: "Pending"
    };
  });

  return {
    type: "wildcard",
    phase: feedConfig.shortLabel ?? feedConfig.label ?? "Wildcard",
    mode: "12-player last chance",
    sourceStage: activeStage?.name ?? "Wildcard",
    poolCount: pool.length,
    expectedPoolCount: 12,
    finalSlots,
    rounds: [
      {
        id: "wildcard-pool",
        title: "Wildcard Pool",
        sourceStage: activeStage?.name ?? "Wildcard",
        players: pool.length,
        expectedLobbies: 3,
        advance: "Top 4 advance",
        result: "4 Finals slots",
        lobbies: poolLobbies
      }
    ]
  };
}

function findStageForGroupRound(stages, roundNumber) {
  return stages.find((stage) => inferGroupRoundNumber(stage) === roundNumber) ?? null;
}

function inferGroupRoundNumber(stage) {
  const name = cleanText(stage?.name).toLowerCase();
  const roundOfMatch = name.match(/round\s+of\s+(\d+)/);
  if (roundOfMatch) {
    const entrantCount = Number.parseInt(roundOfMatch[1], 10);
    if (entrantCount === 64) return 1;
    if (entrantCount === 32) return 2;
    if (entrantCount === 16) return 3;
    if (entrantCount === 8) return 4;
  }

  if (/round\s*(1|one)\b/.test(name)) return 1;
  if (/round\s*(2|two)\b/.test(name)) return 2;
  if (/round\s*(3|three)\b/.test(name)) return 3;
  if (/round\s*(4|four)\b/.test(name) || isGroupRouteStage(name)) return 4;

  const byLobbyCount = new Map([
    [16, 1],
    [8, 2],
    [4, 3],
    [2, 4]
  ]);

  return byLobbyCount.get(stage?.lobbies?.length) ?? null;
}

function normalizeProgressionLobby(lobby, feedConfig, spec, index) {
  const normalized = normalizeLobby(lobby, feedConfig);
  const lobbyNumber = extractLobbyNumber(lobby.name, lobby.id) ?? index + 1;
  const publicId = `${publicGroupName(feedConfig)}_R${spec.number}_L${lobbyNumber}`;

  return {
    ...normalized,
    id: publicId,
    name: publicId,
    sourceName: lobby.name,
    summary: spec.advance,
    players: normalized.players.map((player) => {
      const state = groupPlayerState(player, spec.number);
      return {
        ...player,
        state,
        stateLabel: groupPlayerStateLabel(state, spec.number)
      };
    })
  };
}

function normalizeWildcardPoolCard(lobby, index) {
  return {
    ...lobby,
    id: lobby.id?.startsWith("Wildcard_") ? lobby.id : `Wildcard_L${index + 1}`,
    name: lobby.name ?? `Wildcard Pool ${index + 1}`,
    players: (lobby.players ?? []).map((player) => ({
      ...player,
      state: player.pending ? "pending" : (player.qualified || (Number.isInteger(player.rank) && player.rank <= 4) ? "qualified" : "wildcard"),
      stateLabel: player.pending ? "Pending" : (player.qualified || (Number.isInteger(player.rank) && player.rank <= 4) ? "Finals" : "Pool")
    }))
  };
}

function wildcardPlaceholderPool() {
  return Array.from({ length: 3 }, (_, poolIndex) => {
    const start = poolIndex * 4 + 1;
    return {
      id: `Wildcard_Pool_${poolIndex + 1}`,
      name: `Wildcard Pool ${poolIndex + 1}`,
      summary: "Awaiting group 5th-8th placements",
      status: "Awaiting result",
      players: Array.from({ length: 4 }, (_, offset) => {
        const slot = start + offset;
        return {
          seed: `W${slot}`,
          name: "Awaiting player",
          city: "",
          rank: null,
          qualified: false,
          pending: true,
          state: "pending",
          stateLabel: "Pending"
        };
      }),
      qualifiers: []
    };
  });
}

function groupPlayerState(player, roundNumber) {
  if (!player.qualified && !Number.isInteger(player.rank)) return "pending";

  if (roundNumber === 4) {
    if (player.qualified && !Number.isInteger(player.rank)) return "qualified";
    if (player.rank >= 1 && player.rank <= 2) return "qualified";
    if (player.rank >= 3 && player.rank <= 4) return "wildcard";
    return "eliminated";
  }

  if (player.qualified && !Number.isInteger(player.rank)) return "qualified";
  if (player.rank >= 1 && player.rank <= 2) return "qualified";
  return "eliminated";
}

function groupPlayerStateLabel(state, roundNumber) {
  if (state === "qualified") return roundNumber === 4 ? "Finals" : "Advance";
  if (state === "wildcard") return "Wildcard";
  if (state === "eliminated") return "Out";
  return "Pending";
}

function wildcardPoolCard(feed) {
  const candidates = feed.meta?.wildcardCandidates ?? [];
  if (!candidates.length) return null;

  return {
    id: feed.shortLabel ?? feed.label,
    name: `${feed.shortLabel ?? feed.label} Wildcard`,
    summary: "Round of 8 placements 5th-8th",
    status: candidates.length >= 4 ? "Pool ready" : "Awaiting result",
    players: candidates.map((candidate, index) => ({
      seed: candidate.seed ?? `${feed.shortLabel ?? feed.label}-W${index + 1}`,
      name: candidate.name,
      city: candidate.city,
      rank: candidate.placement,
      qualified: false,
      pending: false
    })),
    qualifiers: [
      { seed: `${feed.shortLabel ?? feed.label}-W1`, name: "Awaiting wildcard result", placement: 1, pending: true },
      { seed: `${feed.shortLabel ?? feed.label}-W2`, name: "Awaiting wildcard result", placement: 2, pending: true }
    ]
  };
}

function buildWorkbookTournament(feeds, fallbackTournament) {
  const finals = feeds.find((feed) => feed.type === "finals");
  const groups = feeds.filter((feed) => feed.type === "group");
  const wildcard = feeds.find((feed) => feed.type === "wildcard");
  const directCount = groups.reduce((count, feed) => count + (feed.meta?.directNationalCount ?? 0), 0);
  const wildcardFinalCount = wildcard?.meta?.nationalCount ?? 0;
  const finalsCount = finals?.meta?.qualifiedCount ?? 0;

  return {
    ...fallbackTournament,
    status: [
      { label: "Feeds", value: `${feeds.length} public tabs` },
      { label: "Groups", value: `${groups.length}` },
      { label: "Finalists", value: `${finalsCount}/16` },
      { label: "Wildcard", value: `${wildcardFinalCount}/4` }
    ],
    bracket: finals?.bracket ?? fallbackTournament.bracket,
    lobbies: finals?.lobbies ?? fallbackTournament.lobbies,
    rules: fallbackTournament.rules,
    meta: {
      source: "workbook",
      sourceLabel: "Published workbook",
      feedCount: feeds.length,
      directNationalCount: directCount,
      wildcardFinalCount,
      finalsCount
    }
  };
}

function mergeFeedMeta(results) {
  const failed = results.filter((result) => result.meta.mode === "fallback" || result.meta.mode === "stale");
  const latest = results
    .map((result) => result.meta.fetchedAt)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
  return {
    mode: failed.length ? (failed.length === results.length ? "fallback" : "stale") : (results.some((result) => result.meta.mode === "cached") ? "cached" : "live"),
    message: failed.length ?
      `${results.length - failed.length}/${results.length} feeds updated; ${failed.length} using saved data.` :
      "Brackets updated.",
    fetchedAt: latest
  };
}

function findPlayerColumns(headers) {
  return headers
    .map((header, index) => {
      const match = cleanText(header).match(/^player\s*(\d+)$/i);
      return match ? { index, slot: Number(match[1]) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.slot - b.slot);
}

function parseGroupStages(rows, playerColumns) {
  const stages = [];
  let currentStageName = "";

  rows.forEach((row) => {
    const stageCell = normalizeStageName(row[0]);
    const lobbyName = cleanText(row[1]);
    if (stageCell) currentStageName = stageCell;
    if (!lobbyName) return;

    const stageName = currentStageName || "Tournament bracket";
    let stage = stages.find((candidate) => candidate.name === stageName);
    if (!stage) {
      stage = { name: stageName, lobbies: [] };
      stages.push(stage);
    }

    const players = playerColumns
      .map(({ index, slot }) => readPlayerSlot(row, index, slot))
      .filter((player) => player.name);

    stage.lobbies.push({
      id: extractLobbyId(lobbyName),
      name: lobbyName,
      summary: "Qualifier slots",
      players
    });
  });

  return stages;
}

function readPlayerSlot(row, index, slot) {
  const name = normalizeName(row[index]);
  const city = cleanText(row[index + 1]);
  const rankText = cleanText(row[index + 2]);
  const qualifiedText = cleanText(row[index + 3]);
  const rank = parsePlacement(rankText) ?? parsePlacement(qualifiedText);
  const qualified = rank !== null || isTruthyQualifier(qualifiedText);

  return {
    slot,
    name,
    city,
    rank,
    qualified,
    qualifiedText
  };
}

function chooseActiveStage(stages, requestedStageName = "") {
  if (!stages.length) return null;
  if (requestedStageName) {
    const requested = stages.find((stage) => stage.name === requestedStageName);
    if (requested) return requested;
  }

  const stagesWithQualifiers = stages.filter((stage) => {
    return stage.lobbies.some((lobby) => lobby.players.some((player) => player.qualified || player.rank));
  });
  return stagesWithQualifiers.at(-1) ?? stages[0];
}

function countStageQualifiers(stage) {
  return stage.lobbies.reduce((total, lobby) => {
    return total + lobby.players.filter((player) => player.qualified || player.rank !== null).length;
  }, 0);
}

function rankedStagePlayers(stage) {
  return stage.lobbies
    .flatMap((lobby) => lobby.players.map((player) => ({ ...player, lobby: lobby.name })))
    .filter((player) => Number.isInteger(player.rank))
    .sort((a, b) => a.rank - b.rank);
}

function extractGroupRouteCandidates(stage, feedConfig) {
  if (!stage) {
    return {
      directCandidates: [],
      wildcardCandidates: []
    };
  }

  const globalRanked = rankedStagePlayers(stage);
  const globalWildcard = countUniqueGlobalPlacements(globalRanked, 5, 8);
  const useGlobalRanks = Number.isInteger(globalWildcard) && globalWildcard > 0;
  const directCandidates = [];
  const wildcardCandidates = [];

  stage.lobbies.forEach((lobby, lobbyIndex) => {
    lobby.players
      .filter((player) => Number.isInteger(player.rank))
      .forEach((player) => {
        if (useGlobalRanks) {
          if (player.rank >= 1 && player.rank <= 4) {
            directCandidates.push(routeCandidate(player, feedConfig, lobby, player.rank));
          }
          if (player.rank >= 5 && player.rank <= 8) {
            wildcardCandidates.push(routeCandidate(player, feedConfig, lobby, player.rank));
          }
          return;
        }

        if (player.rank >= 1 && player.rank <= 2) {
          const placement = lobbyIndex * 2 + player.rank;
          directCandidates.push(routeCandidate(player, feedConfig, lobby, placement));
        }

        if (player.rank >= 3 && player.rank <= 4) {
          const placement = 5 + (lobbyIndex * 2) + (player.rank - 3);
          wildcardCandidates.push(routeCandidate(player, feedConfig, lobby, placement));
        }
      });
  });

  return {
    directCandidates: directCandidates.sort((a, b) => a.placement - b.placement),
    wildcardCandidates: wildcardCandidates.sort((a, b) => a.placement - b.placement)
  };
}

function routeCandidate(player, feedConfig, lobby, placement) {
  return {
    seed: `${feedConfig.shortLabel ?? feedConfig.label}-${placement}`,
    group: feedConfig.shortLabel ?? feedConfig.label,
    lobby: lobby.name,
    name: player.name,
    city: player.city,
    rank: player.rank,
    placement
  };
}

function chooseGroupRouteStage(stages) {
  return stages.find((stage) => isGroupRouteStage(stage.name)) ??
    stages.find((stage) => stage.lobbies.length === 2) ??
    stages.at(-1);
}

function isGroupRouteStage(stageName) {
  return GROUP_ROUTE_STAGE_NAMES.has(cleanText(stageName).toLowerCase());
}

function routeStageLabel(stageName) {
  return isGroupRouteStage(stageName) ? "R8" : cleanText(stageName);
}

function calculateRouteCounts(stage, qualifiedCount, feedConfig) {
  const rankedPlayers = rankedStagePlayers(stage);
  const globalDirectCount = countUniqueGlobalPlacements(rankedPlayers, 1, 4);
  const globalWildcardCount = countUniqueGlobalPlacements(rankedPlayers, 5, 8);

  if (feedConfig.type === "wildcard") {
    const winnerCount = stage.lobbies.reduce((count, lobby) => {
      return count + lobby.players.filter((player) => player.rank === 1 || isTruthyQualifier(player.qualifiedText)).length;
    }, 0);
    const nationalCount = globalDirectCount ?? Math.min(4, winnerCount || qualifiedCount);
    return {
      directNationalCount: 0,
      wildcardCount: 0,
      nationalCount
    };
  }

  const localRouteCounts = countRoundFourLocalPlacements(stage);
  const hasGlobalWildcardRanks = Number.isInteger(globalWildcardCount) && globalWildcardCount > 0;
  const directNationalCount = hasGlobalWildcardRanks ?
    (globalDirectCount ?? 0) :
    (localRouteCounts.directNationalCount ?? globalDirectCount ?? (stage.lobbies.length <= 2 ? Math.min(4, qualifiedCount) : 0));
  const wildcardCount = hasGlobalWildcardRanks ?
    globalWildcardCount :
    (localRouteCounts.wildcardCount ?? globalWildcardCount ?? 0);

  return {
    directNationalCount,
    wildcardCount,
    nationalCount: directNationalCount
  };
}

function countRoundFourLocalPlacements(stage) {
  if (!stage || stage.lobbies.length !== 2) {
    return {
      directNationalCount: null,
      wildcardCount: null
    };
  }

  const rankedPlayers = rankedStagePlayers(stage);
  if (!rankedPlayers.length) {
    return {
      directNationalCount: 0,
      wildcardCount: 0
    };
  }

  return {
    directNationalCount: rankedPlayers.filter((player) => player.rank >= 1 && player.rank <= 2).length,
    wildcardCount: rankedPlayers.filter((player) => player.rank >= 3 && player.rank <= 4).length
  };
}

function countPublicPlayers(stage) {
  return stage.lobbies.reduce((count, lobby) => count + lobby.players.length, 0);
}

function countFeedPlayers(feed) {
  return (feed.lobbies ?? []).reduce((count, lobby) => count + (lobby.players?.length ?? 0), 0);
}

function countUniqueGlobalPlacements(rankedPlayers, minRank, maxRank) {
  const playersInRange = rankedPlayers.filter((player) => player.rank >= minRank && player.rank <= maxRank);
  if (!playersInRange.length) return 0;

  const ranks = new Set();
  for (const player of playersInRange) {
    if (ranks.has(player.rank)) return null;
    ranks.add(player.rank);
  }

  return playersInRange.length;
}

function normalizeLobby(lobby, feedConfig) {
  const players = lobby.players.map((player) => ({
    seed: `${formatSeedPrefix(lobby.id)}-${player.slot}`,
    name: player.name,
    city: player.city,
    rank: player.rank,
    qualified: player.qualified,
    pending: false
  }));
  const ranked = lobby.players
    .filter((player) => player.qualified || player.rank === 1 || player.rank === 2)
    .map((player, index) => ({
      seed: `${formatSeedPrefix(lobby.id)}-${player.rank || index + 1}`,
      name: player.name,
      city: player.city,
      placement: player.rank || index + 1,
      pending: false
    }))
    .sort((a, b) => a.placement - b.placement)
    .slice(0, 2);

  const qualifiers = [1, 2].map((placement) => {
    return ranked.find((player) => player.placement === placement) ?? ranked[placement - 1] ?? {
      seed: `${formatSeedPrefix(lobby.id)}-${placement}`,
      name: `Awaiting ${placement === 1 ? "1st" : "2nd"} place`,
      city: "",
      placement,
      pending: true
    };
  });

  return {
    id: lobby.id,
    name: lobby.name,
    summary: feedConfig.type === "wildcard" ? "Last-chance qualifiers" : "Top two advance",
    status: qualifiers.every((qualifier) => !qualifier.pending) ? "Qualified" : "Awaiting result",
    players,
    qualifiers
  };
}

function buildGroupBracket(lobbies, stageName, feedConfig) {
  const slotCount = Math.max(4, nextPowerOfTwo(lobbies.length || 4));
  const firstPlacers = lobbies.map((lobby) => qualifierToEntrant(lobby, 0));
  const secondPlacers = lobbies.map((lobby) => qualifierToEntrant(lobby, 1)).reverse();
  const firstRoundMatches = [];

  for (let index = 0; index < slotCount; index += 1) {
    const first = firstPlacers[index] ?? placeholderEntrant(`G${index + 1}1`, "Awaiting group winner");
    const second = secondPlacers[index] ?? placeholderEntrant(`G${slotCount - index}2`, "Awaiting group runner-up");
    firstRoundMatches.push({
      id: `R1M${index + 1}`,
      label: `M${index + 1}`,
      status: first.pending || second.pending ? "pending" : "ready",
      bestOf: 3,
      feed: "Winner advances",
      starts: "After group lock",
      entrants: [first, second]
    });
  }

  const rounds = [{
    id: "round-1",
    title: groupRoundTitle(firstRoundMatches.length * 2),
    matches: firstRoundMatches
  }];

  let previousRound = firstRoundMatches;
  let roundIndex = 2;
  while (previousRound.length > 1) {
    const matchCount = Math.ceil(previousRound.length / 2);
    const matches = [];

    for (let index = 0; index < matchCount; index += 1) {
      const sourceA = previousRound[index * 2]?.label ?? `M${index * 2 + 1}`;
      const sourceB = previousRound[index * 2 + 1]?.label ?? "BYE";
      matches.push({
        id: `R${roundIndex}M${index + 1}`,
        label: matchCount === 1 ? "Group Final" : `M${index + 1}`,
        status: "pending",
        bestOf: matchCount === 1 ? 5 : 3,
        feed: matchCount === 1 ? "Group placement decided" : "Winner advances",
        starts: `After ${sourceA}/${sourceB}`,
        entrants: [
          placeholderEntrant(`W-${sourceA}`, `Winner ${sourceA}`),
          placeholderEntrant(`W-${sourceB}`, `Winner ${sourceB}`)
        ]
      });
    }

    rounds.push({
      id: `round-${roundIndex}`,
      title: groupRoundTitle(matchCount * 2),
      matches
    });

    previousRound = matches;
    roundIndex += 1;
  }

  return {
    phase: `${feedConfig.shortLabel ?? feedConfig.label} - ${stageName}`,
    mode: feedConfig.type === "wildcard" ? "Wildcard to Finals" : "Round of 8 decides Finals + Wildcard",
    rounds
  };
}

function finalistCards(names, pendingSlots) {
  const cards = Array.from(names).map((name, index) => ({
    id: String(index + 1),
    name: `Finalist ${index + 1}`,
    summary: "National Finals participant",
    status: "Qualified",
    qualifiers: [
      { seed: `F${index + 1}`, name, placement: 1, pending: false },
      { seed: "-", name: "National Finals slot locked", placement: 2, pending: false }
    ]
  }));

  for (let index = 0; index < pendingSlots; index += 1) {
    const slot = cards.length + 1;
    cards.push({
      id: String(slot),
      name: `Finalist ${slot}`,
      summary: "Awaiting group or wildcard qualifier",
      status: "Awaiting result",
      qualifiers: [
        { seed: `F${slot}`, name: "Awaiting qualifier", placement: 1, pending: true },
        { seed: "-", name: "National Finals slot pending", placement: 2, pending: true }
      ]
    });
  }

  return cards;
}

function findFinalsColumns(headers) {
  const normalized = headers.map((header) => cleanText(header).toLowerCase());
  const round = normalized.indexOf("round");
  const match = normalized.indexOf("match");
  const playerA = normalized.indexOf("player a");
  const playerB = normalized.indexOf("player b");
  const winner = normalized.indexOf("winner");
  const scoreColumns = normalized
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => header === "score" || header === "score a" || header === "score b");
  const scoreA = normalized.indexOf("score a") !== -1 ? normalized.indexOf("score a") : scoreColumns.find(({ index }) => index > playerA)?.index;
  const scoreB = normalized.indexOf("score b") !== -1 ? normalized.indexOf("score b") : scoreColumns.find(({ index }) => index > playerB)?.index;

  if ([round, match, playerA, playerB, winner, scoreA, scoreB].some((index) => index === -1 || index === undefined)) {
    throw new Error("National Finals feed must include Round, Match, Player A, Score A, Player B, Score B, and Winner columns.");
  }

  return { round, match, playerA, scoreA, playerB, scoreB, winner };
}

function qualifierToEntrant(lobby, qualifierIndex) {
  const qualifier = lobby.qualifiers[qualifierIndex];
  if (!qualifier) return placeholderEntrant(`${lobby.id}${qualifierIndex + 1}`, "Awaiting qualifier");
  return {
    seed: qualifier.seed,
    name: qualifier.name,
    city: qualifier.city,
    score: null,
    pending: qualifier.pending
  };
}

function placeholderEntrant(seed, name) {
  return { seed, name, score: null, pending: true };
}

function groupRoundTitle(entrantCount) {
  return GROUP_ROUND_BY_ENTRANT_COUNT.get(entrantCount) ?? `Round of ${entrantCount}`;
}

function roundTitle(value) {
  const text = cleanText(value);
  return FINALS_ROUND_TITLES.get(text.toLowerCase()) ?? text;
}

function nextPowerOfTwo(value) {
  return 2 ** Math.ceil(Math.log2(Math.max(1, value)));
}

async function fetchCsv(baseUrl, timeoutMs, force) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = force ? appendCacheBust(baseUrl) : baseUrl;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: force ? "reload" : "no-store"
    });

    if (!response.ok) {
      throw new Error(`Sheet returned HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function readCache(cacheKey) {
  try {
    const raw = globalThis.localStorage?.getItem(cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(cacheKey, value) {
  try {
    globalThis.localStorage?.setItem(cacheKey, JSON.stringify(value));
  } catch {
    // Cache failure should not block live bracket rendering.
  }
}

function appendCacheBust(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_=${Date.now()}`;
}

function parsePlacement(value) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return null;
  if (["first", "winner", "1st"].includes(normalized)) return 1;
  if (["second", "runner-up", "runner up", "2nd"].includes(normalized)) return 2;
  const numeric = Number.parseInt(normalized.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseScore(value) {
  const text = cleanText(value);
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isTruthyQualifier(value) {
  return TRUTHY_QUALIFIER_VALUES.has(cleanText(value).toLowerCase());
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeName(value) {
  const text = cleanText(value);
  if (!text || text.startsWith("#")) return "";
  return text;
}

function normalizeStageName(value) {
  const text = cleanText(value);
  if (text.startsWith("#")) return "";
  return text.toLowerCase() === "wildcart" ? "Wildcard" : text;
}

function namesMatch(left, right) {
  return Boolean(right) && cleanText(left).toLowerCase() === cleanText(right).toLowerCase();
}

function extractLobbyId(lobbyName) {
  const text = cleanText(lobbyName);
  const match = text.match(/([A-Z]|\d+)$/i);
  return match ? match[1].toUpperCase() : text;
}

function extractLobbyNumber(lobbyName, fallbackId) {
  const text = cleanText(lobbyName) || cleanText(fallbackId);
  const match = text.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function publicGroupName(feedConfig) {
  return cleanText(feedConfig.shortLabel ?? feedConfig.label).replace(/^Group\s+/i, "") || "Group";
}

function formatSeedPrefix(lobbyId) {
  return /^\d+$/.test(lobbyId) ? `G${lobbyId}` : lobbyId;
}

function slugify(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "match";
}
