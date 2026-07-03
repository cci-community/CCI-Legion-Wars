# CCI Legion Wars Website Architecture

Last updated: 2026-07-03

## Objective

Maintain a public Legion Wars bracket viewer that looks and behaves like the Lovable React app while using the existing production Google Sheets runtime as the source of truth.

Out of scope:

- Discord bot implementation.
- Discord operations.
- Stage/broadcast flow.
- Admin dashboard.
- Authenticated editing.
- Private registration data display.

## System Shape

```text
Browser
  -> Firebase Hosting static assets from dist/
  -> Vite React app
  -> TanStack Router URL state
  -> src/lib/live-tournament-data.ts
  -> src/data/sheet-data.js
  -> published Google Sheets CSV feeds
```

The app is a static Firebase Hosting site. It does not require Functions, Firestore, Auth, a backend API, or Lovable mock data.

## Runtime Data Flow

1. `index.html` boots `src/main.tsx`.
2. TanStack Router renders `src/routes/index.tsx`.
3. `useLiveTournamentData()` loads the default public placeholder state.
4. The hook calls the preserved `loadTournamentFeeds()` function from `src/data/sheet-data.js`.
5. `sheet-data.js` fetches the five configured public CSV feeds from `src/data/sheet-config.js`.
6. Feed CSV is cached in `localStorage` using the existing cache/fallback behavior.
7. `live-tournament-data.ts` adapts parser output into Lovable UI shapes.
8. Lovable tournament components render overview, group progression, Wildcard, Finals, command palette, drawers, and mobile tabs.
9. Refresh bypasses the short cache window; auto refresh runs while the page is visible and online.

## File Ownership

- `index.html`: Vite SPA shell, SEO metadata, logo favicon, font links.
- `src/main.tsx`: React bootstrap and TanStack Router provider.
- `src/routes/index.tsx`: public page composition, view tabs, refresh state, URL search state.
- `src/components/tournament/*`: Lovable tournament UI components.
- `src/lib/tournament-data.ts`: Lovable UI TypeScript contracts and public-safe placeholder state.
- `src/lib/tournament-helpers.ts`: search/drawer helpers over current tournament state.
- `src/lib/live-tournament-data.ts`: production adapter from sheet parser output to Lovable UI contracts.
- `src/data/sheet-config.js`: generated public workbook id, gids, CSV URLs, cache timing.
- `src/data/sheet-data.js`: preserved CSV parser, feed loaders, group parser, finals parser, cache/fallback logic.
- `firebase.json`: Firebase Hosting static config for `dist`.
- `.github/workflows/firebase-hosting.yml`: install, validate, build, and deploy workflow.
- `scripts/configure-sheet.mjs`: regenerates `src/data/sheet-config.js`.
- `scripts/validate-site.mjs`: validates architecture, public feed config, parser behavior, and Hosting config.

## Feed Configuration

Runtime feeds live in `src/data/sheet-config.js`.

Supported feed types:

- `group`: Titan, Nexus, Dominion.
- `wildcard`: Wildcard feed using the lobby-style parser.
- `finals`: National Finals match bracket parser.

Private tabs are intentionally not configured.

## Parser Modes

### Group / Lobby Parser

Input:

```text
Stage, Lobby, Player 1, City, Rank, Qualified, Player 2, City, Rank, Qualified, ...
```

Behavior:

- Reads repeated player slot groups by position.
- Suppresses sheet errors such as `#REF!`.
- Normalizes `Wildcart` to `Wildcard`.
- Builds Round 1 through Round 4 lobby progression.
- Uses stable public lobby ids such as `Titan_R1_L1`.
- Marks Round 1-3 top two as advancing.
- Marks Round 4 global placements 1-4 as National Finals.
- Marks Round 4 global placements 5-8 as Wildcard candidates.
- If a sheet uses two lobby-local rank lists instead, maps first/second from each lobby to direct Finals and third/fourth from each lobby to the group's 5th-8th Wildcard pool.
- Derives Wildcard pool from group Round Four candidates when needed.

### Match Bracket Parser

Input:

```text
Round, Match, Player A, Score A, Player B, Score B, Winner
```

Behavior:

- Builds National Finals rounds.
- Parses scores and winners.
- Emits `pending`, `ready`, `live`, or `final` match states.
- Preserves stable match ids such as `Finals_R16_M1`.

## Public Data Boundary

Allowed:

- Public display names.
- Public-safe city/state/legion region.
- Lobby, stage, round, match labels.
- Scores, winners, ranks, public status.

Excluded:

- `Master Sheet`
- `Player Details`
- `Overview` unless a public-safe version is created
- Emails, phone numbers, platform IDs, payments, private notes, disputes, registration metadata

## UI Architecture

The public page uses the Lovable UI structure:

- Overview tournament map.
- Tactical top tab rail.
- Group progression lanes.
- Slab lobby cards.
- Wildcard last-chance pool and final-slot slabs.
- 16-player National Finals bracket.
- Command/search palette.
- Lobby and match drawers.
- Mobile bottom tab bar.
- Per-stage accent themes.

The implementation keeps the Lovable visual system but replaces mock data with the live adapter.

## Hosting Architecture

```text
GitHub Actions
  -> npm ci
  -> npm run check
  -> npm run build
  -> Firebase Hosting deploys dist/
```

Preview channels must be verified before live deployment. Pushes to `main` deploy live, so preview work should use a branch or manual preview channel until the public preview passes.

Firebase Hosting uses:

- `public: "dist"`
- SPA rewrite to `/index.html`
- security headers
- cache headers for built JS/CSS and assets
- `cleanUrls: true`
- `trailingSlash: false`

## Future Extension Points

Future separate work may add a public-safe API or Discord bot that reads the same public bracket data. Those are not part of the current website scope.
