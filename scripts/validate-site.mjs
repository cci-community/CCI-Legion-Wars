import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFinalsFeedFromCsv, buildGroupFeedFromCsv } from "../src/data/sheet-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csvRows = (rows) => rows.map((row) => row.map(csvCell).join(",")).join("\n");

for (const required of [
  "index.html",
  "src/main.tsx",
  "src/routes/index.tsx",
  "src/lib/live-tournament-data.ts",
  "src/lib/tournament-data.ts",
  "src/data/sheet-config.js",
  "src/data/sheet-data.js",
  "firebase.json",
]) {
  if (!exists(required)) errors.push(`Missing required migration file: ${required}`);
}

for (const obsolete of ["bun.lock", "bunfig.toml", "src/lib/lovable-error-reporting.ts"]) {
  if (exists(obsolete))
    errors.push(`Remove obsolete production-facing Lovable/Bun artifact: ${obsolete}`);
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.build || !packageJson.scripts?.check) {
  errors.push("package.json must expose build and check scripts");
}
if (packageJson.dependencies?.["@tanstack/react-start"]) {
  errors.push("Static Firebase SPA must not depend on TanStack Start server runtime");
}

const firebaseJson = JSON.parse(read("firebase.json"));
if (firebaseJson.hosting?.public !== "dist") {
  errors.push("Firebase Hosting must deploy the Vite dist directory");
}
const hostingRewrites = firebaseJson.hosting?.rewrites ?? [];
if (!hostingRewrites.some((rewrite) => rewrite.destination === "/index.html")) {
  errors.push("Firebase Hosting must rewrite SPA routes to /index.html");
}
if (!hostingRewrites.some((rewrite) => rewrite.source === "!/assets/**")) {
  errors.push("Firebase Hosting must not rewrite missing hashed assets to /index.html");
}
const hostingHeaders = firebaseJson.hosting?.headers ?? [];
const hasNoStoreHeader = (source) =>
  hostingHeaders.some(
    (entry) =>
      entry.source === source &&
      entry.headers?.some(
        (header) =>
          header.key.toLowerCase() === "cache-control" &&
          /no-store|no-cache|must-revalidate/.test(header.value),
      ),
  );
if (!hasNoStoreHeader("/") || !hasNoStoreHeader("index.html")) {
  errors.push("Firebase Hosting must revalidate the SPA app shell");
}

const indexHtml = read("index.html");
if (!indexHtml.includes("/src/main.tsx")) {
  errors.push("index.html must boot the React SPA entry");
}
if (!indexHtml.includes("/favicon.png")) {
  errors.push("index.html must use the logo favicon");
}
if (indexHtml.includes("<iframe")) {
  errors.push("Public page must not embed raw Google Sheets iframes");
}

const sourceBundle = [
  read("src/routes/index.tsx"),
  read("src/lib/live-tournament-data.ts"),
  read("src/components/tournament/CommandPalette.tsx"),
  read("src/components/tournament/LobbyDrawer.tsx"),
  read("src/components/tournament/MatchDrawer.tsx"),
  read("src/components/tournament/MobileTabBar.tsx"),
].join("\n");

const productionFacingBundle = [
  read("index.html"),
  read("package.json"),
  read("firebase.json"),
  read(".github/workflows/firebase-hosting.yml"),
  read("src/routes/index.tsx"),
  read("src/routes/__root.tsx"),
  read("src/main.tsx"),
  read("src/router.tsx"),
  read("src/lib/live-tournament-data.ts"),
  read("src/lib/tournament-data.ts"),
  read("src/data/sheet-config.js"),
].join("\n");

if (/lovable/i.test(productionFacingBundle)) {
  errors.push(
    "Production-facing app, metadata, deploy config, and runtime code must not expose Lovable naming",
  );
}

for (const requiredSource of [
  "useLiveTournamentData",
  "loadTournamentFeeds",
  "CommandPalette",
  "LobbyDrawer",
  "MatchDrawer",
  "MobileTabBar",
  "finalSlotPlayers",
]) {
  if (!sourceBundle.includes(requiredSource)) {
    errors.push(`React app must include ${requiredSource}`);
  }
}

for (const blockedCopy of [
  "Discord",
  "staff-only",
  "Player Details",
  "Master Sheet",
  "phone",
  "email",
]) {
  if (indexHtml.includes(blockedCopy)) {
    errors.push(`Public HTML must not expose blocked copy: ${blockedCopy}`);
  }
}

const sheetConfig = read("src/data/sheet-config.js");
for (const [feedId, gid] of [
  ["national-finals", "1409701649"],
  ["group-titan", "1994318444"],
  ["group-nexus", "612483539"],
  ["group-dominion", "945411688"],
  ["wildcard", "1564963263"],
]) {
  if (!sheetConfig.includes(feedId) || !sheetConfig.includes(gid)) {
    errors.push(`Sheet config must include ${feedId} gid ${gid}`);
  }
}
for (const privateTab of ["Master Sheet", "Player Details", "Overview"]) {
  if (sheetConfig.includes(privateTab)) {
    errors.push(`Sheet config must not consume private or unsafe tab: ${privateTab}`);
  }
}

const fallbackTournament = {
  id: "test",
  label: "Test",
  bracket: { rounds: [] },
  lobbies: [],
  rules: [],
};

const groupCsv = [
  "Stage,Lobby,Player 1,City,Rank,Qualified,Player 2,City,Rank,Qualified,Player 3,City,Rank,Qualified,Player 4,City,Rank,Qualified",
  "Round 4,Lobby 1,Asha Rao,Delhi,1,YES,Dev Iyer,Mumbai,2,YES,Kai Sen,Pune,3,NO,Mira Das,Kolkata,4,NO",
  "Round 4,Lobby 2,Neel Roy,Jaipur,1,YES,Tara Shah,Surat,2,YES,Zed Khan,Bhopal,3,NO,Ria Bose,Chennai,4,NO",
].join("\n");

const groupFeed = buildGroupFeedFromCsv(
  groupCsv,
  {
    id: "group-titan",
    label: "Group Titan Bracket",
    shortLabel: "Titan",
    type: "group",
    gid: "1994318444",
  },
  fallbackTournament,
  new Date("2026-07-03T00:00:00.000Z"),
);

if (groupFeed.progression.rounds.length !== 4) {
  errors.push("Group parser must preserve four lobby progression rounds");
}
if ((groupFeed.meta?.directCandidates ?? []).length !== 4) {
  errors.push("Round 4 first/second placements must produce four direct Finals candidates");
}
if ((groupFeed.meta?.wildcardCandidates ?? []).length !== 4) {
  errors.push(
    "Round 4 third/fourth placements from both lobbies must produce four Wildcard candidates",
  );
}

const globalRoundFourCsv = [
  "Stage,Lobby,Player 1,City,Rank,Qualified,Player 2,City,Rank,Qualified,Player 3,City,Rank,Qualified,Player 4,City,Rank,Qualified",
  "Round 4,Lobby 1,Asha Rao,Delhi,1,YES,Dev Iyer,Mumbai,2,YES,Kai Sen,Pune,5,NO,Mira Das,Kolkata,6,NO",
  "Round 4,Lobby 2,Neel Roy,Jaipur,3,YES,Tara Shah,Surat,4,YES,Zed Khan,Bhopal,7,NO,Ria Bose,Chennai,8,NO",
].join("\n");
const globalRoundFourFeed = buildGroupFeedFromCsv(
  globalRoundFourCsv,
  {
    id: "group-nexus",
    label: "Group Nexus Bracket",
    shortLabel: "Nexus",
    type: "group",
    gid: "612483539",
  },
  fallbackTournament,
  new Date("2026-07-03T00:00:00.000Z"),
);
if ((globalRoundFourFeed.meta?.directCandidates ?? []).length !== 4) {
  errors.push("Round 4 global placements 1-4 must produce four direct Finals candidates");
}
if ((globalRoundFourFeed.meta?.wildcardCandidates ?? []).length !== 4) {
  errors.push("Round 4 global placements 5-8 must produce four Wildcard candidates");
}
const roundFourPlayers =
  globalRoundFourFeed.progression.rounds
    .find((round) => round.title === "Round 4")
    ?.lobbies.flatMap((lobby) => lobby.players) ?? [];
if (!roundFourPlayers.some((player) => player.rank === 5 && player.state === "wildcard")) {
  errors.push("Round 4 global rank 5 must render as a Wildcard player");
}
if (!roundFourPlayers.some((player) => player.rank === 4 && player.stateLabel === "Finals")) {
  errors.push("Round 4 global rank 4 must render as a Finals player");
}

const wildcardCsv = [
  "Stage,Lobby,Player 1,City,Rank,Qualified,Player 2,City,Rank,Qualified,Player 3,City,Rank,Qualified",
  "Wildcart,Lobby 1,Asha Rao,Delhi,1,YES,Dev Iyer,Mumbai,2,NO,Kai Sen,Pune,3,NO",
  ",Lobby 2,Neel Roy,Jaipur,,,Tara Shah,Surat,,,Zed Khan,Bhopal,,",
  ",Lobby 3,Ria Bose,Chennai,,,Mira Das,Kolkata,,,Uma Nair,Kochi,,",
  ",Lobby 4,Arun Pal,Delhi,,,Ira Sen,Pune,,,Omar Ali,Surat,,",
].join("\n");
const wildcardFeed = buildGroupFeedFromCsv(
  wildcardCsv,
  {
    id: "wildcard",
    label: "Wildcard",
    shortLabel: "Wildcard",
    type: "wildcard",
    gid: "1564963263",
  },
  fallbackTournament,
  new Date("2026-07-03T00:00:00.000Z"),
);
if (wildcardFeed.meta?.stage !== "Wildcard") {
  errors.push("Wildcard parser must normalize the current Wildcart typo");
}
if (wildcardFeed.progression?.rounds?.[0]?.lobbies?.length !== 4) {
  errors.push("Wildcard parser must render four lobbies from the dedicated public tab");
}
if (wildcardFeed.progression?.rounds?.[0]?.expectedLobbies !== 4) {
  errors.push("Wildcard parser must expect four lobby winners");
}
if (wildcardFeed.progression?.finalSlots?.[0]?.name !== "Asha Rao") {
  errors.push("Wildcard parser must send only each lobby winner to Finals slots");
}

const finalsCsv = [
  "Round,Match,Player A,Score A,Player B,Score B,Winner",
  "Round of 16,Match 1,Asha Rao,2,Dev Iyer,1,Asha Rao",
].join("\n");
const finalsFeed = buildFinalsFeedFromCsv(
  finalsCsv,
  {
    id: "national-finals",
    label: "National Finals",
    shortLabel: "Finals",
    type: "finals",
    gid: "1409701649",
    finalistSlots: 16,
  },
  fallbackTournament,
  new Date("2026-07-03T00:00:00.000Z"),
);
const firstFinalsMatch = finalsFeed.bracket.rounds[0]?.matches[0];
if (firstFinalsMatch?.id !== "Finals_R16_M1" || firstFinalsMatch?.status !== "final") {
  errors.push("Legacy Finals parser must preserve match IDs, scores, and winner state");
}

const wideFinalsRows = Array.from({ length: 33 }, () => Array(32).fill(""));
wideFinalsRows[0][1] = "Playoff [Top 16]";
wideFinalsRows[0][2] = "Score";
wideFinalsRows[0][8] = "Quarter-Finals";
wideFinalsRows[0][9] = "Score";
wideFinalsRows[0][15] = "Semi-Finals";
wideFinalsRows[0][16] = "Score";
wideFinalsRows[0][22] = "Finals";
wideFinalsRows[0][23] = "Score";
wideFinalsRows[0][31] = "Winner";
const gridEntrants = [
  ["Group \nTitan", "Asha Rao\n(Delhi)"],
  ["Group \nNexus", "Dev Iyer\n(Mumbai)"],
  ["Group \nDominion", "Kai Sen\n(Pune)"],
  ["Wildcard", "Wildcard \nL1 Winner"],
  ["Group \nTitan", "Mira Das\n(Kolkata)"],
  ["Group \nNexus", "Neel Roy\n(Jaipur)"],
  ["Group \nDominion", "Tara Shah\n(Surat)"],
  ["Wildcard", "Wildcard \nL2 Winner"],
  ["Group \nTitan", "Zed Khan\n(Bhopal)"],
  ["Group \nNexus", "Ria Bose\n(Chennai)"],
  ["Group \nDominion", "Uma Nair\n(Kochi)"],
  ["Wildcard", "Wildcard \nL3 Winner"],
  ["Group \nTitan", "Arun Pal\n(Delhi)"],
  ["Group \nNexus", "Ira Sen\n(Pune)"],
  ["Group \nDominion", "Omar Ali\n(Surat)"],
  ["Wildcard", "Wildcard \nL4 Winner"],
];
gridEntrants.forEach(([source, player], index) => {
  const row = 2 + index * 2;
  wideFinalsRows[row][0] = source;
  wideFinalsRows[row][1] = player;
});
wideFinalsRows[3][8] = "Pending";
wideFinalsRows[5][15] = "Pending";
wideFinalsRows[9][22] = "Pending";
wideFinalsRows[17][31] = "Pending";
wideFinalsRows.forEach((row, index) => {
  if (index > 0 && row.every((cell) => cell === "")) row[30] = "0";
});
const wideFinalsFeed = buildFinalsFeedFromCsv(
  csvRows(wideFinalsRows),
  {
    id: "national-finals",
    label: "National Finals",
    shortLabel: "Finals",
    type: "finals",
    gid: "1409701649",
    finalistSlots: 16,
  },
  fallbackTournament,
  new Date("2026-07-12T00:00:00.000Z"),
);
const wideRounds = wideFinalsFeed.bracket.rounds;
if (wideRounds.map((round) => round.matches.length).join(",") !== "8,4,2,1") {
  errors.push("Wide-grid Finals parser must build 8/4/2/1 bracket rounds");
}
if (wideRounds[0]?.matches[0]?.entrants[0]?.city !== "Delhi") {
  errors.push("Wide-grid Finals parser must parse first-round player cities");
}
if (wideRounds[0]?.matches[1]?.entrants[1]?.name !== "Wildcard L1 Winner") {
  errors.push("Wide-grid Finals parser must preserve Wildcard winner placeholders");
}
if (!wideRounds[0]?.matches[1]?.entrants[1]?.pending) {
  errors.push("Wide-grid Finals parser must keep Wildcard winner placeholders pending");
}
if (wideRounds[1]?.matches[0]?.entrants[0]?.name !== "Winner R16 M1") {
  errors.push(
    "Wide-grid Finals parser must replace Pending advancement cells with winner-path labels",
  );
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Site validation passed.");
