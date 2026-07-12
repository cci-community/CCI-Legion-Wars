# Copyright, Data, and Tournament Ruleset

Last updated: 2026-07-03

## Copyright Notice

Copyright (c) 2026 CCI Volunteer Legion and ATLNO.exe. All rights reserved unless a written license says otherwise.

This repository contains event website code, tournament presentation logic, documentation, and brand-integrated layout work for CCI Volunteer Legion Wars. The code and design system may not be copied, resold, republished, or reused for unrelated events without permission from the event owner.

## Brand and Media Rules

- CCI Volunteer Legion marks, logos, page layout, visual styling, and event naming are event-controlled assets.
- The included logo file is used only for this event website.
- Do not replace the logo with third-party artwork unless that artwork is cleared for event use.
- Do not add sponsor, partner, or game publisher marks unless staff has permission.

## Player Data Rules

The public website should expose only the minimum data needed for viewers to follow the bracket:

- Allowed: public display name, public-safe city/state/legion region, bracket seed, lobby, round, match, score, winner, and match state.
- Avoid: phone numbers, platform IDs, email addresses, payment data, private notes, check-in flags, staff-only dispute notes, and full registration lists.
- Do not consume `Master Sheet`, `Player Details`, or private `Overview` data.

## Sheet Rules

The published workbook is the public source of truth for bracket state.

Group and Wildcard feeds use:

```text
Stage, Lobby, Player 1, City, Rank, Qualified, Player 2, City, Rank, Qualified, ...
```

National Finals supports the current published playoff grid and the legacy row schema:

```text
Round, Match, Player A, Score A, Player B, Score B, Winner
```

The current public Finals tab is the playoff grid at `gid=1409701649`. The row schema above remains supported for older published tabs.

## Tournament Ruleset Boundary

Current production assumptions:

- Titan, Nexus, and Dominion are the three group brackets.
- Group brackets progress through lobby rounds.
- Top two from each lobby advance during group progression.
- Round Four is represented by `Round of 8` in the current group sheets.
- Round Four has two lobbies per group.
- Top two from both Round Four lobbies become the group's top four direct National Finals qualifiers.
- Third/fourth from both Round Four lobbies become the group's 5th-8th placements and enter Wildcard.
- Wildcard produces four National Finals qualifiers.
- The dedicated Wildcard tab has four lobbies, three players per lobby, and one winner per lobby.
- When the Wildcard tab has no public players, the website can derive a fallback 12-player Wildcard pool from the three group Round Four stages.
- National Finals contains 16 players: 12 direct group qualifiers and 4 Wildcard qualifiers.
- National Finals is single elimination.

## Operational Rules

- Update the public workbook feeds during live operations.
- Do not publish private tabs as website feeds.
- Keep the public schema stable during the event.
- Use the website refresh control only when an immediate sync is needed.
- Redeploy only for code, config, schema, hosting, or ruleset changes.

## Enforcement in Code

The runtime implementation enforces the ruleset by:

- Loading only configured public workbook gid feeds.
- Caching each feed locally to reduce repeated network requests.
- Using separate parser modes for group/lobby feeds and National Finals.
- Suppressing player names that start with sheet error markers such as `#REF!`.
- Normalizing `Wildcart` to `Wildcard`.
- Falling back to safe placeholder data if feeds are unavailable.
- Keeping Discord, broadcast, admin, and private registration flows outside the public website scope.

This is not a legal contract. It is the project ruleset that engineering and event staff should follow unless the event owner issues a stronger written policy.

## PDF Artifact

A rendered PDF version is generated at:

```text
output/pdf/cci-legion-wars-copyright-ruleset.pdf
```

Regenerate it after edits with:

```powershell
npm run pdf:rules
```
