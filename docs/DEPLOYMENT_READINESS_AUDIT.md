# Deployment Readiness Audit

Last updated: 2026-07-03

## Scope

This audit covers the public live bracket viewer only:

- Static website rendering.
- Five published Google Sheets CSV feeds.
- Group Titan, Group Nexus, Group Dominion, Wildcard, and National Finals tabs.
- Public-safe data boundary.
- Firebase Hosting readiness.
- Documentation and copyright/ruleset artifacts.

Excluded from this audit:

- Discord bot implementation.
- Discord operations.
- Stage/broadcast flow.
- Admin dashboard.
- Private registration data.

## Current Evidence

| Area | Evidence | Status |
| --- | --- | --- |
| Static app validation | `npm run check` must pass before deploy. | In progress |
| Public page boundary | Validation blocks iframe embeds, Discord/broadcast copy, and private-tab copy in `index.html`. | Ready |
| Workbook config | `data/sheet-config.js` defines five public gid feeds. | Ready |
| Group parser | Fixture validates multi-stage group/lobby parsing and qualifier slots. | Ready |
| National Finals parser | Fixture validates duplicate `Score` headers, scores, winners, and final state. | Ready |
| Wildcard parser | Fixture validates `Wildcart` typo normalization. | Ready |
| Current sheet state | Direct CSV checks returned HTTP 200 for all five public feeds. | Ready with sheet cleanup needed |
| Known sheet cleanup | `#REF!` in group feeds, duplicate Finals `Score` headers, `Wildcart` typo. | Data cleanup pending |
| Firebase config | `firebase.json` has Hosting config, cache headers, and security headers. | Ready locally |
| Firebase project | `cci-legion-wars` exists and has default Hosting URL `https://cci-legion-wars.web.app`. | Ready |
| Firebase live deploy | GitHub Actions deploys live Hosting on pushes to `main` after repository credentials are configured. | Pending verification |

## Verified Public Feed State

Direct CSV checks succeeded for:

- National Finals: `gid=126700734`
- Group Titan: `gid=1994318444`
- Group Nexus: `gid=612483539`
- Group Dominion: `gid=945411688`
- Wildcard: `gid=1564963263`

## Remaining Live Deploy Requirements

To complete the Firebase hosting requirement:

1. Add GitHub repository variable `FIREBASE_PROJECT_ID=cci-legion-wars`.
2. Add GitHub repository secret `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. Commit and push the local website/workflow changes to `main`.
4. Watch the Firebase Hosting workflow.
5. Verify the live Firebase URL renders the same public bracket state.

## Not Complete Until

The hosting goal is not complete until a confirmed Firebase live or preview URL has been deployed and verified.

Local validation and emulator success prove hosting compatibility, not public deployment.
