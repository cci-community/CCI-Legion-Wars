// Copyright (c) 2026 CCI Volunteer Legion and ATLNO.exe.
// Runtime rule: render public sheet-derived qualifier data only; do not expose hidden player data.

import { tournament as fallbackTournament } from "./data/bracket-data.js";
import { sheetConfig } from "./data/sheet-config.js";
import { loadTournamentFeeds } from "./data/sheet-data.js";

const statusGrid = document.querySelector("#statusGrid");
const lobbyGrid = document.querySelector("#lobbyGrid");
const bracketRounds = document.querySelector("#bracketRounds");
const bracketPhase = document.querySelector("#bracketPhase");
const bracketMode = document.querySelector("#bracketMode");
const sheetStatus = document.querySelector("#sheetStatus");
const sheetUpdated = document.querySelector("#sheetUpdated");
const refreshSheetButton = document.querySelector("#refreshSheetButton");
const feedTabs = document.querySelector("#feedTabs");
const stageSelect = document.querySelector("#stageSelect");
const stageSelectLabel = document.querySelector('label[for="stageSelect"]');
const stageSelections = {};
let activeFeedId = sheetConfig.feeds?.[0]?.id ?? "";
let workbookFeeds = [];
let dashboardTournament = fallbackTournament;
let syncInFlight = false;
let hasAttemptedSheetSync = false;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getWinnerIndex(entrants) {
  const markedWinner = entrants.findIndex((entrant) => entrant.winner);
  if (markedWinner !== -1) return markedWinner;
  const scores = entrants.map((entrant) => entrant.score);
  if (scores.some((score) => typeof score !== "number")) return -1;
  if (scores[0] === scores[1]) return -1;
  return scores[0] > scores[1] ? 0 : 1;
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
    const button = createElement("button", "feed-tab", feed.shortLabel ?? feed.label);
    button.type = "button";
    button.id = `tab-${feed.id}`;
    button.dataset.feedId = feed.id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "bracket");
    button.setAttribute("aria-selected", feed.id === activeFeedId ? "true" : "false");
    fragment.append(button);
  });

  feedTabs.replaceChildren(fragment);
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
  card.setAttribute("aria-label", `${match.label}, ${match.status}, best of ${match.bestOf}`);

  const header = createElement("div", "match-card__header");
  header.append(createElement("span", "match-card__label", match.label));
  header.append(createElement("span", "match-card__status", match.status));

  const meta = createElement("div", "match-card__meta", `Best of ${match.bestOf} / ${match.starts}`);
  const feed = createElement("div", "match-card__feed");
  feed.append(createElement("span", "", "Route"));
  feed.append(createElement("strong", "", match.feed));

  card.append(header, meta);

  match.entrants.forEach((entrant, index) => {
    card.append(renderSlot(entrant, winnerIndex === index));
  });

  card.append(feed);
  return card;
}

function renderBracket(bracket) {
  bracketPhase.textContent = bracket.phase;
  bracketMode.textContent = bracket.mode;

  const fragment = document.createDocumentFragment();

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

    fragment.append(roundColumn);
  });

  bracketRounds.replaceChildren(fragment);
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
  const hasMultipleStages = stages.length > 1;
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

  renderStatus(activeFeed.status ?? dashboardTournament.status);
  renderFeedTabs(workbookFeeds);
  renderLobbies(activeFeed.lobbies ?? []);
  renderBracket(activeFeed.bracket);
  renderStageSelect(activeFeed);
  renderSheetMeta(meta);
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
  activeFeedId = button.dataset.feedId;
  renderActiveFeed({
    mode: hasAttemptedSheetSync ? "cached" : "fallback",
    message: hasAttemptedSheetSync ? "Showing selected bracket." : "Fallback bracket loaded.",
    fetchedAt: workbookFeeds.find((feed) => feed.id === activeFeedId)?.meta?.fetchedAt ?? null
  });
});

stageSelect?.addEventListener("change", (event) => {
  if (activeFeedId) stageSelections[activeFeedId] = event.target.value;
  syncSheet({ force: false }).catch(renderFatalError);
});

syncSheet().catch(renderFatalError);
startAutoRefresh();
