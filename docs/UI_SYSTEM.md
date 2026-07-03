# Legion Wars Viewer UI System

Last updated: 2026-07-03

## Purpose

This document records the production UI layer for the public Legion Wars bracket viewer.

The Lovable prototype is used only as a visual reference. The production source of truth remains the static site runtime:

- `index.html`
- `styles.css`
- `app.js`
- `data/sheet-config.js`
- `data/sheet-data.js`

No React runtime, mock data, Discord flow, admin tooling, private sheet tabs, or staff planning copy is part of the public website scope.

## Visual Direction

The public page uses a dark esports broadcast style:

- Tactical uppercase labels.
- Chamfered panels.
- Slab-style match and lobby cards.
- Per-feed accent themes.
- Compact status rails.
- Short viewer-facing copy only.

Accent themes:

| Feed | Accent |
| --- | --- |
| National Finals | Gold |
| Group Titan | Cyan |
| Group Nexus | Violet |
| Group Dominion | Green |
| Wildcard | Orange |

## Component Mapping

| Production Surface | Source Data | Renderer |
| --- | --- | --- |
| Feed tabs | `sheetConfig.feeds` and loaded feeds | `renderFeedTabs()` |
| Tournament flow | loaded feed metadata | `renderTournamentOverview()` |
| Group progression | `feed.progression` | `renderGroupProgression()` |
| Group lobby cards | `progression.rounds[].lobbies[]` | `renderProgressionLobby()` |
| Wildcard pool | `feed.progression` or derived Round Four candidates | `renderWildcardProgression()` |
| National Finals bracket | `feed.bracket` | `renderBracket()` and `renderMatch()` |
| Qualifier/finalist cards | `feed.lobbies` | `renderLobbies()` |
| Sync status | `loadTournamentFeeds()` metadata | `renderSheetMeta()` |

## Public Data Boundary

The UI can display:

- Player display names.
- Public-safe city, state, or legion region values.
- Lobby, stage, round, match, score, winner, and status.
- Last sync and refresh state.

The UI must not display:

- Master Sheet data.
- Player Details data.
- Email addresses.
- Phone numbers.
- Registration or payment data.
- Staff notes.
- Discord operations.
- Broadcast planning.

## Responsive Behavior

Desktop:

- Feed tabs stay as a tactical rail.
- Group views use four progression columns.
- Wildcard uses pool, path, and finals-slot panels.
- National Finals uses bracket columns.

Mobile:

- Feed tabs become a horizontal scroll rail.
- Broadcast headers stack.
- Group rounds stack vertically.
- National Finals rounds stack vertically.
- Wildcard panels stack vertically.

## Maintenance Rules

- Do not replace `data/sheet-data.js` with prototype/mock data.
- Do not add framework dependencies for visual-only changes.
- Keep public copy short and viewer-facing.
- Keep docs technical details out of `index.html`.
- Run `npm run check` after any UI or parser change.
- Run rendered desktop and mobile QA before deploying.
