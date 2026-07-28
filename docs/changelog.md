# Changelog

## Session 1 — Initial Setup

- Next.js 16 project scaffold with Turbopack
- Better Auth integration (email/password)
- Drizzle ORM + Neon Postgres
- shadcn/ui + Tailwind CSS 4
- Route groups: `(auth)` for public, `(protected)` for authenticated
- Proxy (middleware) for optimistic auth redirects

## Session 2 — Wiki Feature (Mock Data)

- Article CRUD with mock data
- Markdown editor (`@uiw/react-md-editor`)
- Article viewer with Markdown rendering
- Wiki card component for landing page
- Zod schemas for validation

## Session 3 — Database Integration

- Replaced mock data with real Drizzle queries
- `getArticles()` and `getArticleById()` in data layer
- Server actions wired to DB (insert/update/delete)
- `notFound()` guards on view/edit pages
- Slug generation with `createSlug()` helper

## Session 4 — Security & Code Review Fixes

**Critical:**
- Fixed silent authZ failure: `updateArticle`/`deleteArticle` now use `.returning()` and throw when 0 rows matched
- Added ownership check on edit/view pages: `article.authorId === session.user.id`
- Fixed slug collisions: appended timestamp disambiguator
- Fixed `+id` NaN coercion: validate with `Number.isFinite()` and call `notFound()`

**Warnings:**
- Filtered published articles on public landing page
- Restored Zod client validation in `wiki-editor.tsx`
- Refresh slug on `updateArticle`
- Used SQL `substring` for excerpt + added `orderBy` in `getArticles()`
- Removed dead `userId` prop from `WikiEditor`
- Restricted file input to single file
- Replaced `alert()` with inline error banner
- Fixed stale stub log message

**Nitpicks:**
- Added index on `articles.authorId`
- Moved `deleteArticle` log before DB call
- Accepted `published` via schema in `createArticle`
- Added TODO comment for `uploadFile` mock URL
- Tightened `updateArticleSchema` to disallow empty-body updates

## Session 5 — React Hook Form Integration

- Added `react-hook-form` + `@hookform/resolvers`
- Refactored `wiki-editor.tsx` to use `useForm` + `zodResolver(articleSchema)`
- Title uses `register()`, MDEditor uses `Controller`
- Errors from `formState.errors`, submit errors from `setError("root")`
- Simplified `updateArticle` action: removed `if` guards (schema guarantees all fields)
- Extracted shared `articleSchema` in `article-schema.ts`
- `updateArticleSchema` now requires all fields (no partial)

## Session 6 — View Milestone Celebration Emails

- Pageview counter in Redis (`wiki:article:{id}:views`) with 24h unique-viewer dedup set
- `incrementArticleViews(id, authorId)` — author self-views excluded; 24h SADD dedup
- `sendCelebrationEmail` fires from `incrementArticleViews` on milestones (10, 100, 1k, 10k)
- Joins `articles.authorId → user.email` to find the recipient
- Idempotency key `celebration-email/{articleId}/{pageviews}` for safe retries
- Fire-and-forget; errors logged, never thrown
- Moved email body into `features/wiki/emails/celebration-template.tsx` rendered via `@react-email/render`; action now composes the template with `React.createElement` and reads `user.name` for the greeting. Article URL source switched from `BETTER_AUTH_URL` to `VERCEL_URL`.

## Session 7 — AI Article Summaries

- Added `summary` (nullable text) column to `articles`
- `summarizeArticle(title, content)` service using `ai` SDK + Vercel AI Gateway `openai/gpt-5-nano`
- `createArticle` / `updateArticle` actions now generate and persist the summary in the same write
- `getArticles` reads the new `summary` column (replaces the SQL `substring` excerpt); `ArticleSummary.summary` is `string | null`
- `WikiCard` falls back to `"No summary available"` when summary is null
- `app/api/summary/route.ts` cron endpoint scans `summary IS NULL` rows, backfills them, and invalidates the published-list cache; gated by `Bearer ${CRON_SECRET}` outside development
- `vercel.json` schedules the route weekly (`0 0 * * 0`)
- Per-row failures in the cron loop are caught and logged; one bad row never aborts the batch

## Session 8 — Testing (Vitest + Playwright)

- Vitest: unit + component projects, `@` alias, `server-only` stub, shared `test/setup.ts`
- Unit tests for article actions (`create` / `update` / `delete`) under `test/unit/`
- Playwright E2E: setup project + storageState, `auth` + `chromium` projects
- E2E coverage: sign-in/up/out, protected redirect, article create → edit → delete
- Scripts: `test`, `test:unit`, `test:e2e`, `test:e2e:ui`

## Next Steps

- [ ] Replace mock upload URL with Cloudinary/S3
- [ ] Add article search
- [ ] Add categories/tags
- [ ] OAuth providers (Google, GitHub)
- [ ] Email verification
- [ ] Password reset
