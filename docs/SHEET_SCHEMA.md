# Public Sheet Schema

Last updated: 2026-07-12

## Purpose

The website reads only public published CSV feeds from the Legion Wars Google Sheets workbook. It renders viewer-facing tabs, group lobby progression, Wildcard lobby state, National Finals match cards, scores, winners, and qualifier status.

The website must not embed the sheet or show raw tables.

## Public Workbook Feeds

Published workbook id:

```text
2PACX-1vSs11px-8Fl8S-FvFYdg_lx-ep4mxx0RGzXi54s5kmEFGsc95UW3i5Nxrc63SzrsmOK0gd_5uJivxOQ
```

| Public feed                    | Parser mode  | gid          |
| ------------------------------ | ------------ | ------------ |
| Group Titan Bracket            | group/lobby  | `1994318444` |
| Group Nexus Bracket            | group/lobby  | `612483539`  |
| Group Dominion Bracket         | group/lobby  | `945411688`  |
| Wildcard                       | group/lobby  | `1564963263` |
| National Finals / Main Bracket | playoff grid | `1409701649` |

CSV URL pattern:

```text
https://docs.google.com/spreadsheets/d/e/<WORKBOOK_ID>/pub?single=true&output=csv&gid=<GID>
```

## Do Not Consume

The public website must not consume these tabs:

- `Master Sheet`
- `Player Details`
- `Overview`, unless a public-safe overview tab is created

Reason: these tabs may contain private player/contact data or staff-only operational notes.

## Group / Lobby Required Columns

Used by Titan, Nexus, Dominion, and Wildcard.

```text
Stage, Lobby, Player 1, City, Rank, Qualified, Player 2, City, Rank, Qualified, Player 3, City, Rank, Qualified, ...
```

The parser anchors on each `Player N` column, then reads the next three cells as:

- `City`: city, state, or legion region if public-safe.
- `Rank`: placement value.
- `Qualified`: optional qualification flag.

## Stage Column

`Stage` groups rows into lobby progression rounds.

Examples:

- `Round of 64`
- `Round of 32`
- `Round of 16`
- `Round of 8`
- `Wildcard`

If a `Stage` cell is blank, the row belongs to the most recent non-blank stage above it. The website normalizes the current typo `Wildcart` to `Wildcard`.

## Lobby Column

`Lobby` is the public lobby or match room label.

Examples:

- `Lobby 1`
- `Lobby A`
- `Group Delhi 01`

The public page shows the public players in each lobby and highlights qualification state when results are entered. It does not expose private registration rows.

## Qualifier Rules

For each lobby:

- First place: put `1`, `1st`, `first`, or `winner` in `Rank`.
- Second place: put `2`, `2nd`, `second`, or `runner-up` in `Rank`.
- `Qualified` may also use `YES`, `TRUE`, `qualified`, `winner`, or `1`.

Tournament flow:

- Titan, Nexus, and Dominion each progress through lobby rounds.
- Group tabs are not classic single-elimination brackets.
- Public group visuals use `Round 1`, `Round 2`, `Round 3`, and `Round 4`, regardless of older sheet labels such as `Quarterfinals`.
- Top two from each lobby advance during group progression.
- The group route stage is `Round of 8` in the current sheet. It may also be labeled `Round Four` or `Round 4`.
- The group route stage has two lobbies per group.
- Preferred Round of 8 ranking: use global group placements `1` through `8` across the two lobbies.
- Global placements `1` through `4` become the group's direct National Finals qualifiers.
- Global placements `5` through `8` enter Wildcard.
- If the sheet uses lobby-local ranks instead, first/second from each lobby map to direct Finals and third/fourth from each lobby map to the group's 5th-8th Wildcard placements.
- Wildcard has four lobbies with three players each.
- Each Wildcard lobby produces one National Finals qualifier.

The dedicated Wildcard tab is the public source of truth when it has lobby players. If it is empty, the website can still show a fallback Wildcard pool by deriving the 12 candidates from Titan, Nexus, and Dominion Round of 8 rows.

## Public Visual IDs

Group lobby IDs are rendered as:

```text
{GROUP}_R{ROUND}_L{LOBBY}
```

Examples:

- `Titan_R1_L1`
- `Titan_R4_L2`
- `Nexus_R3_L2`
- `Dominion_R4_L2`

Wildcard lobby IDs are rendered as:

```text
Wildcard_L{LOBBY}
```

Examples:

- `Wildcard_L1`
- `Wildcard_L4`

Wildcard slots are shown as four lobby cards and four `WQ` National Finals slots.

## National Finals Schema

Used by `gid=1409701649`.

Current grid header:

```text
, Playoff [Top 16], Score, ..., Quarter-Finals, Score, ..., Semi-Finals, Score, ..., Finals, Score, ..., Winner
```

The Finals tab is a spatial playoff grid:

- `Playoff [Top 16]` column contains the 16 first-round entrants.
- Each entrant cell may contain a player and city in the format `Player Name (City)`.
- Wildcard placeholders such as `Wildcard L1 Winner` are treated as pending public slots.
- `Quarter-Finals`, `Semi-Finals`, `Finals`, and `Winner` cells drive advancement when real names are entered.
- `Pending` cells are rendered as pending placeholders such as `Winner R16 M1`.
- Score columns are read when they contain entered score values.

Legacy row-based Finals schema is still tolerated:

Preferred header:

```text
Round, Match, Player A, Score A, Player B, Score B, Winner
```

Current tolerated header:

```text
Round, Match, Player A, Score, Player B, Score, Winner
```

The legacy parser reads the two score columns by position, so duplicate `Score` headers still work for older published tabs.

National Finals is a 16-player single-elimination bracket:

- 12 direct group qualifiers.
- 4 wildcard qualifiers.
- Round of 16, Quarterfinals, Semifinals, Grand Final.

Only National Finals should use classic bracket labels such as Quarterfinals, Semifinals, Grand Final, and Champion.

## Public Data Boundary

Allowed in public feeds:

- Public player display name.
- City/state/legion region if approved for public display.
- Rank/qualification state.
- Scores, winners, match status.
- Lobby, stage, group, and round labels.

Do not publish:

- Phone numbers.
- Email addresses.
- Platform IDs.
- Payment data.
- Check-in notes.
- Staff-only disputes.
- Private registration metadata.

## Cache And Refresh Behavior

The website caches each public CSV feed in browser storage for a short window. Open pages refresh at the configured interval, skip hidden tabs, and provide a manual refresh button.

If a feed request fails:

1. The site uses the last cached CSV for that feed if available.
2. If there is no cache, the site shows safe placeholder bracket data.
3. The page does not fall back to private tabs.

## Current Sheet Cleanup

The website currently tolerates these issues, but the sheet should still be cleaned:

- Fix `#REF!` cells in Titan, Nexus, and Dominion.
- Fix `Wildcart` to `Wildcard`.
- Keep `gid=1409701649` published as the public Finals tab.
