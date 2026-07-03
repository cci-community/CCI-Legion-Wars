# Firebase Deployment Runbook

Last updated: 2026-07-03

## Current State

- Firebase project: `cci-legion-wars`
- Default Hosting URL: `https://cci-legion-wars.web.app`
- Hosting mode: Firebase Hosting Classic serving the Vite `dist` directory.
- The React app fetches public Google Sheets CSV feeds at runtime, so normal bracket updates do not require redeploys.

## Local Preview

```powershell
npm install
npm run check
npm run build
npm run preview
```

Vite preview URL:

```text
http://127.0.0.1:4173
```

Firebase emulator preview:

```powershell
npm run build
npx -y firebase-tools@latest emulators:start --only hosting --project cci-legion-wars
```

## Workbook Environment Setup

Before deploying a new workbook source:

```powershell
Copy-Item .env.example .env.local
# Edit .env.local if workbook id or gids changed
npm run config:sheet
npm run check
```

The generated runtime config is `src/data/sheet-config.js`. These values are public by design.

Do not put private secrets or private player data in browser-readable files.

## GitHub Actions Setup

Pushes to `main` deploy live Hosting automatically. Use preview channels first and do not push to `main` until preview has been verified.

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

Leave `FIREBASE_HOSTING_TARGET` unset for the default Hosting site.

Workflow:

1. `npm ci`
2. `npm run check`
3. `npm run build`
4. Firebase Hosting deploys `dist`

## Live Deploy

Manual preview channel:

```powershell
npm run firebase:preview
```

Verify the preview URL loads the built React app, uses only the public Google Sheets feeds, and does not expose raw source files or private data.

Manual live deploy, only after preview passes:

```powershell
npm run firebase:deploy
```

## Production Health Check

After each deploy, verify:

```powershell
Invoke-WebRequest https://cci-legion-wars.web.app/
Invoke-WebRequest https://cci-legion-wars.web.app/favicon.png
Invoke-WebRequest https://cci-legion-wars.web.app/CCI-Volunteer-Legion-Logo-01.png
```

Expected:

- Public page and built assets return HTTP 200.
- Logo and favicon return image responses.
- Internal paths such as `firebase.json`, `docs/**`, `src/**`, and `package.json` must not return raw source content. Because this is an SPA with a catch-all rewrite, those unknown paths may return the built `index.html`; verify the response is app HTML, not repository files.
- Browser console has no app errors.
- Sheet sync reaches live or cached public bracket data.

## Sheet Update Workflow

During the event:

1. Update only the published public workbook feeds.
2. The website fetches the public CSV feeds at runtime.
3. Visitors receive updated bracket state after the cache window expires.
4. Use the on-page refresh control for immediate sync when needed.

Redeploy only when changing app code, Firebase config, workbook id, gids, schema, or ruleset artifacts.
