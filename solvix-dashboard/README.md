# Solvix Dashboard

Admin/CMS dashboard for **Soldevix Solutions** — manages content for Topicler.com, Numoro.net and any website added later.

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Redux Toolkit + RTK Query

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

`.env.local` is already included with the defaults below. Change it only if your backend runs somewhere else.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_ENABLE_DEMO=true
```

Requires Node.js 18.18 or newer (Node 20+ recommended). Nothing else to install.

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Development server              |
| `npm run build`     | Production build                |
| `npm start`         | Serve the production build      |
| `npm run typecheck` | TypeScript check without build  |

---

## Two ways to use it

**1. Demo preview (no backend needed).** On `/login`, click **Preview as Admin** or **Preview as Editor**. The whole UI runs on clearly-labelled sample data held in the browser — every page, form, table, modal, upload and delete works. A yellow "Demo preview" banner is always visible. Data resets on page reload. Turn this off in production with `NEXT_PUBLIC_ENABLE_DEMO=false`.

**2. Live (your Express backend).** Sign in with a real account. This calls `POST /api/v1/auth/login`, which is the only dashboard route confirmed so far.

---

## Connecting the backend routes

Because the backend route files haven't been shared yet, **no API paths were guessed.** Every backend route lives in one file:

```
src/lib/api/endpoints.ts
```

- Confirmed: `auth.login` → `POST /auth/login`, `integration.blogs` → `GET /integration/blogs`
- Everything else is `null` = **NEEDS BACKEND ROUTE CONFIRMATION**

An unconfirmed route never makes a network request. Its page shows a "Backend route pending" state, and dashboard stats show "Needs endpoint" instead of a made-up number.

To connect one, replace `null` with the exact Express route:

```ts
"blogs.list":   { method: "GET",    path: "/blogs" },
"blogs.get":    { method: "GET",    path: "/blogs/:id" },
"blogs.update": { method: "PATCH",  path: "/blogs/:id" },
```

**Settings → Backend connection** shows which routes are confirmed vs pending.

### Things to verify against the backend

| What                                      | Where to adjust                                         |
| ----------------------------------------- | ------------------------------------------------------- |
| Login response shape (token + user)       | `src/features/auth/parseLoginResponse.ts`               |
| Response envelope / `_id` / populated refs | `src/lib/api/normalize.ts`                              |
| Request body field names                  | `toXPayload()` in `src/features/*/schema.ts`            |
| Blog content-block shape                  | `src/features/blogs/schema.ts`, `normalize.ts`          |
| Media upload field name (multer)          | `MEDIA_UPLOAD_FIELD` in `src/lib/api/endpoints.ts`      |
| Blog status values                        | `BLOG_STATUSES` in `src/features/blogs/schema.ts`       |
| A "current user" endpoint (`/auth/me`)    | `auth.me` in `endpoints.ts`                             |

The normalizers already accept the common shapes (`{ data: [...] }`, `{ data: { docs } }`, `_id` or `id`, populated or plain refs), so many backends work with no changes beyond `endpoints.ts`.

**CORS:** the backend must allow the dashboard origin (e.g. `http://localhost:3000`) and the `Authorization` header. The integration tester in Settings also sends `X-API-Key` / `X-API-Secret`.

---

## Auth & roles

- Login → JWT stored in `localStorage` (session restore) and a JS-readable cookie (so `src/middleware.ts` can guard routes before rendering).
- Every request gets `Authorization: Bearer <token>` centrally in `src/lib/api/baseQuery.ts`.
- A `401` or JWT expiry signs the user out and returns them to `/login?reason=expired`.
- Roles: `admin`, `editor`. One dashboard shell; navigation comes from `src/lib/navigation.ts`.

| Route                                   | Access          |
| --------------------------------------- | --------------- |
| `/dashboard`, `/dashboard/blogs/*`, `/dashboard/media/*`, `/dashboard/profile` | Admin + Editor |
| `/dashboard/websites/*`, `/dashboard/editors/*`, `/dashboard/settings` | Admin only |

Frontend role checks are **UI only**. The backend remains the authority on every request.

**Integration secrets** (`X-API-Secret`) are never placed in `NEXT_PUBLIC_*` variables. Websites should call `/integration/blogs` from their server.

---

## Project structure

```
src/
├── app/                  Routes (App Router)
│   ├── login/            Sign in + demo preview
│   ├── unauthorized/     403 page
│   └── dashboard/        Shared shell; websites, blogs, media, editors, settings, profile
├── components/
│   ├── ui/               Design system: Button, Field/Input/Select, Badge, Card, Modal,
│   │                     ConfirmDialog, Menu, DataTable, Pagination, Tabs, TagInput,
│   │                     StatCard, Skeletons, Empty/Error/Loading states
│   ├── dashboard/        DashboardShell, Sidebar, Navbar, Logo, ThemeToggle
│   ├── auth/             LoginForm, RoleGate, AdminOnly
│   ├── websites/ blogs/ media/ editors/ integrations/   Domain components
│   └── providers/        Redux, theme, toasts, session bootstrap
├── features/             Per-domain logic: auth slice/session, zod schemas, payload mappers
├── store/                Redux store + RTK Query (baseApi + one file per resource)
├── lib/                  config, API route registry, base query, errors, normalizers, demo data
├── hooks/  types/  utils/
└── middleware.ts         Route protection
```

Why `features/` as well as `components/`: components stay purely presentational, while each feature folder holds the non-UI rules for that domain (validation, request shapes, derived data). When a backend field name changes, the edit is in one place.

---

## Notes

- Tables search, filter, sort and paginate client-side over the list the API returns. If the backend paginates its list routes, pass page/limit through `params` in the relevant `store/api/*Api.ts` file.
- Published/Draft counts are derived from the blog list. For exact totals on a paginated list, add a stats endpoint.
- Light, dark and system themes are supported.
