<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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
