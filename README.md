# CCI Legion Wars Live Bracket Website

Production-ready static public bracket viewer for Legion Wars.

The site renders five public bracket feeds from a published Google Sheets workbook:

- Group Titan Bracket
- Group Nexus Bracket
- Group Dominion Bracket
- Wildcard Bracket
- National Finals / Main Bracket

The public page does not embed Google Sheets, show raw private tabs, or include Discord/broadcast/admin operations.

## Features

- Multi-tab published Google Sheets CSV sync.
- Separate group/lobby and National Finals parser modes.
- Public bracket tabs with match cards, scores, winners, and pending/live/final states.
- City/state/legion region display when present in public feeds.
- Local browser cache, manual refresh, and low-frequency auto refresh.
- Safe fallback bracket when a feed is unavailable.
- Firebase Hosting configuration and GitHub Actions deploy-on-push workflow.
- Documentation for architecture, sheet schema, deployment, maintenance, security, and copyright/ruleset policy.

## Quick Start

```powershell
npm run check
npm run serve
```

Local URL:

```text
http://127.0.0.1:4173
```

Preview Firebase Hosting locally:

```powershell
npx -y firebase-tools@latest emulators:start --only hosting --project demo-cci-legion-wars
```

## Folder Structure

```text
.
|-- index.html
|-- styles.css
|-- app.js
|-- data/
|   |-- bracket-data.js
|   |-- sheet-config.js
|   `-- sheet-data.js
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- COPYRIGHT_AND_RULESET.md
|   |-- DEPLOYMENT_READINESS_AUDIT.md
|   |-- FIREBASE_DEPLOYMENT.md
|   |-- MAINTENANCE.md
|   |-- RESEARCH.md
|   |-- SECURITY.md
|   `-- SHEET_SCHEMA.md
|-- output/pdf/
|   `-- cci-legion-wars-copyright-ruleset.pdf
|-- scripts/
|   |-- fixtures/sample-finals.csv
|   |-- fixtures/sample-sheet.csv
|   |-- configure-sheet.mjs
|   |-- generate-rules-pdf.py
|   `-- validate-site.mjs
|-- firebase.json
`-- package.json
```

## Environment Setup

Copy the public workbook configuration template:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` only if the published workbook or tab gids change:

```text
PUBLIC_GOOGLE_SHEET_WORKBOOK_ID=2PACX-...
PUBLIC_TITAN_GID=1994318444
PUBLIC_NEXUS_GID=612483539
PUBLIC_DOMINION_GID=945411688
PUBLIC_WILDCARD_GID=1564963263
PUBLIC_FINALS_GID=126700734
PUBLIC_SHEET_CACHE_MS=120000
PUBLIC_SHEET_AUTO_REFRESH_MS=120000
PUBLIC_SHEET_TIMEOUT_MS=8000
PUBLIC_SHEET_SOURCE_LABEL=Google Sheet
```

Generate the runtime config:

```powershell
npm run config:sheet
```

The generated file is `data/sheet-config.js`. These values are public by design. Do not place private credentials, private player data, or staff notes in `.env.local` or browser-readable files.

## Google Sheets Setup

See [docs/SHEET_SCHEMA.md](docs/SHEET_SCHEMA.md).

Current public workbook feeds:

| Feed | Parser | gid |
| --- | --- | --- |
| Group Titan Bracket | group/lobby | `1994318444` |
| Group Nexus Bracket | group/lobby | `612483539` |
| Group Dominion Bracket | group/lobby | `945411688` |
| Wildcard | group/lobby | `1564963263` |
| National Finals / Main Bracket | finals match bracket | `126700734` |

Do not consume `Master Sheet`, `Player Details`, or `Overview` from the public website unless a separate public-safe tab is created.

## Validation

```powershell
npm run check
```

The check verifies:

- Required public-page mount points.
- No iframe/raw sheet embed.
- No Discord/broadcast/private-data copy on the homepage.
- Five-feed workbook config.
- Group/lobby parser behavior.
- National Finals parser behavior, including current duplicate `Score` headers.
- Wildcard typo normalization from `Wildcart` to `Wildcard`.
- Firebase Hosting headers.
- Required docs and PDF artifact.

## Deployment

Firebase deployment details are in [docs/FIREBASE_DEPLOYMENT.md](docs/FIREBASE_DEPLOYMENT.md).

The repo is bound to Firebase project `cci-legion-wars`. Pushes to `main` run validation and deploy the live Firebase Hosting channel.

Live URL:

```text
https://cci-legion-wars.web.app
```

## Maintenance

Normal event updates happen in Google Sheets, not in code.

Redeploy only when changing:

- Website code or styles.
- Workbook id, tab gids, or schema.
- Firebase Hosting config.
- Copyright/ruleset docs or PDF artifact.

## Ownership and Usage

See [docs/COPYRIGHT_AND_RULESET.md](docs/COPYRIGHT_AND_RULESET.md) and the generated [ruleset PDF](output/pdf/cci-legion-wars-copyright-ruleset.pdf).
