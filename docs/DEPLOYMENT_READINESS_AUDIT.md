# Deployment Readiness Audit

Last updated: 2026-07-12

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

## Latest Evidence

| Area                   | Required evidence before launch                                                                         | Status              |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| Static app validation  | `npm run check` passes after the React/Vite migration.                                                  | Verified 2026-07-03 |
| Production build       | `npm run build` emits `dist/index.html` and hashed assets.                                              | Verified 2026-07-03 |
| Public page boundary   | Validation blocks iframe embeds, private-tab copy, and internal operations copy in public HTML.         | Verified 2026-07-03 |
| Workbook config        | `src/data/sheet-config.js` defines only the five allowed public gid feeds.                              | Verified 2026-07-03 |
| Group parser           | Fixtures validate group/lobby parsing plus Round Four local and global Wildcard routing.                | Verified 2026-07-03 |
| National Finals parser | Fixture validates row-based finals and live wide-grid playoff parsing.                                  | Verified 2026-07-12 |
| Wildcard parser        | Fixture validates `Wildcart` typo normalization, fallback behavior, and four-lobby Wildcard rendering.  | Verified 2026-07-12 |
| Firebase config        | `firebase.json` serves `dist` with SPA rewrite, headers, and no raw source exposure.                    | Verified 2026-07-03 |
| Firebase project       | CLI/GitHub config confirm project id, Hosting site/target, and `.firebaserc`.                           | Verified 2026-07-03 |
| Preview deploy         | Firebase preview channel serves the built React app and loads live public Google Sheets data.           | Verified 2026-07-03 |
| Rendered QA            | Desktop and mobile browser checks render tabs, drawers, command palette, and sheet sync without errors. | Verified 2026-07-03 |

## Verified Public Feed State

Direct CSV checks succeeded for:

- National Finals: `gid=1409701649`
- Group Titan: `gid=1994318444`
- Group Nexus: `gid=612483539`
- Group Dominion: `gid=945411688`
- Wildcard: `gid=1564963263`

## Preview-First Launch Requirements

Do not deploy live until all of these are verified:

1. Firebase project id is `cci-legion-wars`.
2. `.firebaserc` points default deploys at `cci-legion-wars`.
3. Hosting site/target is confirmed.
4. GitHub variable `FIREBASE_PROJECT_ID` is configured.
5. GitHub secret `FIREBASE_SERVICE_ACCOUNT_JSON` is configured.
6. Firebase preview deploy succeeds from the built `dist` output.
7. Public preview URL loads the React bracket app, not raw source files. SPA fallback may return `index.html` for unknown paths, but it must not serve repository files.
8. Preview fetches only the five public Google Sheets gids.
9. Browser console and network checks show no private data, secrets, local paths, or prototype production metadata.

After preview passes:

1. Push/merge to `main`.
2. Watch the `Firebase Hosting Deploy` GitHub Actions run.
3. Verify the live Firebase URL renders the public bracket state.
4. Confirm internal paths such as `firebase.json`, `docs/**`, `src/**`, and `package.json` do not expose raw repository content.

## Remaining Live Launch Gate

Preview readiness is complete. Live release remains pending until the reviewed branch is pushed or merged to `main`, the `Firebase Hosting Deploy` GitHub Actions run succeeds, and the live Firebase URL is checked directly.
