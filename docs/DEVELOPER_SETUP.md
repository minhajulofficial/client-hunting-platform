# DEVELOPER SETUP

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ (tested on 24.19.0) |
| npm | 10+ (tested on 11.17.0) |
| Git | 2.40+ |
| Chrome | any recent version (MV3) |

Accounts: GitHub, Supabase, Google Cloud, Vercel. OpenAI optional.

---

## 1. Clone and install

```bash
git clone https://github.com/minhajulofficial/client-hunting-platform.git
cd client-hunting-platform
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required because Next 16 / React 19 are newer than some peer ranges.

---

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```env
# Database (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App (required)
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=you@gmail.com

# Gmail (required for email features)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback

# AI (optional — free mode without it)
AI_API_KEY=
AI_MODEL=gpt-4o-mini

# Optional paid providers
EMAIL_VERIFIER_API_KEY=
META_APP_ID=
META_APP_SECRET=
```

Rules:
- Anything **without** `NEXT_PUBLIC_` is server-only and must never reach the browser or the extension.
- `.env.local` is git-ignored. Never commit it.
- If `ADMIN_EMAILS` is empty, any Google account can sign in (development only).

The app boots without Supabase: pages render a **NOT CONFIGURED** banner instead of crashing, and `next build` still succeeds.

---

## 3. Supabase setup

1. Create a project at supabase.com.
2. **SQL Editor** → paste all of `supabase/schema.sql` → **Run**.
   Creates 20 tables, indexes, and Row Level Security policies.
3. **Authentication → Providers → Google** → enable, paste the Google client id/secret.
4. **Authentication → URL Configuration** → add your site URL and redirect URLs.
5. **Project Settings → API** → copy URL, `anon`, `service_role` into your env.

RLS is enabled on every user-owned table. `service_role` bypasses it — that key stays server-side only.

---

## 4. Google OAuth + Gmail API

1. console.cloud.google.com → new project.
2. **APIs & Services → Library** → enable **Gmail API**.
3. **OAuth consent screen** → External → add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   → add your address under **Test users**.
4. **Credentials → Create → OAuth client ID → Web application**, authorised redirect URIs:
   ```
   http://localhost:3000/api/integrations/gmail/callback
   https://YOUR_DOMAIN/api/integrations/gmail/callback
   https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback
   ```
5. Copy the client id/secret into env **and** into Supabase's Google provider.

---

## 5. AI setup

- Leave `AI_API_KEY` empty → `FreeAIProvider`: resolves `{{variables}}` from real lead data, never fabricates facts.
- Set `AI_API_KEY` → `OpenAIProvider` (`AI_MODEL`, default `gpt-4o-mini`).
- Add another vendor by implementing `AIProvider` in `src/lib/ai/providers/` and registering it in `src/lib/ai/service.ts`. No CRM code changes needed.

---

## 6. Meta setup (optional, P2)

Requires an approved Meta app with messaging permissions. Until `META_APP_ID`/`META_APP_SECRET` are set and reviewed, `/api/integrations/meta` reports not connected. There is deliberately no scraping or unauthorised DM path.

---

## 7. Local development

```bash
npm run dev     # http://localhost:3000
npm run build   # production build + TypeScript check
npm start       # serve the production build
npm run lint
```

Verify:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/extension/health
```

---

## 8. Database migration

`supabase/schema.sql` is idempotent (`create table if not exists`). Re-run it after pulling schema changes. Policy statements fail if a policy already exists — drop it first:

```sql
drop policy if exists "users own leads" on leads;
```

---

## 9. Production deployment (Vercel)

1. vercel.com → **Add New Project** → import the repo.
2. Add every variable from `.env.local`, with:
   ```
   NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
   GOOGLE_REDIRECT_URI=https://YOUR_DOMAIN/api/integrations/gmail/callback
   ```
3. Deploy.
4. Add the production URL to Supabase **URL Configuration** and to the Google **redirect URIs**.
5. Confirm `https://YOUR_DOMAIN/api/health` reports every `has_*` flag as `true`.

---

## 10. Extension build and configuration

No build step — it is plain MV3 JavaScript.

1. `chrome://extensions` → **Developer mode** → **Load unpacked** → select `extension/`.
2. Popup → **CRM URL** → your deployed URL → **Save CRM URL**.
   (Default lives in `extension/config.js`.)
3. **Connect to CRM** → **Test Connection**.

Permissions requested and why:

| Permission | Reason |
|---|---|
| `storage` | store the session token and CRM URL |
| `activeTab`, `tabs` | read the tab you explicitly act on |
| `scripting` | re-inject `content.js` when the page loaded before install |
| host permissions | call your CRM API and read the page you open |

The extension holds no API keys and never talks to the database directly — every write goes through the authenticated backend.

---

## 11. Adding a new source adapter

1. Create `src/lib/sources/<id>/adapter.ts` extending `BaseSourceAdapter`.
2. Implement `search()` and `extract()`; override `normalize()` / `validate()` if needed.
3. Register it in `src/lib/sources/registry.ts`.
4. Set `metadata.supported` only after a real manual test.
5. Add extraction logic to `extension/content.js` if it is DOM-based.
6. Document it here and in `docs/ARCHITECTURE.md`.

Never hard-code selectors outside the adapter or `content.js`.

---

## 12. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `next build` fails on TypeScript | Run `npx tsc --noEmit`. Never mutate a typed object literal — build `Record<string, unknown>` instead (this exact bug broke earlier deploys). |
| Vercel build fails, local passes | Missing dependency in `package.json` (e.g. `@types/papaparse`) or an env-dependent import at module scope. |
| 401 from every API | Not logged in, or expired extension token. `resolveUser()` enforces `expires_at`. |
| Pages 307 to `/login` | Correct behaviour when unauthenticated. |
| Supabase returns empty arrays, no error | Missing RLS policy. Re-run `supabase/schema.sql`. |
| `redirect_uri_mismatch` | The redirect URI must match Google Cloud exactly, including protocol and trailing path. |
| Extension "Cannot read this page" | Reload the tab; the content script re-injects automatically on the next attempt. |
| Gmail send fails | Re-run **Test Gmail Connection**; reconnect if the refresh token was revoked. |

Logs: `/admin/logs` (activity + system), `/admin/system-health`, `/admin/debug`, plus Vercel and Supabase logs.
