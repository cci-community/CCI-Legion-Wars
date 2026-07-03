# CCI Legion Wars Website Architecture

Last updated: 2026-07-03

## Objective

Build and maintain a static public bracket viewer for Legion Wars.

The active website scope is:

- Public bracket viewer.
- Published Google Sheets CSV feeds.
- Group Titan, Group Nexus, Group Dominion, Wildcard, and National Finals views.
- Firebase Hosting compatibility.
- Documentation for operation and maintenance.

Out of scope for this phase:

- Discord bot implementation.
- Discord operations.
- Stage/broadcast flow.
- Admin dashboard.
- Authenticated editing.
- Private registration data display.

## System Shape

```text
Browser
  |
  | loads static HTML/CSS/JS
  v
index.html
  |
  | ES module
  v
app.js
  |
  | imports config, fallback data, and parsers
  v
data/sheet-config.js
data/bracket-data.js
data/sheet-data.js
  |
  | fetches five published CSV feeds by gid
  v
Google Sheets published workbook tabs
```

## Runtime Data Flow

1. `index.html` provides the public viewer shell and DOM mount points.
2. `app.js` renders fallback bracket data immediately.
3. `app.js` calls `loadTournamentFeeds()`.
4. `data/sheet-data.js` fetches each configured public CSV feed.
5. Each feed is cached in `localStorage` under a feed-specific key.
6. Group feeds use the group/lobby parser.
7. National Finals uses the match bracket parser.
8. The UI renders feed tabs, status cards, qualifier slots, custom group progression lanes, Wildcard pool cards, and National Finals bracket columns.
9. Manual refresh bypasses the short cache window.
10. Auto refresh runs only when the page is visible and online.

## File Ownership

- `index.html`: public page shell, SEO metadata, navigation, mount points.
- `styles.css`: visual system, responsive bracket/progression layout, tabs, cards, status badges.
- `app.js`: DOM rendering, feed tabs, refresh behavior, stage selector, group progression, Wildcard pool, and Finals bracket cards.
- `data/bracket-data.js`: safe 16-player National Finals fallback.
- `data/sheet-config.js`: generated public workbook id, gids, CSV URLs, cache timing.
- `data/sheet-data.js`: CSV parser, feed loaders, group parser, finals parser, cache/fallback logic.
- `firebase.json`: Firebase Hosting static config, headers, cache policy.
- `scripts/configure-sheet.mjs`: generates `data/sheet-config.js` from environment variables.
- `scripts/validate-site.mjs`: validates public scope, parser behavior, docs, hosting headers.
- `scripts/generate-rules-pdf.py`: renders copyright/ruleset PDF.
- `.github/workflows/firebase-hosting.yml`: Firebase deploy-on-push workflow with manual preview/live dispatch.
- `docs/*`: architecture, sheet, security, deployment, maintenance, research, UI system, ownership policy.

## Feed Configuration

Runtime feeds live in `data/sheet-config.js`.

```js
{
  id: "group-titan",
  label: "Group Titan Bracket",
  shortLabel: "Titan",
  type: "group",
  gid: "1994318444",
  csvUrl: "https://docs.google.com/..."
}
```

Supported feed types:

- `group`: Titan, Nexus, Dominion.
- `wildcard`: Wildcard feed using the same lobby-style parser for now.
- `finals`: National Finals match bracket parser.

## Parser Modes

### Group / Lobby Parser

Input:

```text
Stage, Lobby, Player 1, City, Rank, Qualified, Player 2, City, Rank, Qualified, ...
```

Behavior:

- Reads repeated player slot groups by position.
- Preserves public city/state/legion region if present.
- Suppresses sheet errors such as `#REF!` from display.
- Normalizes `Wildcart` to `Wildcard`.
- Builds a four-round custom group progression model: Round 1, Round 2, Round 3, Round 4.
- Uses stable public lobby ids such as `Titan_R1_L1`, `Nexus_R3_L2`, and `Dominion_R4_L2`.
- Shows public lobby player names and city/region values in lobby cards.
- Marks Round 1-3 top-two players as advancing and lower placements as out.
- Marks Round 4 first/second place as National Finals and third/fourth place as Wildcard.
- Treats the current `Round of 8` group stage as Round Four. That stage has two lobbies; top two from both lobbies are direct Finals qualifiers, while third/fourth from both lobbies become the group's 5th-8th Wildcard candidates.
- If the dedicated Wildcard tab is empty, the Wildcard view derives its 12-player pool from Titan, Nexus, and Dominion Round Four candidates.

### Match Bracket Parser

Input:

```text
Round, Match, Player A, Score A, Player B, Score B, Winner
```

Current tolerated input:

```text
Round, Match, Player A, Score, Player B, Score, Winner
```

Behavior:

- Builds round columns from the `Round` values.
- Renders two entrants per match.
- Parses numeric scores.
- Marks the `Winner` entrant as winner.
- Marks match status as `pending`, `ready`, `live`, or `final`.
- Supports a 16-player National Finals bracket.

## Public Data Boundary

Allowed data:

- Public display names.
- Public-safe city/state/legion region.
- Lobby, stage, round, match labels.
- Scores, winners, status.

Excluded data:

- `Master Sheet`
- `Player Details`
- `Overview` unless a public-safe version is created
- Emails, phone numbers, platform IDs, payments, private notes, disputes, registration metadata

## UI Architecture

The page is intentionally viewer-first:

- Short event branding in the hero.
- Compact live status cards.
- Feed tabs for Finals, Titan, Nexus, Dominion, and Wildcard.
- Tactical broadcast headers for the selected bracket view.
- Chamfered tabs, status rails, and slab-style lobby/match cards.
- Titan, Nexus, and Dominion as lobby progression lanes on desktop.
- Group progression rounds stacked on mobile.
- Wildcard as a 12-player last-chance pool with four Finals slots.
- National Finals as classic bracket columns on desktop.
- National Finals rounds stacked on mobile.
- Match cards with players, city/region, scores, and state badges for National Finals.
- Lobby cards with player advancement state for group and Wildcard views.
- Public lobby player cards and qualifier/finalist cards for the selected feed.
- Last sync and refresh control.

Technical explanations belong in docs, not on the homepage.

## Hosting Architecture

```text
Local / GitHub Actions
  |
  | static files + firebase.json
  v
Firebase Hosting
```

Firebase Hosting uses:

- `public: "."`
- explicit deploy ignores
- security headers
- cache headers for static assets
- `cleanUrls: true`
- `trailingSlash: false`

No Functions, Firestore, Auth, or backend service is required for this phase.

## Deployment Boundary

The site is ready for Firebase Hosting once a Firebase project and credentials are confirmed.

Deployment is not complete until a Firebase preview or live URL is deployed and verified.

## Future Extension Points

Future work may add:

- A public-safe API layer.
- A Discord bot that reads the same public bracket data.
- Admin editing with authentication.
- `brackets-manager.js` or a persistent bracket engine for National Finals/Wildcard only if future data requires it.

These are separate scopes and should not be added to the public viewer without an explicit request.
