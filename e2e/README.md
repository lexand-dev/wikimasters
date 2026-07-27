# E2E tests (Playwright)

End-to-end coverage for WikiFlow auth and article CRUD.

## Layout

```
e2e/
  global-setup.ts      # mkdir auth dir, resolve E2E_* env defaults
  global-teardown.ts   # wipe auth state in CI
  auth.setup.ts        # setup project: API sign-up/sign-in → storageState
  auth.spec.ts         # unauthenticated flows (sign-in/up, redirects, sign-out)
  articles.spec.ts     # authenticated flows (list, create, edit, delete)
playwright.config.ts
playwright/.auth/      # gitignored storageState (written by auth.setup.ts)
```

## Projects

| Project     | Matches              | Auth state              | Purpose                          |
| ----------- | -------------------- | ----------------------- | -------------------------------- |
| `setup`     | `auth.setup.ts`      | writes storageState     | one-time login via Better Auth   |
| `auth`      | `auth.spec.ts`       | none                    | public + login UI flows          |
| `chromium`  | `articles.spec.ts`   | loads storageState      | authenticated article CRUD       |

`chromium` depends on `setup`, so auth is established once and reused.

## Prerequisites

1. A running Postgres (Neon) and Redis reachable via `.env`
2. `AI_GATEWAY_API_KEY` set — article create/update call the summarize service
3. Chromium installed: `bunx playwright install chromium`

Optional overrides (defaults work out of the box):

```bash
E2E_USER_EMAIL=e2e@wikiflow.test
E2E_USER_PASSWORD=e2e-test-password-123
E2E_USER_NAME=E2E Tester
BASE_URL=http://localhost:3000
PORT=3000
```

## Commands

```bash
# Full suite (starts `bun run dev` unless one is already up)
bun run test:e2e

# Interactive UI mode
bun run test:e2e:ui

# Headed browser
bun run test:e2e:headed

# Only auth / only articles
bunx playwright test --project=auth
bunx playwright test --project=chromium

# Tags
bunx playwright test --grep @smoke
bunx playwright test --grep @slow

# Last HTML report
bunx playwright show-report
```

## Notes

- **Auth reuse**: `auth.setup.ts` signs in via `/api/auth/sign-in/email` (not the UI) and writes `playwright/.auth/user.json`. UI login is covered separately in `auth.spec.ts`.
- **AI latency**: create/update call `summarizeArticle`; the CRUD test has a 90s timeout and is tagged `@slow`.
- **Isolation**: each CRUD run uses a unique title (`Date.now()`). Sign-up tests use unique emails so they never collide with the shared e2e user.
- **webServer**: reuses an existing dev server locally (`reuseExistingServer: !CI`). In CI it builds + starts production.
