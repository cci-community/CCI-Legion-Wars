# Legion Wars Viewer UI System

Last updated: 2026-07-05

## Purpose

This document records the production UI language for the public Legion Wars bracket viewer and OBS browser sources.

The production UI uses the React/TanStack app structure. Sample data is not used as production truth; live public data flows through `src/lib/live-tournament-data.ts`.

## Design Language

Legion Wars uses an original premium competitive esports broadcast language. The interface should feel prestigious, readable, and crafted, with fantasy-inspired broadcast materials rather than generic web-app panels.

The system is built around:

- Obsidian glass and brushed graphite surfaces.
- Antique-gold finals trim with restrained group accents.
- Soft rounded cards and panels, generally 12-20px radius.
- Layered frames, inner rim lighting, and subtle surface texture.
- Heraldic medallions and precise geometric icons.
- Slow ambient motion and deliberate hover feedback.
- Clear broadcast-readable typography.

Avoid:

- Proprietary product skins or copied broadcast assets.
- Hard mechanical boxes as the default surface.
- Oversized borders and heavy outlines.
- Neon RGB palettes.
- Decorative motion that competes with player names, scores, or status.

## Tokens

Primary design tokens live in [src/styles.css](../src/styles.css):

| Token               | Role                                     |
| ------------------- | ---------------------------------------- |
| `--radius`          | Global app radius base                   |
| `--lw-radius-sm`    | Compact chips, phase steps, small inputs |
| `--lw-radius-card`  | Match cards, lobby cards, route elements |
| `--lw-radius-panel` | Major panels and OBS plates              |
| `--lw-radius-xl`    | Large hero or broadcast frames           |
| `--lw-glass-panel`  | Standard translucent panel material      |
| `--lw-glass-deep`   | Darker inset panel material              |
| `--lw-border-soft`  | Soft rim/border reference                |
| `--lw-shadow-card`  | Card elevation                           |
| `--lw-shadow-panel` | Major panel elevation                    |
| `--lw-ease-premium` | Standard refined easing curve            |
| `--titan`           | Group Titan accent                       |
| `--nexus`           | Group Nexus accent                       |
| `--dominion`        | Group Dominion accent                    |
| `--wildcard`        | Wildcard accent                          |
| `--finals`          | National Finals antique-gold accent      |

Legacy class names such as `slab-skew`, `slab-unskew`, and `clip-chamfer` are kept for compatibility, but they should now be treated as soft layered broadcast plates rather than skewed mechanical slabs.

## Component Mapping

| Surface                   | Component                         | Data source                      |
| ------------------------- | --------------------------------- | -------------------------------- |
| App shell/tabs            | `src/routes/index.tsx`            | `useLiveTournamentData()`        |
| Overview map              | `OverviewMap`                     | adapted `TournamentData`         |
| Group progression         | `GroupProgressionView`            | `GroupView.progression`          |
| Lobby card                | `LobbyCard`                       | adapted public lobby data        |
| Wildcard pool             | `WildcardView`                    | group Round Four candidates/feed |
| Finals bracket            | `FinalsBracketView` + `MatchCard` | adapted National Finals feed     |
| OBS overlays              | `ObsOverlayView`                  | adapted public bracket state     |
| Command palette           | `CommandPalette`                  | `flattenPlayers(data)`           |
| Lobby drawer              | `LobbyDrawer`                     | `findLobbyById(id, data)`        |
| Match drawer              | `MatchDrawer`                     | `findMatchById(id, data)`        |
| Mobile feed tabs          | `MobileTabBar`                    | route tab state                  |
| Sheet sync/cache/fallback | `src/data/sheet-data.js`          | published public CSV feeds       |

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

- Overview, Finals, group, Wildcard, and OBS views use the same premium broadcast material language.
- Group views keep round separation clear and scannable.
- Finals uses bracket columns with a champion destination.
- Command palette opens from header, `/`, or `Ctrl/Cmd+K`.
- Lobby and match cards open drawers.

Mobile:

- Top tabs remain horizontally scrollable.
- Bottom tab bar provides fast view switching.
- Group, Wildcard, and Finals views stack vertically.
- Cards retain seeded players and status context without requiring drawer access.
- Drawers use full-width mobile sheets.

OBS:

- Full-screen sources target `1920x1080`.
- Player names, scores, and match rows remain static for readability.
- Ambient animation is limited to backgrounds, phase scans, crest pulse, route current, and live status.

## Maintenance Rules

- Reuse `--lw-*` tokens for radius, elevation, material, and motion.
- Keep shape language soft and crafted; use hard angular cuts only for small symbols or deliberate accent frames.
- Keep public copy short and viewer-facing.
- Keep technical details in docs, not the homepage.
- Do not reintroduce the old vanilla DOM renderer.
- Do not replace `src/data/sheet-data.js` with sample data.
- Do not consume private workbook tabs.
- Run `npm run check` and `npm run build` after UI or parser changes.
- Run rendered desktop, mobile, and OBS QA before deploying.
