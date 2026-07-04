# CCI Legion Wars Live Bracket Website

Production public bracket viewer for Legion Wars.

The site uses a React/TanStack tournament UI shell wired to the existing public Google Sheets runtime from this production repo. Sample data is not production truth.

## Scope

- Public live bracket viewer only.
- Group Titan, Group Nexus, Group Dominion, Wildcard, and National Finals views.
- Live data from published public Google Sheets CSV feeds.
- Firebase Hosting static deployment from the Vite `dist` build.

The public site does not expose private tabs, raw Sheets embeds, Discord operations, staff notes, emails, phone numbers, or registration data.

## Features

- React tournament UI: overview map, tactical tabs, group progression, Wildcard pool, Finals bracket, command palette, drawers, and mobile tab bar.
- Preserved multi-feed sheet fetch/cache/fallback behavior.
- Preserved group/lobby parser, National Finals parser, Wildcard derivation, public-data safety, and workbook gids.
- Public player names, city/region values when safe, ranks, scores, winners, and pending/ready/live/final states.
- Logo favicon and Firebase Hosting deploy-on-push workflow.
- OBS Browser Source overlay mode for stream-safe bracket and leaderboard scenes.
- Original League-inspired OBS screens with angular broadcast plates, crest-backed logo placement, winner paths, and 1920x1080 reference thumbnails in `OBS Screen Thumbnails/`.

## Quick Start

```powershell
npm install
npm run check
npm run dev
```

Vite dev URL:

```text
http://127.0.0.1:5173
```

Production build:

```powershell
npm run build
npm run preview
```

Vite preview URL:

```text
http://127.0.0.1:4173
```

## Architecture

```text
Google Sheets CSV feeds
  -> src/data/sheet-config.js
  -> src/data/sheet-data.js
  -> src/lib/live-tournament-data.ts adapter
  -> React/TanStack tournament components
  -> Vite dist/
  -> Firebase Hosting
```

Key files:

- `src/routes/index.tsx`: public app shell, tabs, refresh, overview/finals/group/wildcard routing.
- `src/components/tournament/*`: tournament UI components.
- `src/lib/live-tournament-data.ts`: adapter from production sheet parser output to UI shapes.
- `src/data/sheet-config.js`: public workbook id, gids, cache timings.
- `src/data/sheet-data.js`: preserved public CSV parser/cache/fallback runtime.
- `firebase.json`: Hosting config for `dist` with SPA rewrite.
- `scripts/validate-site.mjs`: architecture/parser/hosting validation.
- `docs/OBS_OVERLAYS.md`: OBS overlay architecture, URLs, operator setup, and thumbnail inventory.
- `OBS Screen Thumbnails/`: captured 1920x1080 verification thumbnails for the primary OBS sources.

## Google Sheets Feeds

| Feed                           | Parser               | gid          |
| ------------------------------ | -------------------- | ------------ |
| Group Titan Bracket            | group/lobby          | `1994318444` |
| Group Nexus Bracket            | group/lobby          | `612483539`  |
| Group Dominion Bracket         | group/lobby          | `945411688`  |
| Wildcard                       | group/lobby          | `1564963263` |
| National Finals / Main Bracket | finals match bracket | `126700734`  |

Do not consume `Master Sheet`, `Player Details`, or `Overview` from the public website unless a separate public-safe tab is created.

## Config

Edit `.env.local` only if workbook id or gids change, then regenerate:

```powershell
npm run config:sheet
```

The generated runtime config is `src/data/sheet-config.js`.

## Validation

```powershell
npm run check
```

The check verifies:

- React migration structure.
- Firebase `dist` hosting config and SPA rewrite.
- Five public feed IDs/gids.
- No raw Sheets iframe.
- Preserved parser behavior, including Round Four Wildcard routing and `Wildcart` normalization.
- TypeScript and ESLint health.

## Deployment

Preview before live:

```powershell
npm run firebase:preview
```

Do not push to `main` for live deployment until the Firebase preview channel has been verified.

Pushes to `main` run GitHub Actions live deployment:

```text
npm ci -> npm run check -> npm run build -> Firebase Hosting deploy
```

Live URL:

```text
https://cci-legion-wars.web.app
```

Normal bracket updates happen in Google Sheets and do not require redeploys.

## OBS Browser Sources

Use the full source map in `docs/OBS_OVERLAYS.md` when creating OBS scenes.

| OBS source name                     | URL                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `LW - Titan Stage Board`            | `https://cci-legion-wars.web.app/?mode=obs&view=titan&source=bracket`                               |
| `LW - Titan Qualification Route`    | `https://cci-legion-wars.web.app/?mode=obs&view=titan&source=route`                                 |
| `LW - Titan Focused Round`          | `https://cci-legion-wars.web.app/?mode=obs&view=titan&source=round&round=4`                         |
| `LW - Titan Focused Lobby`          | `https://cci-legion-wars.web.app/?mode=obs&view=titan&source=round&round=4&lobby=Titan_R4_L1`       |
| `LW - Nexus Stage Board`            | `https://cci-legion-wars.web.app/?mode=obs&view=nexus&source=bracket`                               |
| `LW - Nexus Qualification Route`    | `https://cci-legion-wars.web.app/?mode=obs&view=nexus&source=route`                                 |
| `LW - Nexus Focused Round`          | `https://cci-legion-wars.web.app/?mode=obs&view=nexus&source=round&round=4`                         |
| `LW - Nexus Focused Lobby`          | `https://cci-legion-wars.web.app/?mode=obs&view=nexus&source=round&round=4&lobby=Nexus_R4_L1`       |
| `LW - Dominion Stage Board`         | `https://cci-legion-wars.web.app/?mode=obs&view=dominion&source=bracket`                            |
| `LW - Dominion Qualification Route` | `https://cci-legion-wars.web.app/?mode=obs&view=dominion&source=route`                              |
| `LW - Dominion Focused Round`       | `https://cci-legion-wars.web.app/?mode=obs&view=dominion&source=round&round=4`                      |
| `LW - Dominion Focused Lobby`       | `https://cci-legion-wars.web.app/?mode=obs&view=dominion&source=round&round=4&lobby=Dominion_R4_L1` |
| `LW - Wildcard Board`               | `https://cci-legion-wars.web.app/?mode=obs&view=wildcard`                                           |
| `LW - Nationals Round of 16`        | `https://cci-legion-wars.web.app/?mode=obs&view=finals&round=1`                                     |
| `LW - Nationals Quarterfinals`      | `https://cci-legion-wars.web.app/?mode=obs&view=finals&round=2`                                     |
| `LW - Nationals Semifinals`         | `https://cci-legion-wars.web.app/?mode=obs&view=finals&round=3`                                     |
| `LW - Nationals Grand Final`        | `https://cci-legion-wars.web.app/?mode=obs&view=finals&round=4`                                     |

Focused group callouts use the same pattern for all groups:

```text
https://cci-legion-wars.web.app/?mode=obs&view=titan&source=round&round=4
https://cci-legion-wars.web.app/?mode=obs&view=titan&source=round&round=4&lobby=Titan_R4_L1
https://cci-legion-wars.web.app/?mode=obs&view=nexus&source=round&round=4
https://cci-legion-wars.web.app/?mode=obs&view=nexus&source=round&round=4&lobby=Nexus_R4_L1
https://cci-legion-wars.web.app/?mode=obs&view=dominion&source=round&round=4
https://cci-legion-wars.web.app/?mode=obs&view=dominion&source=round&round=4&lobby=Dominion_R4_L1
```
