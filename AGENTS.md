<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tooling

- **Package manager**: use `bun` by default (`bun install`, `bun add`, `bun run`). Do not use npm/yarn/pnpm.

# Conventional Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) for every commit. The goal is to group changes by **logical intent** so each commit is reviewable in isolation.

## Commit types

| Type       | Purpose                                              |
| ---------- | ---------------------------------------------------- |
| `feat`     | New feature or behavior                              |
| `fix`      | Bug fix                                              |
| `docs`     | Documentation only (README, AGENTS.md, comments)   |
| `style`    | Formatting/style changes with no logic change        |
| `refactor` | Code restructure without changing behavior           |
| `perf`     | Performance improvement                              |
| `test`     | Add or update tests                                  |
| `build`    | Build system, dependencies, tooling config             |
| `ci`       | CI/CD configuration changes                          |
| `chore`    | Maintenance or miscellaneous                       |
| `revert`   | Revert a previous commit                             |

## Grouping principles

- **Group by intent, not by file.** A commit should answer "why was this change made?", not "which files changed?".
- **One logical change per commit.** A teammate should be able to read the diff and understand the change without relying on later commits.
- **Avoid mixing commit types.** Do not combine a `feat` and a `refactor` in the same commit — it hides what is behavioral vs. structural.
- **Keep docs with docs.** README/AGENTS.md changes usually deserve their own `docs` commit unless they are trivial typos.
- **Stage renames together.** When moving a file, stage the delete and the add in the same commit so Git detects the rename.

## Workflow before committing

Always run checks on the changed files first:

```bash
bun run format
bun run lint
bun run typecheck
```

Fix only the issues in the files you are committing. Do not rewrite third-party or auto-generated code (e.g. `components/ui/*`) to resolve pre-existing lint warnings.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- Use present tense and imperative mood: "add proxy" not "added proxy" or "adds proxy".
- Keep the description under 72 characters.
- Reference issues when relevant: `Closes #123`, `Refs #456`.

# Development Workflow

When adding a feature or fixing a bug:

1. **Plan**: Read relevant specs in `docs/specs/`. Identify affected files and dependencies.
2. **Implement**: Follow feature-sliced architecture. Schema-first for forms/actions.
3. **Validate**: Run `bun run format && bun run lint && bun run typecheck`. Fix issues in changed files only.
4. **Document**: Update `docs/specs/{feature}.md` requirements checklist. Add session entry to `docs/changelog.md`.
5. **Commit**: Use conventional commits. One logical change per commit.

# Proxy (formerly Middleware)

Next.js 16 renamed `middleware.ts` → `proxy.ts` (root-level, same level as `app/`). Use it for **optimistic** auth redirects only — no DB queries.

- Use `getSessionCookie()` from `better-auth/cookies` — cookie-presence check, edge-safe, no DB.
- `app/(protected)/layout.tsx` remains the authoritative DB-backed guard; proxy is the optimistic pre-filter (avoids flash of unauthenticated content / protects prefetches).
- Never call `getSession()` in proxy (DB hit on every request, including prefetches).
- Matcher must exclude `api/*` so Better Auth endpoints aren't intercepted.

# Project Architecture

This project uses **route groups** for auth boundaries and **feature-sliced modules** for code organization. Follow these conventions when adding routes, features, or components.

## Route groups (URL-agnostic auth boundaries)

```
app/
  (auth)/        # public auth routes; URL unchanged (/sign-in, /sign-up)
  (protected)/   # authenticated routes; layout is the auth gate
```

- `(auth)` — minimal layout; used for sign-in / sign-up. No session required.
- `(protected)` — `layout.tsx` calls `getSession()` once and `redirect("/sign-in")` if there is no session. **Do not re-check the session inside pages under this group** — the layout is the single guard.
- Folders in parentheses are omitted from the URL (`/wiki/1`, not `/protected/wiki/1`).
- Public routes (landing, etc.) live directly under `app/` and are NOT wrapped by either group.

## Feature modules (`features/{name}/`)

Each feature is a vertical slice owning all code for one capability. `app/` stays a thin routing/data-fetching shell that imports a feature `view`.

```
features/{name}/
  views/      route-level screen compositions rendered by app/ pages
  components/ reusable pieces scoped to this feature (NOT global UI)
  types/      TS types, ONLY when not derivable from schema/db
  schema/     zod schemas — single source of truth for forms + actions
  actions/    "use server" mutations, gated by getSession()
```

### Rules

- **views vs components**: `views/` = route-level screen comps; `components/` = smaller reusable pieces within the feature. Pages import views, never internal components directly.
- **schema-first**: define zod once in `schema/` → reuse in client form validation AND server actions → derive types via `z.infer`. Do not hand-duplicate types that the schema already expresses.
- **actions are guarded**: every `"use server"` action in `actions/` must call `getSession()` and throw/redirect on no session (honors the Vercel `server-auth-actions` rule). Actions also parse inputs through the shared schema (`schema.parse(...)`).
- **types/ is optional**: only add when the type cannot be derived from zod or the DB schema.
- **No barrel files**: import the exact module (`from "@/features/wiki/views/article-view"`, not `from "@/features/wiki"`). Honors Vercel `bundle-barrel-imports`.
- **Global UI stays in `components/ui/`** (shadcn primitives); shadcn-augmented feature components go in `features/{name}/components/`.

## Page → feature flow

A page in `app/(protected)/...` should:
1. Fetch data server-side (DB / API), reading the session from the `(protected)` layout boundary.
2. Import and render the matching feature `view`, passing props in.
3. Contain NO business logic / form state — that lives in the view/component.

## Data flow example

```
schema (zod) ──► form (client validation)
         └────► server action (parse + getSession + DB write)
types ◄── z.infer(schema)
view ◄── page passes props
component ◄── view composes
```
