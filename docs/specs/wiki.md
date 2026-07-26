# Wiki

## Overview

Article management system with Markdown editing, file uploads, and author-based ownership.

## Requirements

- [x] Create articles with Markdown content
- [x] Edit own articles
- [x] Delete own articles
- [x] View articles (public landing, authenticated detail)
- [x] Image upload (Vercel Blob)
- [x] Slug generation with collision handling
- [x] Published/draft state
- [x] Pageviews (Upstash Redis SADD + INCR, 24h dedup, author excluded)
- [ ] Article search
- [ ] Categories/tags
- [ ] Comments
- [ ] Version history

## Implementation

| Component | Location | Status |
|-----------|----------|--------|
| Server actions | `features/wiki/actions/articles.ts` | Done |
| Upload action | `features/wiki/actions/uploads.ts` | Done (Vercel Blob) |
| Data layer | `features/wiki/data/articles.ts` | Done | cached |
| Pageviews action | `features/wiki/actions/pageviews.ts` | Done |
| Pageviews hook | `features/wiki/hooks/use-article-views.ts` | Done |
| Schema (Zod) | `features/wiki/schema/article-schema.ts` | Done |
| Editor component | `features/wiki/components/wiki-editor.tsx` | Done |
| Article viewer | `features/wiki/components/wiki-article-viewer.tsx` | Done |
| Wiki card | `features/wiki/components/wiki-card.tsx` | Done |
| Editor view | `features/wiki/views/editor-view.tsx` | Done |
| Article view | `features/wiki/views/article-view.tsx` | Done |

## Database

Table: `articles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | Auto-increment |
| `title` | text | Required |
| `slug` | text | Unique, auto-generated |
| `content` | text | Markdown |
| `imageUrl` | text | Optional |
| `published` | boolean | Default false |
| `authorId` | text FK | References `user.id`, cascade delete |
| `createdAt` | timestamp | Auto |
| `updatedAt` | timestamp | Auto |

Indexes: `articles_authorId_idx` on `authorId`.

## Authorization

- **Create**: Any authenticated user. `authorId` derived from session.
- **Edit/Delete**: Owner only. Enforced via `WHERE authorId = session.user.id`. Throws if 0 rows matched.
- **View**: Public landing shows published articles only. Authenticated users see all.

## Caching

`getArticles()` is cached with Upstash Redis (cache-aside + TTL + write-invalidation).

- **Key**: `wiki:articles:published:list`
- **TTL**: 5 minutes (`ex` 300s)
- **Invalidation**: `revalidateArticlesCache()` is called after `createArticle`, `updateArticle`, and `deleteArticle` so the published list never serves stale rows.
- **Resilience**: cache read/write failures are caught and fall through to the DB; invalidation failures are best-effort (the TTL still bounds staleness).
- **Client**: singleton in `lib/redis.ts` (env-gated with `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
- **`getArticleById` is intentionally uncached** — single-row detail is cheap and ownership/draft visibility favors freshness.

## Pageviews

Per-article view counter with a 24-hour unique-viewer dedup window, backed by Upstash Redis.

**Keys**
- `wiki:article:{id}:views` — integer counter (atomic `INCR`)
- `wiki:article:{id}:viewers` — set of `user.id`s seen in the last 24h (atomic `SADD` + `EXPIRE`)

**Flow** (`incrementArticleViews(id, authorId)`)
1. `requireUser()` → `user.id` (throws if unauthenticated; matches the unified server-action style).
2. If `user.id === authorId` → return `0` (authors don't inflate their own counters).
3. Pipeline `[SADD viewers <userId>, EXPIRE viewers 86400]` — single round trip. SADD returns `1` if the user is new to the set, `0` if already present (returning visitor).
4. If SADD returned `1` → `INCR views` and return the new count. If `0` → return `0` (no double-count); the client hook keeps the SSR-provided value.

**Resilience**
- All Redis calls are wrapped in try/catch; an Upstash outage cannot block article rendering.
- `getArticleViews(id)` (used for SSR initial display) is also fail-open.

**Celebration email**
- When a new unique viewer pushes the count across a milestone (`10`, `100`, `1_000`, `10_000`), the author is emailed via Resend.
- Implemented in `features/wiki/actions/send-celebration-email.ts`; called fire-and-forget from `incrementArticleViews` so Resend latency never blocks the page.
- Idempotency key: `celebration-email/{articleId}/{pageviews}` — retries are safe.
- Sender: `WikiFlow <onboarding@resend.dev>` (sandbox; will only deliver to the Resend account owner until a verified domain is set).

**Hook** (`useArticleViews(articleId, initialViews, authorId)`)
- Fires `incrementArticleViews` once on mount.
- `useRef` guard suppresses a duplicate action call when StrictMode double-invokes effects in dev (no behavior change in prod; server-side SADD is the real correctness backstop).
- `views` state is seeded with the SSR value and only updates when the action returns a strictly greater count.

**Tradeoffs**
- 24h window picks "unique daily viewers" — refreshing or returning same-day counts as 1 visit, returning the next day counts again.
- The `viewers` set self-evicts via TTL; no nightly cleanup needed.
- Pipeline (SADD + EXPIRE) is **not atomic across the two commands**, but SADD's idempotence makes the race safe: concurrent new visitors each get SADD=1 → both INCR → both counted. That's the correct behavior (two unique people did visit).
- Counters live only in Redis for now. A daily snapshot to Postgres can be added later if analytics need SQL-backed rollups.

## Form Validation

Client-side: `react-hook-form` + `zodResolver(articleSchema)`.
Server-side: `createArticleSchema.parse()` / `updateArticleSchema.parse()`.

## Pending

- Migrations: run `bun run db:generate` before deploys, then `bun run db:migrate`; keep `db:push` for local dev only.
- Add search functionality.
- Add categories/tags for organization.
