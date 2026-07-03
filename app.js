// Copyright (c) 2026 CCI Volunteer Legion and ATLNO.exe.
// Runtime rule: render public sheet-derived qualifier data only; do not expose hidden player data.

import { tournament as fallbackTournament } from "./data/bracket-data.js?v=20260703-interactions";
import { sheetConfig } from "./data/sheet-config.js?v=20260703-interactions";
import { loadTournamentFeeds } from "./data/sheet-data.js?v=20260703-interactions";

const statusGrid = document.querySelector("#statusGrid");
const lobbyGrid = document.querySelector("#lobbyGrid");
const bracketRounds = document.querySelector("#bracketRounds");
const bracketSection = document.querySelector("#bracket");
const bracketPhase = document.querySelector("#bracketPhase");
const bracketMode = document.querySelector("#bracketMode");
const sheetStatus = document.querySelector("#sheetStatus");
const sheetUpdated = document.querySelector("#sheetUpdated");
const refreshSheetButton = document.querySelector("#refreshSheetButton");
const feedTabs = document.querySelector("#feedTabs");
const tournamentOverview = document.querySelector("#tournamentOverview");
const stageSelect = document.querySelector("#stageSelect");
const stageSelectLabel = document.querySelector('label[for="stageSelect"]');
const openSearchButton = document.querySelector("#openSearchButton");
const closeSearchButton = document.querySelector("#closeSearchButton");
const commandOverlay = document.querySelector("#commandOverlay");
const commandSearchInput = document.querySelector("#commandSearchInput");
const commandResults = document.querySelector("#commandResults");
const detailDrawer = document.querySelector("#detailDrawer");
const detailDrawerContent = document.querySelector("#detailDrawerContent");
const detailDrawerScrim = document.querySelector("#detailDrawerScrim");
const closeDetailDrawerButton = document.querySelector("#closeDetailDrawerButton");
const mobileTabBar = document.querySelector("#mobileTabBar");
const FEED_THEMES = {
  "national-finals": "finals",
  "group-titan": "titan",
  "group-nexus": "nexus",
  "group-dominion": "dominion",
  wildcard: "wildcard"
};
const stageSelections = {};
let activeFeedId = sheetConfig.feeds?.[0]?.id ?? "";
let workbookFeeds = [];
let dashboardTournament = fallbackTournament;
let syncInFlight = false;
let hasAttemptedSheetSync = false;
let activeCommandIndex = 0;
let lastFocusedElement = null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getFeedTheme(feed) {
  return FEED_THEMES[feed?.id] ?? (feed?.type === "finals" ? "finals" : "titan");
}

function applyFeedTheme(feed) {
  const theme = getFeedTheme(feed);
  document.body.dataset.feedTheme = theme;
  if (bracketSection) bracketSection.dataset.feedTheme = theme;
}

function createBroadcastHeader({ eyebrow, title, accentText = "", system = "", stats = [], route = [] }) {
  const header = createElement("header", "broadcast-header");
  const copy = createElement("div", "broadcast-header__copy");
  const kicker = createElement("span", "broadcast-header__kicker", eyebrow);
  const heading = createElement("h3");
  const statRail = createElement("dl", "broadcast-header__stats");

  heading.append(document.createTextNode(title));
  if (accentText) heading.append(createElement("span", "", ` ${accentText}`));
  copy.append(kicker, heading);
  if (system) copy.append(createElement("small", "", system));

  stats.slice(0, 4).forEach((stat) => {
    const item = createElement("div");
    item.append(createElement("dt", "", stat.label));
    item.append(createElement("dd", "", stat.value));
    statRail.append(item);
  });

  header.append(copy);
  if (statRail.childElementCount) header.append(statRail);

  if (route.length) {
    const routeRail = createElement("div", "broadcast-route");
    route.forEach((label, index) => {
      routeRail.append(createElement("span", "", label));
      if (index < route.length - 1) routeRail.append(createElement("i", "", "->"));
    });
    header.append(routeRail);
  }

  return header;
}

function getWinnerIndex(entrants) {
  const markedWinner = entrants.findIndex((entrant) => entrant.winner);
  if (markedWinner !== -1) return markedWinner;
  const scores = entrants.map((entrant) => entrant.score);
  if (scores.some((score) => typeof score !== "number")) return -1;
  if (scores[0] === scores[1]) return -1;
  return scores[0] > scores[1] ? 0 : 1;
}

function getFeedById(feedId) {
  return workbookFeeds.find((feed) => feed.id === feedId);
}

function feedKindLabel(feed) {
  if (feed?.type === "finals") return "Finals";
  if (feed?.type === "wildcard") return "Wildcard";
  return "Group";
}

function normalizeSearchText(value) {
  return String(value ?? "").toLowerCase().trim();
}

function commandLabelForPlayer(player) {
  const city = player.city ? ` / ${player.city}` : "";
  return `${player.name}${city}`;
}

function buildCommandItems() {
  const items = [];

  workbookFeeds.forEach((feed) => {
    items.push({
      type: "view",
      title: feed.label,
      meta: `${feedKindLabel(feed)} view`,
      feedId: feed.id,
      action: { type: "feed", feedId: feed.id }
    });

    if (feed.type === "finals") {
      (feed.bracket?.rounds ?? []).forEach((round) => {
        (round.matches ?? []).forEach((match) => {
          items.push({
            type: "match",
            title: match.id,
            meta: `${round.title} / ${match.label}`,
            feedId: feed.id,
            action: { type: "match", feedId: feed.id, matchId: match.id }
          });

          (match.entrants ?? []).forEach((entrant) => {
            if (entrant.pending || !entrant.name || /^awaiting/i.test(entrant.name)) return;
            items.push({
              type: "player",
              title: commandLabelForPlayer(entrant),
              meta: `${round.title} / ${match.id}`,
              feedId: feed.id,
              action: { type: "match", feedId: feed.id, matchId: match.id }
            });
          });
        });
      });
      return;
    }

    (feed.progression?.rounds ?? []).forEach((round) => {
      (round.lobbies ?? []).forEach((lobby) => {
        items.push({
          type: "lobby",
          title: lobby.id,
          meta: `${feed.shortLabel ?? feed.label} / ${round.title}`,
          feedId: feed.id,
          action: { type: "lobby", feedId: feed.id, lobbyId: lobby.id }
        });

        (lobby.players ?? []).forEach((player) => {
          if (player.pending || !player.name || /^awaiting/i.test(player.name)) return;
          items.push({
            type: "player",
            title: commandLabelForPlayer(player),
            meta: `${feed.shortLabel ?? feed.label} / ${round.title} / ${lobby.id}`,
            feedId: feed.id,
            action: { type: "lobby", feedId: feed.id, lobbyId: lobby.id }
          });
        });
      });
    });
  });

  return items;
}

function findLobbyDetails(lobbyId, feedId = "") {
  const feeds = feedId ? [getFeedById(feedId)].filter(Boolean) : workbookFeeds;
  for (const feed of feeds) {
    for (const round of feed.progression?.rounds ?? []) {
      const lobby = (round.lobbies ?? []).find((candidate) => candidate.id === lobbyId);
      if (lobby) return { feed, round, lobby };
    }
  }
  return null;
}

function findMatchDetails(matchId, feedId = "national-finals") {
  const feed = getFeedById(feedId) ?? workbookFeeds.find((candidate) => candidate.type === "finals");
  if (!feed) return null;
  for (const round of feed.bracket?.rounds ?? []) {
    const match = (round.matches ?? []).find((candidate) => candidate.id === matchId);
    if (match) return { feed, round, match };
  }
  return null;
}

function navigateCommandAction(action) {
  if (!action) return;
  activateFeed(action.feedId);
  document.querySelector("#bracket")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (action.type === "lobby") {
    window.setTimeout(() => openLobbyDrawer(action.lobbyId, action.feedId), 80);
  } else if (action.type === "match") {
    window.setTimeout(() => openMatchDrawer(action.matchId, action.feedId), 80);
  }
}

function renderStatus(items) {
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const group = createElement("div");
    group.append(createElement("dt", "", item.label));
    group.append(createElement("dd", "", item.value));
    fragment.append(group);
  });

  statusGrid.replaceChildren(fragment);
}

function renderLobbies(lobbies) {
  const fragment = document.createDocumentFragment();

  lobbies.forEach((lobby) => {
    const card = createElement("article", "lobby-card");
    const head = createElement("div", "lobby-card__head");
    head.append(createElement("span", "lobby-card__id", lobby.id));
    head.append(createElement("span", "lobby-card__status", lobby.status));

    const title = createElement("h3", "", lobby.name);
    const body = createElement("p", "", lobby.summary ?? "Public qualifier slots only");
    const players = createElement("ul", "lobby-player-list");
    const qualifiers = createElement("ul", "qualifier-list");
    const playerRows = lobby.players ?? [];
    const qualifierRows = lobby.qualifiers ?? [];

    playerRows.forEach((player) => {
      const row = createElement("li");
      const details = createElement("span", "lobby-player-list__details");
      const meta = player.rank ? `${ordinal(player.rank)}${player.qualified ? " / Qualified" : ""}` : (player.qualified ? "Qualified" : "Pending");

      row.dataset.qualified = player.qualified ? "true" : "false";
      details.append(createElement("span", "", player.name));
      if (player.city) details.append(createElement("small", "", player.city));
      row.append(createElement("strong", "", player.seed));
      row.append(details);
      row.append(createElement("em", "", meta));
      players.append(row);
    });

    qualifierRows.forEach((qualifier) => {
      const row = createElement("li");
      const details = createElement("span", "qualifier-list__details");
      details.append(createElement("span", "", qualifier.name));
      if (qualifier.city) details.append(createElement("small", "", qualifier.city));
      row.dataset.pending = qualifier.pending ? "true" : "false";
      row.append(createElement("strong", "", qualifier.placement === 1 ? "1st" : "2nd"));
      row.append(details);
      qualifiers.append(row);
    });

    card.append(head, title, body);
    if (playerRows.length) card.append(players);
    if (!playerRows.length || qualifierRows.some((qualifier) => !qualifier.pending)) card.append(qualifiers);
    fragment.append(card);
  });

  lobbyGrid.replaceChildren(fragment);
}

function renderFeedTabs(feeds) {
  if (!feedTabs) return;
  const fragment = document.createDocumentFragment();

  feeds.forEach((feed) => {
    const button = createElement("button", "feed-tab");
    const label = createElement("span", "feed-tab__label", feed.shortLabel ?? feed.label);
    const type = feed.type === "finals" ? "Main" : feed.type === "wildcard" ? "Last Chance" : "Group";
    button.type = "button";
    button.id = `tab-${feed.id}`;
    button.dataset.feedId = feed.id;
    button.dataset.theme = getFeedTheme(feed);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "bracket");
    button.setAttribute("aria-selected", feed.id === activeFeedId ? "true" : "false");
    button.setAttribute("aria-label", `${feed.label} bracket`);
    button.append(label, createElement("small", "", type));
    fragment.append(button);
  });

  feedTabs.replaceChildren(fragment);
}

function renderMobileTabBar(feeds) {
  if (!mobileTabBar) return;
  const fragment = document.createDocumentFragment();

  feeds.forEach((feed) => {
    const button = createElement("button", "mobile-tab");
    button.type = "button";
    button.dataset.feedId = feed.id;
    button.dataset.theme = getFeedTheme(feed);
    button.setAttribute("aria-current", feed.id === activeFeedId ? "page" : "false");
    button.append(createElement("span", "mobile-tab__mark", feed.shortLabel?.slice(0, 1) ?? "?"));
    button.append(createElement("strong", "", feed.shortLabel ?? feed.label));
    fragment.append(button);
  });

  mobileTabBar.replaceChildren(fragment);
}

function renderTournamentOverview(feeds, activeFeed) {
  if (!tournamentOverview) return;
  const groups = feeds.filter((feed) => feed.type === "group");
  const wildcard = feeds.find((feed) => feed.type === "wildcard");
  const finals = feeds.find((feed) => feed.type === "finals");
  const directCount = groups.reduce((count, feed) => count + (feed.meta?.directNationalCount ?? 0), 0);
  const wildcardPoolCount = wildcard?.meta?.wildcardPoolCount ?? 0;
  const finalsCount = finals?.meta?.qualifiedCount ?? 0;
  const groupTarget = groups[0]?.id ?? "group-titan";
  const finalsTarget = finals?.id ?? "national-finals";
  const steps = [
    {
      key: "groups",
      label: `${groups.length || 3} Groups`,
      detail: directCount ? `${directCount}/12 direct` : "R1-R4",
      theme: "titan",
      feedId: groupTarget,
      active: activeFeed?.type === "group"
    },
    {
      key: "wildcard",
      label: "Wildcard",
      detail: wildcardPoolCount ? `${wildcardPoolCount}/12 pool` : "12 to 4",
      theme: "wildcard",
      feedId: wildcard?.id ?? "wildcard",
      active: activeFeed?.type === "wildcard"
    },
    {
      key: "finals",
      label: "National Finals",
      detail: finalsCount ? `${finalsCount}/16 slots` : "16-player",
      theme: "finals",
      feedId: finalsTarget,
      active: activeFeed?.type === "finals"
    },
    {
      key: "champion",
      label: "Champion",
      detail: "Grand Final",
      theme: "finals",
      feedId: finalsTarget,
      active: false
    }
  ];
  const fragment = document.createDocumentFragment();

  steps.forEach((step) => {
    const button = createElement("button", "overview-step");
    button.type = "button";
    button.dataset.overviewStep = step.key;
    button.dataset.theme = step.theme;
    button.dataset.feedId = step.feedId;
    button.dataset.active = step.active ? "true" : "false";
    button.setAttribute("aria-pressed", step.active ? "true" : "false");
    button.append(createElement("strong", "", step.label));
    button.append(createElement("span", "", step.detail));
    fragment.append(button);
  });

  tournamentOverview.replaceChildren(fragment);
}

function renderSlot(entrant, winner) {
  const slot = createElement("div", "match-slot");
  const player = createElement("span", "match-slot__player");
  slot.dataset.winner = winner ? "true" : "false";
  slot.dataset.pending = entrant.pending ? "true" : "false";
  player.append(createElement("span", "match-slot__name", entrant.name));
  if (entrant.city) player.append(createElement("span", "match-slot__city", entrant.city));
  slot.append(createElement("span", "match-slot__seed", entrant.seed));
  slot.append(player);
  slot.append(createElement("span", "match-slot__score", entrant.score ?? "-"));
  return slot;
}

function renderMatch(match) {
  const winnerIndex = getWinnerIndex(match.entrants);
  const card = createElement("article", "match-card");
  card.dataset.status = match.status;
  card.dataset.matchId = match.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${match.label}, ${match.status}, best of ${match.bestOf}`);

  const meta = createElement("div", "match-card__meta");
  const metaGroup = createElement("div", "match-card__meta-group");
  const slab = createElement("div", "match-card__slab");
  const feed = createElement("div", "match-card__feed");
  metaGroup.append(createElement("code", "", match.id));
  metaGroup.append(createElement("span", "", `Bo${match.bestOf}`));
  meta.append(metaGroup);
  meta.append(createElement("span", "match-card__status", match.status));

  const header = createElement("div", "match-card__header");
  header.append(createElement("span", "match-card__label", match.label));
  header.append(createElement("span", "", match.starts));

  feed.append(createElement("span", "", "Route"));
  feed.append(createElement("strong", "", match.feed));

  card.append(header, meta);

  match.entrants.forEach((entrant, index) => {
    slab.append(renderSlot(entrant, winnerIndex === index));
  });

  card.append(slab);
  card.append(feed);
  return card;
}

function renderProgressionPlayer(player) {
  const row = createElement("li");
  const details = createElement("span", "progression-player-list__details");
  const badge = player.stateLabel ?? (player.qualified ? "Advance" : "Pending");

  row.dataset.state = player.state ?? (player.qualified ? "qualified" : "pending");
  details.append(createElement("span", "", player.name));
  if (player.city) details.append(createElement("small", "", player.city));
  row.append(createElement("strong", "", player.rank ? ordinal(player.rank) : player.seed));
  row.append(details);
  row.append(createElement("em", "", badge));
  return row;
}

function renderProgressionLobby(lobby) {
  const card = createElement("article", "progression-lobby-card");
  card.dataset.lobbyId = lobby.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${lobby.id}, ${lobby.status}`);
  const meta = createElement("div", "progression-lobby-card__meta");
  const slab = createElement("div", "progression-lobby-card__slab");
  const content = createElement("div", "progression-lobby-card__content");
  const players = createElement("ul", "progression-player-list");

  meta.append(createElement("code", "progression-lobby-card__id", lobby.id));
  meta.append(createElement("span", "progression-lobby-card__status", lobby.status));

  if (lobby.sourceName && lobby.sourceName !== lobby.name) {
    content.append(createElement("p", "progression-lobby-card__source", lobby.sourceName));
  }

  (lobby.players ?? []).forEach((player) => {
    players.append(renderProgressionPlayer(player));
  });

  if (players.childElementCount) {
    content.append(players);
  } else {
    content.append(createElement("p", "progression-lobby-card__empty", "Awaiting lobby data"));
  }

  slab.append(content);
  card.append(meta, slab);

  if ((lobby.players ?? []).some((player) => player.state === "wildcard" || player.stateLabel === "Finals")) {
    const route = createElement("div", "progression-lobby-card__route");
    route.append(createElement("span", "", "1-2 Finals"));
    route.append(createElement("span", "", "3-4 Wildcard"));
    card.append(route);
  }

  return card;
}

function roundCompletion(round) {
  const players = (round.lobbies ?? []).flatMap((lobby) => lobby.players ?? []);
  const decided = players.filter((player) => player.state && player.state !== "pending").length;
  const total = players.length || round.players || 0;
  const percent = total ? Math.round((decided / total) * 100) : 0;
  return { decided, total, percent };
}

function renderGroupProgression(progression, feed) {
  bracketPhase.textContent = progression.phase;
  bracketMode.textContent = progression.mode;
  bracketRounds.dataset.view = "group";

  const fragment = document.createDocumentFragment();
  const headerStats = (feed?.status ?? []).slice(0, 4);
  fragment.append(createBroadcastHeader({
    eyebrow: "// Legion Wars / Group Stage",
    title: progression.phase,
    accentText: "Division",
    system: "Round 4 top two -> Finals / third-fourth -> Wildcard",
    stats: headerStats,
    route: ["Round 1", "Round 2", "Round 3", "Round 4"]
  }));

  progression.rounds.forEach((round) => {
    const section = createElement("section", "progression-round");
    const head = createElement("div", "progression-round__head");
    const metrics = createElement("div", "progression-round__metrics");
    const lobbyRail = createElement("div", "progression-lobby-rail");
    const completion = roundCompletion(round);
    const progress = createElement("div", "progression-round__progress");
    const progressBar = createElement("span");

    head.append(createElement("h3", "", round.title));
    head.append(createElement("p", "", round.advance));
    progressBar.style.width = `${completion.percent}%`;
    progress.append(progressBar);
    metrics.append(createElement("span", "", `${round.players} players`));
    metrics.append(createElement("span", "", `${round.lobbies?.length ?? 0}/${round.expectedLobbies} lobbies`));
    metrics.append(createElement("strong", "", round.result));
    metrics.append(createElement("small", "", `${completion.decided}/${completion.total} decided`));
    section.append(head, progress, metrics);

    if (round.lobbies?.length) {
      round.lobbies.forEach((lobby) => {
        lobbyRail.append(renderProgressionLobby(lobby));
      });
    } else {
      const empty = createElement("article", "progression-lobby-card progression-lobby-card--empty");
      empty.append(createElement("span", "progression-lobby-card__id", `${progression.phase}_R${round.title.replace(/\D/g, "")}`));
      empty.append(createElement("p", "progression-lobby-card__empty", "Awaiting round data"));
      lobbyRail.append(empty);
    }

    section.append(lobbyRail);
    fragment.append(section);
  });

  bracketRounds.replaceChildren(fragment);
}

function renderWildcardSlot(slot) {
  const card = createElement("article", "wildcard-slot");
  card.dataset.state = slot.state ?? (slot.pending ? "pending" : "qualified");
  card.append(createElement("span", "wildcard-slot__seed", slot.seed));
  card.append(createElement("strong", "", slot.name));
  if (slot.city) card.append(createElement("small", "", slot.city));
  card.append(createElement("em", "", slot.stateLabel ?? "Pending"));
  return card;
}

function renderWildcardProgression(feed) {
  const progression = feed.progression;
  if (!progression) {
    renderBracket(feed.bracket);
    return;
  }

  bracketPhase.textContent = progression.phase;
  bracketMode.textContent = progression.mode;
  bracketRounds.dataset.view = "wildcard";

  const shell = createElement("div", "wildcard-view");
  const pool = createElement("section", "wildcard-panel wildcard-panel--pool");
  const paths = createElement("section", "wildcard-panel wildcard-panel--paths");
  const finals = createElement("section", "wildcard-panel wildcard-panel--finals");
  const poolGrid = createElement("div", "wildcard-pool-grid");
  const pathGrid = createElement("div", "wildcard-path-grid");
  const slotGrid = createElement("div", "wildcard-slot-grid");

  shell.append(createBroadcastHeader({
    eyebrow: "// Legion Wars / Last Chance",
    title: "Wildcard",
    accentText: "Pool",
    system: progression.poolCount >= progression.expectedPoolCount ? "Pool ready" : "Awaiting group Round 4 results",
    stats: [
      { label: "Pool", value: `${progression.poolCount}/${progression.expectedPoolCount}` },
      { label: "Advancing", value: "4" },
      { label: "Source", value: progression.sourceStage ?? "Wildcard" }
    ],
    route: ["Pool 12", "Top 4", "National Finals"]
  }));

  pool.append(createElement("h3", "", "12-player pool"));
  pool.append(createElement("p", "", `${progression.poolCount}/${progression.expectedPoolCount} players listed`));
  (progression.rounds?.[0]?.lobbies ?? []).forEach((lobby) => {
    poolGrid.append(renderProgressionLobby(lobby));
  });
  if (!poolGrid.childElementCount) {
    const empty = createElement("article", "progression-lobby-card progression-lobby-card--empty");
    empty.append(createElement("p", "progression-lobby-card__empty", "Awaiting Wildcard pool"));
    poolGrid.append(empty);
  }
  pool.append(poolGrid);

  paths.append(createElement("h3", "", "Bracket paths"));
  paths.append(createElement("p", "", "Pending sheet data"));
  ["Winners path", "Elimination path"].forEach((label) => {
    const card = createElement("article", "wildcard-path-card");
    card.dataset.state = "pending";
    card.append(createElement("strong", "", label));
    card.append(createElement("span", "", "Pending"));
    pathGrid.append(card);
  });
  paths.append(pathGrid);

  finals.append(createElement("h3", "", "Finals slots"));
  finals.append(createElement("p", "", "Top 4 advance"));
  (progression.finalSlots ?? []).forEach((slot) => {
    slotGrid.append(renderWildcardSlot(slot));
  });
  finals.append(slotGrid);

  shell.append(pool, paths, finals);
  bracketRounds.replaceChildren(shell);
}

function renderBracket(bracket, feed) {
  bracketPhase.textContent = bracket.phase;
  bracketMode.textContent = bracket.mode;
  bracketRounds.dataset.view = "bracket";

  const shell = createElement("div", "finals-view");
  const board = createElement("div", "finals-board");
  const matchCount = bracket.rounds.reduce((count, round) => count + round.matches.length, 0);
  shell.append(createBroadcastHeader({
    eyebrow: "// Legion Wars / Championship",
    title: "National",
    accentText: "Finals",
    system: "16-player single elimination",
    stats: [
      { label: "Phase", value: bracket.phase },
      { label: "Format", value: bracket.mode },
      { label: "Rounds", value: String(bracket.rounds.length) },
      { label: "Matches", value: String(matchCount) }
    ],
    route: ["Round of 16", "Quarterfinals", "Semifinals", "Grand Final"]
  }));

  bracket.rounds.forEach((round) => {
    const roundColumn = createElement("section", "bracket-round");
    roundColumn.setAttribute("aria-labelledby", `${round.id}-title`);
    roundColumn.dataset.roundIndex = String(bracket.rounds.indexOf(round) + 1);

    const title = createElement("h3", "", round.title);
    title.id = `${round.id}-title`;
    roundColumn.append(title);

    round.matches.forEach((match) => {
      roundColumn.append(renderMatch(match));
    });

    board.append(roundColumn);
  });

  shell.append(board);
  bracketRounds.replaceChildren(shell);
}

function renderBracketView(feed) {
  if (feed.type === "group" && feed.progression?.type === "group") {
    renderGroupProgression(feed.progression, feed);
    return;
  }

  if (feed.type === "wildcard") {
    renderWildcardProgression(feed);
    return;
  }

  renderBracket(feed.bracket, feed);
}

function openCommandPalette() {
  if (!commandOverlay || !commandSearchInput) return;
  lastFocusedElement = document.activeElement;
  commandOverlay.hidden = false;
  commandSearchInput.value = "";
  renderCommandResults("");
  window.setTimeout(() => commandSearchInput.focus(), 0);
}

function closeCommandPalette() {
  if (!commandOverlay) return;
  commandOverlay.hidden = true;
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function renderCommandResults(query) {
  if (!commandResults) return;
  const normalized = normalizeSearchText(query);
  const items = buildCommandItems();
  const filtered = normalized ?
    items.filter((item) => normalizeSearchText(`${item.title} ${item.meta} ${item.type}`).includes(normalized)) :
    items.filter((item) => item.type !== "player").slice(0, 12);
  const limited = filtered.slice(0, 24);
  const fragment = document.createDocumentFragment();
  activeCommandIndex = 0;

  if (!limited.length) {
    const empty = createElement("p", "command-empty", "No public results found");
    fragment.append(empty);
  }

  limited.forEach((item, index) => {
    const button = createElement("button", "command-item");
    button.type = "button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", index === activeCommandIndex ? "true" : "false");
    button.dataset.commandIndex = String(index);
    button.dataset.feedId = item.feedId;
    button.dataset.active = index === activeCommandIndex ? "true" : "false";
    button.append(createElement("span", "command-item__type", item.type));
    const copy = createElement("span", "command-item__copy");
    copy.append(createElement("strong", "", item.title));
    copy.append(createElement("small", "", item.meta));
    button.append(copy);
    button.addEventListener("click", () => {
      closeCommandPalette();
      navigateCommandAction(item.action);
    });
    fragment.append(button);
  });

  commandResults.replaceChildren(fragment);
}

function updateCommandActiveIndex(nextIndex) {
  if (!commandResults) return;
  const buttons = [...commandResults.querySelectorAll(".command-item")];
  if (!buttons.length) return;
  activeCommandIndex = (nextIndex + buttons.length) % buttons.length;
  buttons.forEach((button, index) => {
    button.dataset.active = index === activeCommandIndex ? "true" : "false";
    button.setAttribute("aria-selected", index === activeCommandIndex ? "true" : "false");
  });
  buttons[activeCommandIndex]?.scrollIntoView({ block: "nearest" });
}

function openActiveCommandResult() {
  if (!commandResults) return;
  const buttons = [...commandResults.querySelectorAll(".command-item")];
  const button = buttons[activeCommandIndex];
  if (button) button.click();
}

function openDetailDrawer() {
  if (!detailDrawer) return;
  detailDrawer.hidden = false;
  document.body.dataset.drawerOpen = "true";
}

function closeDetailDrawer() {
  if (!detailDrawer) return;
  detailDrawer.hidden = true;
  document.body.dataset.drawerOpen = "false";
}

function detailHeader({ kicker, title, meta }) {
  const header = createElement("header", "detail-drawer__header");
  header.append(createElement("span", "", kicker));
  const titleElement = createElement("h2", "", title);
  titleElement.id = "detailDrawerTitle";
  header.append(titleElement);
  if (meta) header.append(createElement("p", "", meta));
  return header;
}

function detailStatus(value) {
  return createElement("span", "detail-status", value);
}

function renderDetailPlayerRow(player) {
  const row = createElement("li", "detail-player-row");
  row.dataset.state = player.state ?? (player.qualified ? "qualified" : "pending");
  const rank = player.rank ? ordinal(player.rank) : player.seed;
  row.append(createElement("strong", "", rank));
  const copy = createElement("span", "detail-player-row__copy");
  copy.append(createElement("span", "", player.name));
  if (player.city) copy.append(createElement("small", "", player.city));
  row.append(copy);
  row.append(detailStatus(player.stateLabel ?? (player.qualified ? "Qualified" : "Pending")));
  return row;
}

function openLobbyDrawer(lobbyId, feedId = "") {
  const details = findLobbyDetails(lobbyId, feedId);
  if (!details || !detailDrawerContent) return;
  const { feed, round, lobby } = details;
  const fragment = document.createDocumentFragment();
  const route = round.title === "Round 4" ? "1st/2nd Finals / 3rd/4th Wildcard" : "Top two advance";
  fragment.append(detailHeader({
    kicker: `${feed.shortLabel ?? feed.label} / ${round.title}`,
    title: lobby.id,
    meta: route
  }));

  const summary = createElement("div", "detail-summary");
  summary.append(createElement("span", "", "Status"));
  summary.append(detailStatus(lobby.status));
  summary.append(createElement("span", "", "Players"));
  summary.append(createElement("strong", "", String((lobby.players ?? []).length)));
  fragment.append(summary);

  const list = createElement("ul", "detail-player-list");
  (lobby.players ?? []).forEach((player) => list.append(renderDetailPlayerRow(player)));
  fragment.append(list);

  if (round.title === "Round 4") {
    const note = createElement("p", "detail-note", "Round 4 sends first and second to National Finals, third and fourth to Wildcard.");
    fragment.append(note);
  }

  detailDrawerContent.replaceChildren(fragment);
  openDetailDrawer();
}

function renderDetailEntrant(entrant, winner) {
  const row = createElement("li", "detail-entrant-row");
  row.dataset.winner = winner ? "true" : "false";
  row.dataset.pending = entrant.pending ? "true" : "false";
  row.append(createElement("strong", "", entrant.seed));
  const copy = createElement("span", "detail-player-row__copy");
  copy.append(createElement("span", "", entrant.name));
  if (entrant.city) copy.append(createElement("small", "", entrant.city));
  row.append(copy);
  row.append(createElement("em", "", entrant.score ?? "-"));
  return row;
}

function openMatchDrawer(matchId, feedId = "national-finals") {
  const details = findMatchDetails(matchId, feedId);
  if (!details || !detailDrawerContent) return;
  const { round, match } = details;
  const winnerIndex = getWinnerIndex(match.entrants);
  const fragment = document.createDocumentFragment();
  fragment.append(detailHeader({
    kicker: `National Finals / ${round.title}`,
    title: match.id,
    meta: `${match.label} / Best of ${match.bestOf}`
  }));

  const summary = createElement("div", "detail-summary");
  summary.append(createElement("span", "", "Status"));
  summary.append(detailStatus(match.status));
  summary.append(createElement("span", "", "Route"));
  summary.append(createElement("strong", "", match.feed));
  fragment.append(summary);

  const list = createElement("ul", "detail-player-list");
  match.entrants.forEach((entrant, index) => {
    list.append(renderDetailEntrant(entrant, winnerIndex === index));
  });
  fragment.append(list);

  const note = createElement("p", "detail-note", round.title === "Grand Final" ? "Winner becomes Legion Wars champion." : "Winner advances to the next National Finals round.");
  fragment.append(note);

  detailDrawerContent.replaceChildren(fragment);
  openDetailDrawer();
}

function renderSheetMeta(meta) {
  if (!sheetStatus || !sheetUpdated) return;
  sheetStatus.textContent = meta.message;
  sheetStatus.dataset.mode = meta.mode;
  sheetUpdated.textContent = meta.fetchedAt ? `Last sync: ${formatDate(meta.fetchedAt)}` : "Last sync: not connected";
}

function renderFatalError(error) {
  renderTournament(fallbackTournament, {
    mode: "fallback",
    message: `Fallback bracket loaded. Refresh failed: ${error.message}`,
    fetchedAt: null
  });
}

function renderStageSelect(tournament) {
  if (!stageSelect) return;
  const stages = tournament.meta?.availableStages ?? [];
  const hasMultipleStages = stages.length > 1 && !["group", "wildcard"].includes(tournament.type);
  stageSelect.hidden = !hasMultipleStages;
  if (stageSelectLabel) stageSelectLabel.hidden = !hasMultipleStages;
  stageSelect.replaceChildren();

  stages.forEach((stage) => {
    const option = createElement("option", "", `${stage.name} (${stage.qualifierCount}/${stage.lobbyCount * 2})`);
    option.value = stage.name;
    option.selected = stage.name === (stageSelections[tournament.id] ?? tournament.meta?.stage);
    stageSelect.append(option);
  });

  if (tournament.meta?.stage) {
    stageSelections[tournament.id] = tournament.meta.stage;
  }
}

function renderActiveFeed(meta = { mode: "fallback", message: "Using fallback data.", fetchedAt: null }) {
  const activeFeed = workbookFeeds.find((feed) => feed.id === activeFeedId) ?? workbookFeeds[0] ?? dashboardTournament;
  if (activeFeed?.id) activeFeedId = activeFeed.id;

  applyFeedTheme(activeFeed);
  renderStatus(activeFeed.status ?? dashboardTournament.status);
  renderFeedTabs(workbookFeeds);
  renderMobileTabBar(workbookFeeds);
  renderTournamentOverview(workbookFeeds, activeFeed);
  renderLobbies(activeFeed.lobbies ?? []);
  renderBracketView(activeFeed);
  renderStageSelect(activeFeed);
  renderSheetMeta(meta);
  buildCommandItems();
}

function renderTournament(tournament, meta = { mode: "fallback", message: "Using fallback data.", fetchedAt: null }) {
  dashboardTournament = tournament;
  workbookFeeds = [tournament];
  activeFeedId = tournament.id ?? activeFeedId;
  renderActiveFeed(meta);
}

async function syncSheet({ force = false } = {}) {
  if (!sheetConfig.enabled) return;
  if (syncInFlight) return;
  syncInFlight = true;

  try {
    if (force && refreshSheetButton) {
      refreshSheetButton.disabled = true;
      refreshSheetButton.textContent = "Refreshing...";
    }

    if (force || !hasAttemptedSheetSync) {
      renderSheetMeta({
        mode: "loading",
        message: force ? "Refreshing brackets..." : "Loading brackets...",
        fetchedAt: null
      });
    }

    const result = await loadTournamentFeeds({
      config: sheetConfig,
      fallbackTournament,
      force,
      stageSelections
    });

    dashboardTournament = result.tournament;
    workbookFeeds = result.feeds;
    if (!workbookFeeds.some((feed) => feed.id === activeFeedId)) {
      activeFeedId = workbookFeeds[0]?.id ?? activeFeedId;
    }
    renderActiveFeed(result.meta);
    hasAttemptedSheetSync = true;
  } finally {
    syncInFlight = false;

    if (refreshSheetButton) {
      refreshSheetButton.disabled = false;
      refreshSheetButton.textContent = "Refresh";
    }
  }
}

function startAutoRefresh() {
  if (!sheetConfig.enabled || !Number.isFinite(sheetConfig.autoRefreshIntervalMs)) return;
  if (sheetConfig.autoRefreshIntervalMs <= 0) return;

  const intervalMs = Math.max(sheetConfig.autoRefreshIntervalMs, sheetConfig.minFetchIntervalMs);

  window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (navigator.onLine === false) return;
    syncSheet({ force: false }).catch(renderFatalError);
  }, intervalMs);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncSheet({ force: false }).catch(renderFatalError);
    }
  });
}

function activateFeed(feedId) {
  if (!feedId) return;
  activeFeedId = feedId;
  const selectedFeed = workbookFeeds.find((feed) => feed.id === activeFeedId);
  renderActiveFeed({
    mode: hasAttemptedSheetSync ? "cached" : "fallback",
    message: hasAttemptedSheetSync ? "Showing selected bracket." : "Fallback bracket loaded.",
    fetchedAt: selectedFeed?.meta?.fetchedAt ?? null
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function ordinal(value) {
  const number = Number(value);
  if (!Number.isInteger(number)) return "";
  const suffix = number % 10 === 1 && number % 100 !== 11 ? "st" :
    number % 10 === 2 && number % 100 !== 12 ? "nd" :
    number % 10 === 3 && number % 100 !== 13 ? "rd" : "th";
  return `${number}${suffix}`;
}

renderTournament(fallbackTournament, {
  mode: "fallback",
  message: "Loading brackets...",
  fetchedAt: null
});

refreshSheetButton?.addEventListener("click", () => {
  syncSheet({ force: true }).catch(renderFatalError);
});

feedTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-feed-id]");
  if (!button) return;
  activateFeed(button.dataset.feedId);
});

mobileTabBar?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-feed-id]");
  if (!button) return;
  activateFeed(button.dataset.feedId);
  document.querySelector("#bracket")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

tournamentOverview?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-feed-id]");
  if (!button) return;
  activateFeed(button.dataset.feedId);
});

bracketRounds?.addEventListener("click", (event) => {
  const matchCard = event.target.closest("[data-match-id]");
  if (matchCard) {
    openMatchDrawer(matchCard.dataset.matchId, activeFeedId);
    return;
  }

  const lobbyCard = event.target.closest("[data-lobby-id]");
  if (lobbyCard) {
    openLobbyDrawer(lobbyCard.dataset.lobbyId, activeFeedId);
  }
});

bracketRounds?.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  const card = event.target.closest("[data-match-id], [data-lobby-id]");
  if (!card) return;
  event.preventDefault();
  if (card.dataset.matchId) {
    openMatchDrawer(card.dataset.matchId, activeFeedId);
  } else if (card.dataset.lobbyId) {
    openLobbyDrawer(card.dataset.lobbyId, activeFeedId);
  }
});

stageSelect?.addEventListener("change", (event) => {
  if (activeFeedId) stageSelections[activeFeedId] = event.target.value;
  syncSheet({ force: false }).catch(renderFatalError);
});

openSearchButton?.addEventListener("click", openCommandPalette);
closeSearchButton?.addEventListener("click", closeCommandPalette);
commandOverlay?.addEventListener("click", (event) => {
  if (event.target === commandOverlay) closeCommandPalette();
});
commandSearchInput?.addEventListener("input", (event) => {
  renderCommandResults(event.target.value);
});
commandSearchInput?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    updateCommandActiveIndex(activeCommandIndex + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    updateCommandActiveIndex(activeCommandIndex - 1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    openActiveCommandResult();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeCommandPalette();
  }
});
detailDrawerScrim?.addEventListener("click", closeDetailDrawer);
closeDetailDrawerButton?.addEventListener("click", closeDetailDrawer);

document.addEventListener("keydown", (event) => {
  const typingTarget = event.target instanceof HTMLElement &&
    ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommandPalette();
    return;
  }
  if (event.key === "/" && !typingTarget && commandOverlay?.hidden) {
    event.preventDefault();
    openCommandPalette();
    return;
  }
  if (event.key === "Escape") {
    if (!commandOverlay?.hidden) closeCommandPalette();
    if (!detailDrawer?.hidden) closeDetailDrawer();
  }
});

syncSheet().catch(renderFatalError);
startAutoRefresh();
