# Legion Wars Viewer UI System

Last updated: 2026-07-03

## Purpose

This document records the production UI layer for the public Legion Wars bracket viewer.

The production UI uses the React/TanStack app structure. Sample data is not used as production truth; live public data flows through `src/lib/live-tournament-data.ts`.

## Visual Direction

The public page uses the esports bracket UI system:

- Dark tactical background.
- Slab/skew cards.
- Chamfered panels.
- Mono uppercase tactical labels.
- Stage accent colors.
- Overview map.
- Command/search palette.
- Public lobby/match drawers.
- Mobile bottom feed tabs.

Accent themes:

| View            | Accent        |
| --------------- | ------------- |
| National Finals | Gold          |
| Group Titan     | Cyan/blue     |
| Group Nexus     | Purple        |
| Group Dominion  | Green         |
| Wildcard        | Violet/orange |

## Component Mapping

| Surface                   | Component                         | Data source                            |
| ------------------------- | --------------------------------- | -------------------------------------- |
| App shell/tabs            | `src/routes/index.tsx`            | `useLiveTournamentData()`              |
| Overview map              | `OverviewMap`                     | adapted `TournamentData`               |
| Group progression         | `GroupProgressionView`            | `GroupView.progression`                |
| Lobby card                | `LobbyCard`                       | adapted public lobby data              |
| Wildcard bracket          | `WildcardView`                    | four-lobby Wildcard feed/fallback pool |
| Finals bracket            | `FinalsBracketView` + `MatchCard` | adapted National Finals feed           |
| Command palette           | `CommandPalette`                  | `flattenPlayers(data)`                 |
| Lobby drawer              | `LobbyDrawer`                     | `findLobbyById(id, data)`              |
| Match drawer              | `MatchDrawer`                     | `findMatchById(id, data)`              |
| Mobile feed tabs          | `MobileTabBar`                    | route tab state                        |
| Sheet sync/cache/fallback | `src/data/sheet-data.js`          | published public CSV feeds             |

## Public Data Boundary

The UI can display:

- Player display names.
- Public-safe city, state, or legion region values.
- Lobby, stage, round, match, score, winner, rank, and status.
- Last updated and refresh state.

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

- Overview, Finals, group, and Wildcard views render in tactical tournament layouts.
- Group views use four progression columns.
- Finals uses bracket columns with champion column.
- Command palette opens from header, `/`, or `Ctrl/Cmd+K`.
- Lobby and match cards open drawers.

Mobile:

- Top tabs remain horizontally scrollable.
- Bottom tab bar provides fast view switching.
- Group, Wildcard, and Finals views stack vertically.
- Drawers use full-width mobile sheets.

## Maintenance Rules

- Do not reintroduce the old vanilla DOM renderer.
- Do not replace `src/data/sheet-data.js` with sample data.
- Keep public copy short and viewer-facing.
- Keep technical details in docs, not the homepage.
- Run `npm run check` and `npm run build` after UI or parser changes.
- Run rendered desktop and mobile QA before deploying.
