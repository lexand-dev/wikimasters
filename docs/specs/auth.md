# Authentication

## Overview

User authentication via Better Auth with email/password and OAuth support.

## Requirements

- [x] Email/password sign-up and sign-in
- [x] Session management with secure cookies
- [x] Protected route guard at `(protected)/layout.tsx`
- [x] Optimistic auth redirect in `proxy.ts` (edge-safe, no DB)
- [x] E2E auth flows (sign-in/up/out, protected redirect)
- [ ] OAuth providers (Google, GitHub)
- [ ] Email verification
- [ ] Password reset

## Implementation

| Component | Location | Status |
|-----------|----------|--------|
| Auth config | `lib/auth.ts` | Done |
| Session helper | `lib/session.ts` | Done |
| Sign-in view | `features/auth/views/sign-in-view.tsx` | Done |
| Sign-up view | `features/auth/views/sign-up-view.tsx` | Done |
| User button | `features/auth/components/user-button.tsx` | Done |
| Proxy (middleware) | `proxy.ts` | Done |
| Protected layout | `app/(protected)/layout.tsx` | Done |
| E2E auth setup | `e2e/auth.setup.ts` | Done |
| E2E auth specs | `e2e/auth.spec.ts` | Done |

## Database

Tables: `user`, `session`, `account`, `verification` (Better Auth standard schema).

## Notes

- `proxy.ts` uses `getSessionCookie()` (cookie-presence check only, no DB hit).
- `(protected)/layout.tsx` is the authoritative DB-backed guard.
- Never call `getSession()` in proxy (runs on every request including prefetches).
