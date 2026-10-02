# Solvix Dashboard

Admin/CMS dashboard for **Soldevix Solutions**, connected to the Solvix Express API in `../server`.

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Redux Toolkit + RTK Query

## Run it

```bash
# 1. Backend (needs server/.env with MONGODB_URI, JWT_SECRET, CLIENT_URL, CLOUDINARY_*)
cd server
npm install
npm run dev            # http://localhost:8000

# 2. Dashboard
cd solvix-dashboard
npm install
npm run dev            # http://localhost:3000
```

`.env.local` is included:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

The backend's `CLIENT_URL` must match the dashboard origin (`http://localhost:3000`) for CORS.
First run: open `/register` and create an admin account.

## How it talks to the backend

| Concern | Where |
| --- | --- |
| Every backend route (method, path, who may call it) | `src/lib/api/endpoints.ts` |
| Request pipeline, `Authorization: Bearer <token>`, 401 → sign-out | `src/lib/api/baseQuery.ts` |
| Raw backend response types → app types | `src/lib/api/mappers.ts` |
| Error messages (uses the backend's `message`) | `src/lib/api/errors.ts` |
| RTK Query slices + cache tags | `src/store/api/*Api.ts` |
| Form validation and request bodies | `src/features/*/schema.ts` |

### Auth
- `POST /auth/login` → JWT stored in localStorage + a cookie (so `src/middleware.ts` can guard routes).
- On load the session is re-validated with `GET /auth/me`.
- The backend has no logout route (stateless JWT); logout clears the token locally.
- `POST /auth/register` powers `/register` and "Add editor".

### Roles
| Route | Access |
| --- | --- |
| Dashboard, Blogs, Media, Profile | Admin + Editor |
| Websites, Editors, Settings | Admin only |

Editors only see websites, blogs and media for websites they are **assigned** to. Media delete is admin-only. The backend enforces all of this; the UI mirrors it.

### Website integration (API key + secret)
On a website's page, **Generate API credentials** calls `POST /website-integrations`. The backend creates the key and secret and returns them once; the dashboard shows them in a one-time dialog with copy buttons. External sites then call `/integration/blogs` and `/integration/media` with `X-API-Key` and `X-API-Secret` from their server. **Settings → Integrations** can test a key/secret pair.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
