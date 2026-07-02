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
| Static app validation | `npm run check` passed locally and in GitHub Actions before deploy. | Ready |
| Public page boundary | Validation blocks iframe embeds, Discord/broadcast copy, and private-tab copy in `index.html`. | Ready |
| Workbook config | `data/sheet-config.js` defines five public gid feeds. | Ready |
| Group parser | Fixture validates multi-stage group/lobby parsing and qualifier slots. | Ready |
| National Finals parser | Fixture validates duplicate `Score` headers, scores, winners, and final state. | Ready |
| Wildcard parser | Fixture validates `Wildcart` typo normalization. | Ready |
| Current sheet state | Direct CSV checks returned HTTP 200 for all five public feeds. | Ready with sheet cleanup needed |
| Known sheet cleanup | `#REF!` in group feeds, duplicate Finals `Score` headers, `Wildcart` typo. | Data cleanup pending |
| Firebase config | `firebase.json` has Hosting config, cache headers, and security headers. | Ready locally |
| Firebase project | `cci-legion-wars` exists and has default Hosting URL `https://cci-legion-wars.web.app`. | Ready |
| Firebase live deploy | GitHub Actions deploys live Hosting on pushes to `main`; run `28628489855` deployed commit `9b0765f`. | Ready |
| Live URL health | `https://cci-legion-wars.web.app` returned 200 for the page, app assets, logo favicon asset, and PDF. | Ready |
| Rendered QA | Desktop and mobile browser checks rendered bracket tabs without console errors. | Ready |

## Verified Public Feed State

Direct CSV checks succeeded for:

- National Finals: `gid=126700734`
- Group Titan: `gid=1994318444`
- Group Nexus: `gid=612483539`
- Group Dominion: `gid=945411688`
- Wildcard: `gid=1564963263`

## Remaining Live Deploy Requirements

The initial live deploy requirements are satisfied:

- GitHub repository variable `FIREBASE_PROJECT_ID=cci-legion-wars` is configured.
- GitHub repository secret `FIREBASE_SERVICE_ACCOUNT_JSON` is configured.
- The website/workflow changes were pushed to `main`.
- Firebase Hosting workflow run `28628489855` completed successfully.
- The live Firebase URL was verified directly.

For each future production code push:

1. Confirm `npm run check` passes locally for parser, public boundary, docs, and Firebase config checks.
2. Push to `main`.
3. Watch the `Firebase Hosting Deploy` GitHub Actions run.
4. Verify the live Firebase URL renders the public bracket state.
5. Confirm internal files such as `firebase.json` and `docs/**` are not publicly served.

## Not Complete Until

The hosting goal is complete only when the latest pushed commit has a successful `Firebase Hosting Deploy` workflow and the live URL has been checked directly.

Local validation and emulator success prove hosting compatibility, not public deployment.
