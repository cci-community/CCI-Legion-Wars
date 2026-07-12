# CCI Legion Wars Website Research

Last updated: 2026-07-03

## Research Questions

1. How should a public viewer display the Legion Wars bracket without embedding raw Google Sheets?
2. How should the app consume a multi-tab published workbook safely?
3. What architecture is production-ready without adding unnecessary backend, Discord, broadcast, or admin scope?
4. What remains blocked before Firebase live hosting can be claimed complete?
5. How should group lobbies be visualized without mislabeling them as single-elimination brackets?

## Verified Workbook State

Public workbook id:

```text
2PACX-1vSs11px-8Fl8S-FvFYdg_lx-ep4mxx0RGzXi54s5kmEFGsc95UW3i5Nxrc63SzrsmOK0gd_5uJivxOQ
```

Direct CSV checks succeeded for:

| Feed            | gid          | Observed state                                                                                         |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| National Finals | `1409701649` | Updated playoff grid with `Playoff [Top 16]`, Quarter-Finals, Semi-Finals, Finals, and Winner columns. |
| Group Titan     | `1994318444` | Group/lobby schema; contains `#REF!` cells.                                                            |
| Group Nexus     | `612483539`  | Group/lobby schema; contains `#REF!` cells.                                                            |
| Group Dominion  | `945411688`  | Group/lobby schema; contains `#REF!` cells.                                                            |
| Wildcard        | `1564963263` | Group/lobby schema; current stage label is `Wildcart`.                                                 |

Implementation response:

- Suppress player names that begin with `#`.
- Tolerate duplicate National Finals `Score` headers by position.
- Normalize `Wildcart` to `Wildcard`.
- Keep sheet cleanup tasks documented instead of exposing them on the public page.

## Source Research

External references checked on 2026-07-03:

- Firebase Hosting full configuration: `https://firebase.google.com/docs/hosting/full-config`
- Firebase Hosting preview/live deployment flow: `https://firebase.google.com/docs/hosting/test-preview-deploy`
- Firebase Hosting channel management: `https://firebase.google.com/docs/hosting/manage-hosting-resources`
- Google Docs Editors publish-to-web guidance: `https://support.google.com/docs/answer/183965`

Current Firebase guidance supports:

- Static Hosting from a configured `public` directory.
- `firebase.json` headers, ignores, clean URLs, and trailing slash behavior.
- Preview channels before live deploy.

Decision:

- Use Firebase Hosting Classic for the static site.
- Do not add Firebase App Hosting, Cloud Functions, Firestore, or Auth for this phase.

## Bracket Rendering Decision

Mature bracket libraries such as `brackets-manager.js` and `brackets-viewer.js` remain useful future options.

Decision for this version:

- Keep a custom lightweight renderer.
- Reason: the current site is static, small, and only needs public bracket display from sheet feeds.
- Avoid adding a full tournament-management data model until admin editing, persistent results, or more complex tournament formats are required.
- Do not force Titan, Nexus, or Dominion into a head-to-head bracket library because they are four-player lobby progression rounds.
- Keep classic Round of 16, Quarterfinals, Semifinals, and Grand Final labels only in National Finals.

## Public UI Decision

The homepage is not a documentation page.

Public page should show:

- Legion Wars branding.
- Current bracket status.
- Feed tabs.
- Group lobby progression.
- Wildcard four-lobby bracket and Finals slots.
- Player names.
- City/state/legion region if public-safe.
- Scores.
- Winners.
- Pending/live/final states.
- Last updated and refresh status.

Public page should not show:

- Implementation explanations.
- Internal planning notes.
- Discord/broadcast operations.
- Private tabs.
- Raw tables or embedded sheets.

## Data Boundary Decision

Do not consume:

- `Master Sheet`
- `Player Details`
- private `Overview`

Reason: these may expose contact or staff-only data.

If event metadata is needed later, create a separate public-safe overview tab with only approved public fields.

## Firebase Deployment Research

Current repository state:

- Static app is Firebase Hosting-compatible.
- `firebase.json` exists.
- No `.firebaserc` is committed because the Firebase project id is not confirmed.
- Live deployment cannot be claimed until a Firebase preview/live URL is deployed and verified.

Previously observed accessible Firebase projects for the authenticated account:

- `chair-game-a74f2`
- `kreo-games`
- `nullqueue-91802`
- `portfolio-80f08`

No obvious CCI/Comic Con/Legion Wars Firebase project was confirmed during the previous deploy audit.

## Final Architecture Decision

Use:

- Static HTML/CSS/JS.
- Published Google Sheets CSV feeds.
- Browser cache and manual refresh.
- Firebase Hosting.
- Docs for architecture, sheet schema, deployment, maintenance, and security.

Avoid:

- Discord bot/API layer in this phase.
- Broadcast/stage flow in this phase.
- Admin dashboard in this phase.
- Private tabs or private registration data.
- Heavy bracket libraries until the format requires them.

## Wildcard Route Correction

Tournament rule clarified after implementation:

- Group 5th-8th Wildcard candidates come from each group's Round Four stage.
- In the current workbook this stage is labeled `Round of 8`.
- `Round of 8` has two lobbies per group.
- Top two from both lobbies are direct Finals qualifiers.
- Third/fourth from both lobbies represent group placements 5th-8th and enter Wildcard.

The parser supports this current label plus `Round Four`, `Round 4`, and `Round of Eight`.

## Group Visual Correction

Group tabs now render:

- Round 1: 16 lobbies, 64 players, top 2 advance.
- Round 2: 8 lobbies, 32 players, top 2 advance.
- Round 3: 4 lobbies, 16 players, top 2 advance.
- Round 4: 2 lobbies, 8 players, first/second go to Finals and third/fourth go to Wildcard.

Stable public IDs follow `{GROUP}_R{ROUND}_L{LOBBY}`, for example `Titan_R4_L1`.
