# Firebase Deployment Runbook

Last updated: 2026-07-03

## Current State

- This repository is static and Firebase Hosting-compatible.
- `firebase.json` is configured for Hosting Classic.
- `.firebaserc` binds the default project to `cci-legion-wars`.
- Live bracket updates do not require redeploys as long as staff update the same published public workbook tabs without changing gids or schema.
- Live deployment runs from GitHub Actions on pushes to `main` after validation passes.
- The first verified live deploy ran from GitHub Actions run `28628489855` for commit `9b0765f`.

Firebase project:

- Project ID: `cci-legion-wars`
- Default Hosting URL: `https://cci-legion-wars.web.app`

## Local Preview

```powershell
npm run check
npx -y firebase-tools@latest emulators:start --only hosting --project cci-legion-wars
```

Default emulator URL:

```text
http://localhost:5000
```

## Workbook Environment Setup

Before deploying a new workbook source:

```powershell
Copy-Item .env.example .env.local
# Edit .env.local if workbook id or gids changed
npm run config:sheet
npm run check
```

Firebase Hosting serves a static app, so public runtime values are generated into `data/sheet-config.js` before deployment.

Do not put private secrets or private player data in browser-readable files.

## Bind A Firebase Project

The repo is already bound to `cci-legion-wars` in `.firebaserc`.

## Preview Deploy

```powershell
npx -y firebase-tools@latest hosting:channel:deploy legion-wars-preview --expires 7d --project cci-legion-wars
```

## Live Deploy

```powershell
npx -y firebase-tools@latest deploy --only hosting --project cci-legion-wars
```

## GitHub Actions Setup

The workflow deploys live Hosting automatically on pushes to `main`. It can also be run manually for preview or live deploys.

Required repository secret:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

Required repository variable:

```text
FIREBASE_PROJECT_ID
```

Optional repository variable:

```text
FIREBASE_HOSTING_TARGET
```

Use `FIREBASE_HOSTING_TARGET` only when this repo has a Firebase Hosting deploy target configured for a non-default site. It is a deploy target name, not a raw site id. Leave it unset for the default Hosting site.

Recommended workflow:

1. Push code to GitHub.
2. GitHub Actions runs `npm run check`.
3. If validation passes, GitHub Actions deploys the live Firebase Hosting channel.
4. Verify `https://cci-legion-wars.web.app`.

For manual preview checks, run the workflow with `target=preview`.

## Production Health Check

After each deploy, verify:

```powershell
Invoke-WebRequest https://cci-legion-wars.web.app/
Invoke-WebRequest https://cci-legion-wars.web.app/app.js
Invoke-WebRequest https://cci-legion-wars.web.app/data/sheet-config.js
Invoke-WebRequest https://cci-legion-wars.web.app/CCI-Volunteer-Legion-Logo-01.png
```

Expected:

- Public page and static assets return HTTP 200.
- Logo asset returns `image/png`.
- Internal files such as `firebase.json` and `docs/**` return HTTP 404.
- Browser console has no app errors on desktop and mobile smoke checks.

## Sheet Update Workflow

During the event:

1. Update only the published public workbook feeds.
2. The website fetches the public CSV feeds at runtime.
3. Visitors receive updated bracket state after the cache window expires.
4. Use the on-page refresh control for immediate sync when needed.

Do not redeploy for normal score, winner, qualifier, or pending-state updates. Redeploy only when changing page code, Firebase config, workbook id, gids, schema, or ruleset artifacts.
