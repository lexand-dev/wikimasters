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

## Form Validation

Client-side: `react-hook-form` + `zodResolver(articleSchema)`.
Server-side: `createArticleSchema.parse()` / `updateArticleSchema.parse()`.

## Pending

- Migrations: run `bun run db:generate` before deploys, then `bun run db:migrate`; keep `db:push` for local dev only.
- Add search functionality.
- Add categories/tags for organization.
