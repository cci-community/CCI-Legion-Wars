# Maintenance Guide

Last updated: 2026-07-03

## During The Event

1. Update only the public bracket tabs in the published workbook.
2. Enter ranks, scores, and winners in the correct public feed.
3. Use the website `Refresh data` button when an immediate public update is needed.
4. Confirm the public page shows the expected feed tab, players, scores, winners, and status.

Do not edit website code during live operations unless the feed config, schema, or rendering is broken.

## Public Feed Checklist

Before the event starts:

- Titan, Nexus, Dominion, Wildcard, and National Finals CSV feeds return HTTP 200.
- `Master Sheet`, `Player Details`, and private `Overview` data are not consumed by the website.
- Public feeds do not contain emails, phone numbers, registration notes, payment details, or staff-only notes.
- City/state/legion region values are approved for public display.
- Each group `Round of 8` stage has two lobbies and records ranks for direct Finals and Wildcard routing.
- If the Wildcard tab is not filled yet, verify the website still shows the derived Wildcard pool from group `Round of 8` candidates.
- National Finals headers are preferably `Score A` and `Score B`.
- `Wildcart` is corrected to `Wildcard`.
- `#REF!` cells are fixed in group feeds.

## After Sheet Changes

Use the current public page to verify:

- Feed tabs appear for Finals, Titan, Nexus, Dominion, and Wildcard.
- Titan, Nexus, and Dominion render Round 1-4 lobby progression, not Quarterfinal/Semifinal/Final bracket columns.
- Wildcard renders the 12-player last-chance pool and four Finals slots.
- National Finals renders the classic 16-player bracket.
- Pending slots appear for unknown players.
- Scores and winners appear in National Finals when entered.
- Group and Wildcard feeds do not expose private rows.
- Last sync time updates after refresh.

## Changing Workbook Feeds

1. Copy `.env.example` to `.env.local` if it does not exist.
2. Set `PUBLIC_GOOGLE_SHEET_WORKBOOK_ID`.
3. Set all public gid values:
   - `PUBLIC_TITAN_GID`
   - `PUBLIC_NEXUS_GID`
   - `PUBLIC_DOMINION_GID`
   - `PUBLIC_WILDCARD_GID`
   - `PUBLIC_FINALS_GID`
4. Adjust refresh values only if needed.
5. Run `npm run config:sheet`.
6. Run `npm run check`.
7. Browser-test desktop and mobile.

## After Code Changes

Run:

```powershell
npm run check
npm run pdf:rules
```

Then preview locally:

```powershell
npm run build
npm run preview
```

For Firebase config changes:

```powershell
npx -y firebase-tools@latest emulators:start --only hosting --project demo-cci-legion-wars
```

## Updating The Ruleset

1. Edit `docs/COPYRIGHT_AND_RULESET.md`.
2. Run `npm run pdf:rules`.
3. Run `npm run check`.
4. Verify `output/pdf/cci-legion-wars-copyright-ruleset.pdf` opens.

## Extending Tournament Formats

The current website supports:

- Group/lobby-style feeds.
- Wildcard using the group/lobby parser.
- Custom group lobby progression rendering.
- 16-player National Finals match bracket.

Future formats may need:

- Double elimination.
- Manual seed overrides.
- Dedicated public API.
- Authenticated admin editing.
- Discord bot posting.

Add these only as separate explicit scopes.
