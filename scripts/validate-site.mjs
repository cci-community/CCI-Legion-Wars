import { access, readFile } from "node:fs/promises";
import { tournament } from "../data/bracket-data.js";
import { sheetConfig } from "../data/sheet-config.js";
import {
  buildFinalsFeedFromCsv,
  buildGroupFeedFromCsv,
  buildTournamentFromSheet,
  loadTournamentFeeds,
  parseCsv
} from "../data/sheet-data.js";

const root = new URL("../", import.meta.url);
const indexHtml = await readFile(new URL("index.html", root), "utf8");
const appJs = await readFile(new URL("app.js", root), "utf8");
const sampleGroupCsv = await readFile(new URL("scripts/fixtures/sample-sheet.csv", root), "utf8");
const sampleFinalsCsv = await readFile(new URL("scripts/fixtures/sample-finals.csv", root), "utf8");
const readmeDoc = await readFile(new URL("README.md", root), "utf8");
const copyrightDoc = await readFile(new URL("docs/COPYRIGHT_AND_RULESET.md", root), "utf8");
const sheetSchemaDoc = await readFile(new URL("docs/SHEET_SCHEMA.md", root), "utf8");
const securityDoc = await readFile(new URL("docs/SECURITY.md", root), "utf8");
const maintenanceDoc = await readFile(new URL("docs/MAINTENANCE.md", root), "utf8");
const deploymentAuditDoc = await readFile(new URL("docs/DEPLOYMENT_READINESS_AUDIT.md", root), "utf8");
const envExample = await readFile(new URL(".env.example", root), "utf8");
const deployWorkflow = await readFile(new URL(".github/workflows/firebase-hosting.yml", root), "utf8");
const firebaseConfig = JSON.parse(await readFile(new URL("firebase.json", root), "utf8"));
const errors = [];

const requiredIds = [
  "statusGrid",
  "lobbyGrid",
  "bracketRounds",
  "bracketPhase",
  "bracketMode",
  "sheetStatus",
  "sheetUpdated",
  "refreshSheetButton",
  "feedTabs",
  "stageSelect"
];

for (const id of requiredIds) {
  if (!indexHtml.includes(`id="${id}"`)) {
    errors.push(`Missing #${id} mount point in index.html`);
  }
}

if (indexHtml.includes("<iframe") || indexHtml.includes("docs.google.com/spreadsheets")) {
  errors.push("Public page must render bracket UI, not embed the raw Google Sheet.");
}

for (const blockedCopy of ["Discord", "broadcast", "staff-only", "Player Details", "Master Sheet", "phone", "email"]) {
  if (indexHtml.toLowerCase().includes(blockedCopy.toLowerCase())) {
    errors.push(`Public page must not include blocked/internal copy: ${blockedCopy}`);
  }
}

if (indexHtml.includes("rulesList") || appJs.includes("rulesList") || appJs.includes("renderRules")) {
  errors.push("Public homepage must not render an internal rules/planning section.");
}

if (!indexHtml.includes('type="module" src="./app.js"')) {
  errors.push("index.html must load app.js as an ES module");
}

const requiredCopyrightFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "data/bracket-data.js",
  "data/sheet-config.js",
  "data/sheet-data.js",
  "scripts/configure-sheet.mjs",
  "scripts/generate-rules-pdf.py"
];

for (const file of requiredCopyrightFiles) {
  const content = await readFile(new URL(file, root), "utf8");
  if (!content.includes("Copyright (c) 2026 CCI Volunteer Legion")) {
    errors.push(`${file} must carry the project copyright notice`);
  }
}

if (!copyrightDoc.includes("Player Data Rules") || !copyrightDoc.includes("Enforcement in Code")) {
  errors.push("COPYRIGHT_AND_RULESET.md must include player data and code enforcement rules");
}

if (!sheetSchemaDoc.includes("Public Workbook Feeds") || !sheetSchemaDoc.includes("National Finals")) {
  errors.push("SHEET_SCHEMA.md must document the multi-feed workbook and National Finals schema");
}

if (!sheetSchemaDoc.includes("Do Not Consume") || !sheetSchemaDoc.includes("Player Details")) {
  errors.push("SHEET_SCHEMA.md must document excluded private tabs.");
}

if (!readmeDoc.includes("Folder Structure") || !readmeDoc.includes("Google Sheets Setup")) {
  errors.push("README.md must document folder structure and Google Sheets setup");
}

if (!readmeDoc.includes("Environment Setup") || !readmeDoc.includes("npm run config:sheet")) {
  errors.push("README.md must document environment setup and config generation");
}

if (!securityDoc.includes("Hosting Headers") || !securityDoc.includes("Public Data Boundary")) {
  errors.push("SECURITY.md must document hosting headers and public data boundary");
}

if (!maintenanceDoc.includes("During The Event") || !maintenanceDoc.includes("Changing Workbook Feeds")) {
  errors.push("MAINTENANCE.md must document event operations and workbook feed changes");
}

if (!deploymentAuditDoc.includes("Remaining Live Deploy Requirements") || !deploymentAuditDoc.includes("Not Complete Until")) {
  errors.push("DEPLOYMENT_READINESS_AUDIT.md must document remaining deploy requirements and completion boundary");
}

for (const envName of [
  "PUBLIC_GOOGLE_SHEET_WORKBOOK_ID",
  "PUBLIC_TITAN_GID",
  "PUBLIC_NEXUS_GID",
  "PUBLIC_DOMINION_GID",
  "PUBLIC_WILDCARD_GID",
  "PUBLIC_FINALS_GID",
  "PUBLIC_SHEET_CACHE_MS",
  "PUBLIC_SHEET_AUTO_REFRESH_MS"
]) {
  if (!envExample.includes(envName)) {
    errors.push(`.env.example must document ${envName}`);
  }
}

validateSheetConfig();

if (!Number.isInteger(sheetConfig.minFetchIntervalMs) || sheetConfig.minFetchIntervalMs <= 0) {
  errors.push("sheetConfig.minFetchIntervalMs must be a positive integer");
}

if (!Number.isInteger(sheetConfig.autoRefreshIntervalMs) || sheetConfig.autoRefreshIntervalMs <= 0) {
  errors.push("sheetConfig.autoRefreshIntervalMs must be a positive integer");
}

if (!appHasAutoRefresh()) {
  errors.push("app.js must include manual and automatic sheet refresh behavior");
}

if (!deployWorkflow.includes("FIREBASE_HOSTING_TARGET") || deployWorkflow.includes("FIREBASE_SITE_ID")) {
  errors.push("Firebase deploy workflow must use FIREBASE_HOSTING_TARGET for optional non-default Hosting targets");
}

const flattenedHeaders = (firebaseConfig.hosting?.headers ?? []).flatMap((entry) => entry.headers ?? []);
const requiredHostingHeaders = [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options"
];

for (const header of requiredHostingHeaders) {
  if (!flattenedHeaders.some((candidate) => candidate.key === header)) {
    errors.push(`firebase.json must define ${header}`);
  }
}

const csp = flattenedHeaders.find((header) => header.key === "Content-Security-Policy")?.value ?? "";
if (!csp.includes("connect-src") || !csp.includes("docs.google.com") || !csp.includes("googleusercontent.com")) {
  errors.push("Content-Security-Policy must allow the published Google Sheet CSV domains");
}

try {
  await access(new URL("output/pdf/cci-legion-wars-copyright-ruleset.pdf", root));
} catch {
  errors.push("Ruleset PDF artifact is missing; run npm run pdf:rules");
}

const sheetRows = parseCsv(sampleGroupCsv);
if (sheetRows.length !== 7) {
  errors.push(`Sample sheet parser expected 7 rows, received ${sheetRows.length}`);
}

const liveGroup = buildTournamentFromSheet(sampleGroupCsv, tournament, new Date("2026-07-03T00:00:00.000Z"));
const selectedGroup = buildTournamentFromSheet(sampleGroupCsv, tournament, new Date("2026-07-03T00:00:00.000Z"), "Round of 16");
const finalsFeed = buildFinalsFeedFromCsv(sampleFinalsCsv, finalsConfig(), tournament, new Date("2026-07-03T00:00:00.000Z"));
const wildcardTypoFeed = buildGroupFeedFromCsv(
  "Stage,Lobby,Player 1,City,Rank,Qualified,Player 2,City,Rank,Qualified\nWildcart,Lobby 1,Asha Rao,Delhi,1,YES,Dev Iyer,Mumbai,2,YES\n",
  { id: "wildcard", label: "Wildcard", shortLabel: "Wildcard", type: "wildcard", gid: "1564963263" },
  tournament,
  new Date("2026-07-03T00:00:00.000Z")
);
const roundFourGroup = buildGroupFeedFromCsv(
  [
    "Stage,Lobby,Player 1,City,Rank,Qualified,Player 2,City,Rank,Qualified,Player 3,City,Rank,Qualified,Player 4,City,Rank,Qualified",
    "Round of 64,Lobby 1,Asha Rao,Delhi,1,YES,Dev Iyer,Mumbai,2,YES,Karan Gill,Pune,3,,Neel Shah,Ahmedabad,4,",
    "Round of 8,Lobby 1,Asha Rao,Delhi,1,YES,Dev Iyer,Mumbai,2,YES,Karan Gill,Pune,3,,Neel Shah,Ahmedabad,4,",
    ",Lobby 2,Zoya Khan,Hyderabad,1,YES,Tara Das,Goa,2,YES,Arjun Menon,Kochi,3,,Kabir Lal,Jaipur,4,"
  ].join("\n"),
  { id: "group-route", label: "Group Route", shortLabel: "Route", type: "group", gid: "1" },
  tournament,
  new Date("2026-07-03T00:00:00.000Z")
);
const derivedWorkbook = await loadTournamentFeeds({
  config: {
    enabled: true,
    cacheKey: "cci-legion-wars:test-derived-wildcard",
    minFetchIntervalMs: 1,
    requestTimeoutMs: 8000,
    feeds: [
      {
        id: "national-finals",
        label: "National Finals",
        shortLabel: "Finals",
        type: "finals",
        gid: "126700734",
        finalistSlots: 16,
        csvUrl: dataCsv(sampleFinalsCsv)
      },
      {
        id: "group-titan",
        label: "Group Titan Bracket",
        shortLabel: "Titan",
        type: "group",
        gid: "1994318444",
        csvUrl: dataCsv(roundFourRouteCsv("Titan"))
      },
      {
        id: "group-nexus",
        label: "Group Nexus Bracket",
        shortLabel: "Nexus",
        type: "group",
        gid: "612483539",
        csvUrl: dataCsv(roundFourRouteCsv("Nexus"))
      },
      {
        id: "group-dominion",
        label: "Group Dominion Bracket",
        shortLabel: "Dominion",
        type: "group",
        gid: "945411688",
        csvUrl: dataCsv(roundFourRouteCsv("Dominion"))
      },
      {
        id: "wildcard",
        label: "Wildcard",
        shortLabel: "Wildcard",
        type: "wildcard",
        gid: "1564963263",
        csvUrl: dataCsv("Stage,Lobby,Player 1,City,Rank,Qualified\nWildcard,Lobby 1,,,,")
      }
    ]
  },
  fallbackTournament: tournament
});

validateTournament(tournament, "fallback");
validateTournament(liveGroup, "sheet-derived group");
validateTournament(selectedGroup, "selected-stage group");
validateTournament(finalsFeed, "finals feed");
validateTournament(wildcardTypoFeed, "wildcard typo feed");
validateTournament(roundFourGroup, "round-four group route");

if (liveGroup.meta.stage !== "Quarterfinals") {
  errors.push(`Group fixture expected active stage Quarterfinals, received ${liveGroup.meta.stage}`);
}

if (liveGroup.meta.availableStages.length !== 2) {
  errors.push(`Group fixture expected two stages, received ${liveGroup.meta.availableStages.length}`);
}

if (selectedGroup.meta.stage !== "Round of 16") {
  errors.push(`Requested stage selection failed; received ${selectedGroup.meta.stage}`);
}

if (selectedGroup.meta.qualifiedCount !== 8) {
  errors.push(`Selected group fixture expected 8 qualifiers, received ${selectedGroup.meta.qualifiedCount}`);
}

if (!selectedGroup.status.some((item) => item.label === "Route" && item.value.includes("Top 4 / 5-8"))) {
  errors.push("Group feeds must show the direct finals / wildcard route in status cards");
}

if (selectedGroup.bracket.mode !== "Round of 8 decides Finals + Wildcard") {
  errors.push(`Group bracket mode must explain the finals/wildcard route, received ${selectedGroup.bracket.mode}`);
}

if (roundFourGroup.meta.routeStage !== "Round of 8") {
  errors.push(`Round Four route source expected Round of 8, received ${roundFourGroup.meta.routeStage}`);
}

if (roundFourGroup.meta.directNationalCount !== 4 || roundFourGroup.meta.wildcardCount !== 4) {
  errors.push(`Round Four route expected 4 direct and 4 wildcard candidates, received ${roundFourGroup.meta.directNationalCount}/${roundFourGroup.meta.wildcardCount}`);
}

const derivedWildcard = derivedWorkbook.feeds.find((feed) => feed.id === "wildcard");
if (!derivedWildcard?.meta?.derivedFromGroups) {
  errors.push("Wildcard feed must derive its 12-player pool from group Round Four candidates when the Wildcard tab is empty");
}

if (derivedWildcard?.meta?.wildcardPoolCount !== 12) {
  errors.push(`Derived Wildcard pool expected 12 players, received ${derivedWildcard?.meta?.wildcardPoolCount}`);
}

if (derivedWildcard?.lobbies?.length !== 3) {
  errors.push(`Derived Wildcard pool expected one card per group, received ${derivedWildcard?.lobbies?.length}`);
}

if (liveGroup.lobbies.some((lobby) => lobby.qualifiers.length !== 2)) {
  errors.push("Every group-derived lobby must expose exactly two qualifier slots");
}

if (!selectedGroup.lobbies[0]?.players?.some((player) => player.name === "Asha Rao" && player.city === "Delhi")) {
  errors.push("Group parser must preserve public lobby player names and city/region values");
}

if (!liveGroup.bracket.rounds[0].matches[0].entrants[0].name.includes("Asha")) {
  errors.push("Group-derived bracket did not place first qualifiers into the first round");
}

if (finalsFeed.bracket.rounds[0].matches[0].status !== "final") {
  errors.push("Finals parser must mark matches with Winner values as final");
}

if (!finalsFeed.bracket.rounds[0].matches[0].entrants[0].winner) {
  errors.push("Finals parser must preserve winner state from the Winner column");
}

if (wildcardTypoFeed.meta.stage !== "Wildcard") {
  errors.push("Wildcard parser must normalize the current Wildcart typo");
}

function validateSheetConfig() {
  const expectedFeeds = new Map([
    ["national-finals", { type: "finals", gid: "126700734" }],
    ["group-titan", { type: "group", gid: "1994318444" }],
    ["group-nexus", { type: "group", gid: "612483539" }],
    ["group-dominion", { type: "group", gid: "945411688" }],
    ["wildcard", { type: "wildcard", gid: "1564963263" }]
  ]);

  if (!Array.isArray(sheetConfig.feeds) || sheetConfig.feeds.length !== expectedFeeds.size) {
    errors.push(`sheetConfig.feeds must define ${expectedFeeds.size} public feeds`);
    return;
  }

  for (const [id, expected] of expectedFeeds) {
    const feed = sheetConfig.feeds.find((candidate) => candidate.id === id);
    if (!feed) {
      errors.push(`sheetConfig.feeds missing ${id}`);
      continue;
    }
    if (feed.type !== expected.type) errors.push(`${id} must use ${expected.type} parser mode`);
    if (feed.gid !== expected.gid) errors.push(`${id} gid expected ${expected.gid}, received ${feed.gid}`);
    if (!feed.csvUrl.includes(sheetConfig.workbookId) || !feed.csvUrl.includes(`gid=${feed.gid}`)) {
      errors.push(`${id} csvUrl must point to its published workbook gid`);
    }
  }
}

function finalsConfig() {
  return sheetConfig.feeds.find((feed) => feed.id === "national-finals") ?? {
    id: "national-finals",
    label: "National Finals",
    type: "finals",
    gid: "126700734",
    finalistSlots: 16
  };
}

function dataCsv(csvText) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`;
}

function roundFourRouteCsv(prefix) {
  return [
    "Stage,Lobby,Player 1,City,Rank,Qualified,Player 2,City,Rank,Qualified,Player 3,City,Rank,Qualified,Player 4,City,Rank,Qualified",
    `Round of 8,Lobby 1,${prefix} A,Delhi,1,YES,${prefix} B,Mumbai,2,YES,${prefix} C,Pune,3,,${prefix} D,Ahmedabad,4,`,
    `,Lobby 2,${prefix} E,Hyderabad,1,YES,${prefix} F,Goa,2,YES,${prefix} G,Kochi,3,,${prefix} H,Jaipur,4,`
  ].join("\n");
}

function appHasAutoRefresh() {
  return indexHtml.includes("refreshSheetButton") &&
    appJs.includes("startAutoRefresh") &&
    appJs.includes("autoRefreshIntervalMs") &&
    appJs.includes("visibilityState") &&
    appJs.includes("syncInFlight");
}

function validateTournament(candidate, label) {
  if (!Array.isArray(candidate.bracket.rounds) || candidate.bracket.rounds.length < 2) {
    errors.push(`${label}: bracket must include at least two rounds`);
    return;
  }

  const matchIds = new Set();
  const initialSeeds = new Set();
  const firstRound = candidate.bracket.rounds[0];

  for (const round of candidate.bracket.rounds) {
    if (!round.id || !round.title) errors.push(`${label}: every round needs id and title`);

    for (const match of round.matches) {
      if (matchIds.has(match.id)) errors.push(`${label}: duplicate match id: ${match.id}`);
      matchIds.add(match.id);

      if (match.entrants.length !== 2) errors.push(`${label}: ${match.id} must have exactly two entrants`);
      if (![3, 5, 7].includes(match.bestOf)) errors.push(`${label}: ${match.id} has unsupported bestOf value`);
      if (!["ready", "pending", "live", "final"].includes(match.status)) {
        errors.push(`${label}: ${match.id} has invalid status: ${match.status}`);
      }

      for (const entrant of match.entrants) {
        if (!entrant.seed || !entrant.name) errors.push(`${label}: ${match.id} has incomplete entrant data`);
        if (entrant.score !== null && (!Number.isInteger(entrant.score) || entrant.score < 0)) {
          errors.push(`${label}: ${match.id} has invalid score for ${entrant.seed}`);
        }
      }
    }
  }

  if (!label.includes("finals")) {
    for (const match of firstRound.matches) {
      for (const entrant of match.entrants) {
        if (initialSeeds.has(entrant.seed)) errors.push(`${label}: duplicate first-round seed: ${entrant.seed}`);
        initialSeeds.add(entrant.seed);
      }
    }
  }

  if (firstRound.matches.length < 1) {
    errors.push(`${label}: expected at least one first-round match`);
  }

  if (candidate.lobbies.length < 1) {
    errors.push(`${label}: expected at least one qualifier/finalist card`);
  }

  for (const lobby of candidate.lobbies) {
    if (lobby.qualifiers.length !== 2) errors.push(`${label}: ${lobby.name} must expose two slots`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Site validation passed.");
