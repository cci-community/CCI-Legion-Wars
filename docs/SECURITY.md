# Security Notes

Last updated: 2026-07-03

## Public Data Boundary

This is a public static site. Anything in the repository, deployed files, or published workbook feeds can be seen by visitors.

The website may display:

- Public player names.
- Public-safe city/state/legion region.
- Lobby, group, round, match labels.
- Scores, winners, pending/live/final states.
- Last sync status.

The website must not display or fetch:

- `Master Sheet`
- `Player Details`
- Private `Overview` data
- Emails
- Phone numbers
- Platform IDs
- Payment data
- Registration notes
- Staff-only notes
- Dispute logs

## Runtime Security Model

- No private API keys are used in browser code.
- Google Sheets data is accessed only through public published CSV endpoints.
- `.env.local` is used only to generate public runtime configuration.
- `src/data/sheet-config.js` contains public workbook id and gid values only.
- Sheet values are normalized before rendering.
- `#REF!` and other cells starting with `#` are suppressed from player display.
- If a feed fails, the app falls back to cached public feed data or safe placeholders.

## Hosting Headers

`firebase.json` defines production security headers:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- Content Security Policy restricting scripts to this site and sheet fetches to Google published-sheet domains.

## Operational Rules

- Keep deployment access limited to trusted maintainers.
- Use GitHub Actions secrets for Firebase service account credentials.
- Do not paste service account JSON or tokens into source files.
- Review public workbook tabs before the event starts.
- Do not point the public config at private tabs.
- Do not add Discord, broadcast, admin, or private-data features to this website scope without a new explicit scope decision.

## Security Ownership

Sensitive ownership areas:

- `firebase.json`: hosting, headers, deploy surface.
- `.github/workflows/`: deployment automation.
- `src/data/sheet-config.js`: public source selection.
- `src/data/sheet-data.js`: data normalization and public rendering boundary.
- `docs/COPYRIGHT_AND_RULESET.md`: disclosure and usage policy.
