# Security & Privacy

Space Syntax is a **static site with no login, no backend and no database**. That removes whole classes of risk
(no passwords, no sessions, no server to break into). What is left, and how it is handled:

## Threat model
| Risk | Mitigation |
|---|---|
| Cross-site scripting (XSS) | Strict Content-Security-Policy (`script-src 'self'`, no inline scripts, no `eval`). Every dynamic string is HTML-escaped (`esc()` in `js/app.js`). No user free-text input exists. |
| Tampered saved game (`localStorage`) | Saved data is treated as untrusted: `SS_MODEL.sanitizeState()` rebuilds it from a whitelist (known ids only, numbers clamped, unknown keys dropped, size limit 20 KB). |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` (via `vercel.json` / `_headers`). |
| Leaking where players come from | `Referrer-Policy: no-referrer`; external links use `rel="noopener noreferrer"`. |
| Unwanted device access | `Permissions-Policy` disables camera, microphone, geolocation, payment, USB, topics. |
| Downgrade / MITM | HSTS + `upgrade-insecure-requests` on the hosted site. |
| Secrets in the repo | None are needed. `.gitignore` blocks `.docx`, `.env`, keys; `tools/check.js` fails CI if a private file is tracked. |
| Supply chain | Zero runtime dependencies, zero npm packages. Tests use Node's built-in runner. |

## Privacy (players are teenagers)
- No accounts, no analytics, no cookies, no tracking.
- The only stored data is the game progress, in the player's own browser (`localStorage`), never sent anywhere.
- Third-party request: Google Fonts (font files). To remove it, self-host the fonts and drop the two Google domains from the CSP.

## Hosting notes
- **Vercel**: headers come from `vercel.json`. **Netlify / Cloudflare Pages**: from `_headers`.
- **GitHub Pages** cannot set headers; the `<meta>` CSP in `index.html` still applies (except `frame-ancestors`).

## Reporting
Found a problem? Open a GitHub issue without exploit details, or contact the team privately.
