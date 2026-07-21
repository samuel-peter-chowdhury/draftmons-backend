# Backend Deployment (as-built)

Production facts for the Draftmons Express API. For the full from-scratch
runbook see `../DEPLOYMENT.md` in the parent directory (note: the parent dir is
**not** version-controlled, so this file is the durable copy of what matters).

First deployed: **2026-07-21**.

## Where it runs

| Thing | Value |
|---|---|
| Host | **Railway** (Hobby plan, ~$5/mo) — account `samuel.peter.chowdhury@gmail.com` |
| Project | `proactive-stillness` |
| Service | `draftmons-backend` |
| Region | `sfo` (DB/Redis are `us-east-1` — a US-East region would lower latency; not done yet) |
| Public URL | `https://draftmons-backend-production.up.railway.app` |
| Source | GitHub `samuel-peter-chowdhury/draftmons-backend`, **auto-deploys on push to `main`** |
| Build | Nixpacks auto-detect → `npm run build` (tsc) → `npm start` (`node dist/server.js`). No `railway.json`/`Dockerfile`/`Procfile`. |
| DB | **Neon** Postgres (`us-east-1`), database `neondb`, **direct** host (not the pooler — TypeORM has its own pool and migrations need a session connection) |
| Sessions | **Upstash** Redis (`us-east-1`), TLS `rediss://` (already wired in `app.ts`) |

## Environment variables (Railway → Settings → Variables)

Required (server hard-throws in prod without the Google/CLIENT ones — `server.ts`):

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT` (5432), `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` — from Neon (direct host)
- `REDIS_HOST`, `REDIS_PORT` (6379), `REDIS_PASSWORD` — from Upstash
- `SESSION_SECRET` — required, no fallback (`openssl rand -hex 32`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` = **`https://draftmons-frontend.vercel.app/api/auth/google/callback`**
  ⚠️ This points at the **frontend** domain, not the backend — see "Cross-domain
  session fix" below. It must also be registered in the Google Cloud Console OAuth client.
- `CLIENT_URL` = **`https://draftmons-frontend.vercel.app`** — exact origin, **no trailing slash**
  (backend CORS is a strict single-origin allowlist, `app.ts`).
- **Do NOT set `PORT`** — Railway injects it; the app reads `process.env.PORT`.

Optional (Discord — currently **UNSET / deferred**; service logs "disabled" and
boots fine): `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
`DISCORD_CALLBACK_URL`, `DISCORD_GUILD_ID`. To enable, set these and add a Discord
production redirect URI.

## Migrations

`synchronize` is always false — schema only changes via migrations. Run them
against Neon through Railway's env (so local `.env` is never pointed at prod):

```bash
railway link --project proactive-stillness --service draftmons-backend --environment production
railway run npm run migration:run
```

`NODE_ENV=production` must be present in the injected env — `database.config.ts`
gates `ssl` on it, and Neon **requires** SSL.

## Cross-domain session fix (important)

Frontend (`*.vercel.app`) and backend (`*.up.railway.app`) are different sites,
so a backend-domain session cookie is third-party and the frontend's edge
middleware can't see it → login bounces to `/?next=`. The fix lives on the
**frontend** (a `next.config.ts` rewrite proxying `/api/*` to this backend, making
the cookie first-party). The backend's only role in the fix is
`GOOGLE_CALLBACK_URL` pointing at the frontend proxy path (above). No backend
code change was needed. Full detail in the frontend repo's `DEPLOYMENT.md`.

## Verify

```bash
curl https://draftmons-backend-production.up.railway.app/health   # {"status":"ok","db":"connected",...}
railway logs   # look for "Redis connected successfully", no env-validation throw
```
