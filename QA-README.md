# Flashyre QA – setup and commands

Everything lives in `angular/Flashyre-Angular/` (e2e, api, tools, load) plus the Django `adb_super_admin/qa` package.

## One-time setup
1. `npm i -D @playwright/test @axe-core/playwright newman newman-reporter-htmlextra` then `npx playwright install`
2. Merge `package-scripts.json` ("scripts") into package.json.
3. Create the QA accounts (local and dev): in the Django folder run
   `python manage.py create_qa_accounts --password "<choose one>"`
   Creates qa.recruiter1 / recruiter2 / admin / super / client @flashyre-qa.example. On prod create them by hand in User Management.
4. Copy `e2e/config/.env.example` to `.env.local`, `.env.dev`, `.env.prod` and fill in URLs and `QA_PASSWORD`. Never commit them.
5. Login uses the token API, so Cloudflare Turnstile is not involved. Set `QA_LOGIN_MODE=ui` only if you want to test the real login form (needs Turnstile test keys locally).

## Commands
| Goal | Command |
|---|---|
| Smoke, local / dev / prod | `npm run e2e:smoke:local` / `e2e:smoke:dev` / `e2e:smoke:prod` |
| Everything, all 5 browsers, local | `npm run e2e:full:local` |
| Faster: Chromium only | `npm run e2e:chromium:local` |
| Regression on dev | `npm run e2e:regression:dev` |
| Non-functional (perf, a11y, resilience, XSS) | `npm run e2e:nonfunctional:local` |
| API smoke / full / data-driven | `npm run api:smoke:dev`, `api:full:local`, `api:data:local` |
| Load test (local only, needs k6) | `npm run load:local` |
| Excel round trip (optional) | `npm run data:to-excel candidate` / `data:from-excel candidate` |
| Playwright HTML report | `npm run e2e:report` |

Prod accepts smoke only, Chromium only, and asks you to type "prod". All data is tagged and removed at the end (also by the global cleanup, and by the Test Lab API `qa/cleanup/`).

## Scenarios
Add or change cases in `e2e/data/candidate.json` (one file per page). `knownIssue` marks a case that asserts correct behaviour and stays red until that bug is fixed.
