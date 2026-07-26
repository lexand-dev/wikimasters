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

## Next Steps

- [ ] Replace mock upload URL with Cloudinary/S3
- [ ] Add article search
- [ ] Add categories/tags
- [ ] OAuth providers (Google, GitHub)
- [ ] Email verification
- [ ] Password reset
