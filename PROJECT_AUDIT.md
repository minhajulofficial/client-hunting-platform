# PROJECT AUDIT — Client Hunting Platform
Generated: 2026-08-28 — Strict Spec Compliance Check

> This audit was performed before any new P0 fixes. It lists what WORKS, what is MOCK/DEMO, and what is BROKEN.

---

## 1. Current Frontend
**Stack:** Next.js 16.3.3 + React 19.2.8 + TypeScript + Tailwind 4 — `package.json:11-19`, light theme only after `2b2fd6b` — `src/app/globals.css:1`, `src/components/layout/AppShell.tsx:1`
**Routes:** `/`, `/login`, `/dashboard`, `/projects`, `/projects/[id]`, `/leads`, `/leads/[id]`, `/campaigns`, `/campaigns/[id]`, `/inbox`, `/templates`, `/ai`, `/integrations`, `/settings`, `/settings/api`, `/settings/extension`, `/admin/logs` — all exist but many are static.
**Real pages:** `/login` real OAuth `src/app/login/page.tsx:7`, `/leads` server-filtered `src/app/(app)/leads/page.tsx:17`, `/dashboard` live counts if configured `src/app/(app)/dashboard/page.tsx:10-15`
**Mock pages:** `/campaigns` static 150 recipients `src/app/(app)/campaigns/page.tsx:5`, `/templates` no CRUD `src/app/(app)/templates/page.tsx:4`, `/settings/*` no handlers `src/app/(app)/settings/extension/page.tsx:1`
**UI components:** `Card`, `StatCard`, `Badge`, `Button`, `SetupBanner` — light only, no dark `src/components/ui/*`

---

## 2. Current Backend
**Pattern:** Next.js App Router API — `src/app/api/*` (21 routes), no separate Node server.
**Auth middleware:** `src/middleware.ts:1` → `src/lib/supabase/middleware.ts:1` — CORS `*` for `/api/*`, `OPTIONS 204`, skips auth if Supabase not configured `src/lib/supabase/middleware.ts:8-10`
**Services:** `src/lib/sources/*` (8 adapters, all stub `return []` `src/lib/sources/website/adapter.ts:7`), `src/lib/verification/*` (FreeEmailVerifier heuristic `src/lib/verification/email.ts:15`), `src/lib/ai/*` (FreeAIProvider substitution `src/lib/ai/providers/free.ts:5`), `src/lib/gmail/client.ts:1` (real Gmail send via `googleapis`), `src/lib/scoring/index.ts:1`, `src/lib/deduplication/index.ts:1` (never called by APIs), `src/lib/queue/campaign.ts:1` (comment only)
**Validation:** `zod` installed `package.json:21` but never used — all `POST` routes spread `...body` without Zod.
**Logging:** `system_logs` + `activity_logs` tables exist but only written by `extension/import` `src/app/api/extension/import/route.ts:35` and `gmail/callback`.

---

## 3. Current Database
**File:** `supabase/schema.sql:1` (111 lines) — 18 tables:
`users`, `projects`, `leads`, `tags`, `lead_tags`, `lead_verifications`, `lead_sources`, `campaigns`, `campaign_recipients`, `email_threads` (unique `gmail_thread_id`), `email_messages`, `email_templates`, `ai_prompts`, `ai_generations`, `integrations`, `oauth_accounts` (plain `access_token` `supabase/schema.sql:92`), `extension_sessions`, `activity_logs`, `system_logs`, `followups`
**RLS:** Enabled on 8 tables but policies only for `projects`, `leads`, `campaigns` `supabase/schema.sql:109-111` — other tables deny-all for anon, bypass for service_role.
**Indexes:** Only `leads(user_id, project_id, email, status)` `supabase/schema.sql:70-73`
**Mock client:** `src/lib/supabase/server.ts:3-18` returns mock chain with empty `[]` when env missing — build passes but data empty, amber banner shown.

---

## 4. Existing Authentication
**Supabase SSR:** `createServerClient` + `cookies()` `src/lib/supabase/server.ts:3`, `createBrowserClient` `src/lib/supabase/client.ts:3`, `exchangeCodeForSession` in `src/app/api/auth/callback/route.ts:7`
**Google OAuth:** `/login` `supabase.auth.signInWithOAuth({provider:'google'})` → redirect `/api/auth/callback` → `/dashboard`
**Admin gate:** `ADMIN_EMAILS` env `src/lib/auth.ts:1`, `src/lib/supabase/middleware.ts:22-23` — if empty, any Google user is admin.
**Session:** `oauth_accounts` plain tokens, `extension_sessions` `crypto.randomUUID()` 7d expiry `src/app/api/extension/session/route.ts:10` — expiry never checked on import `src/app/api/extension/import/route.ts:17`
**Missing:** No logout UI, no session refresh, no CSRF state for Gmail OAuth, no role table.

---

## 5. Existing APIs
**Health:** `GET /api/health` `src/app/api/health/route.ts:2` returns `supabase_configured` + env flags, CORS `*`
**Projects:** `GET/POST /api/projects` `src/app/api/projects/route.ts:3` — POST requires `getUser()`, GET open, no Zod, `...body` spread.
**Leads:** `GET /api/leads/search` open, `POST /api/leads/import` allows `user_id: null` `src/app/api/leads/import/route.ts:32` — orphan leads, dedup only email.
**Extension:** `POST /api/extension/session` (auth required) + `POST /api/extension/import` (Bearer OR session) `src/app/api/extension/import/route.ts:14-19`, CORS `*`, expiry ignored.
**Campaigns:** `GET/POST /api/campaigns`, `POST /api/campaigns/recipients` (no auth, IDOR `src/app/api/campaigns/recipients/route.ts:3`), `POST /api/campaigns/send` (max 20 QUEUED `src/app/api/campaigns/send/route.ts:10`, skips non-VERIFIED, 800ms rate limit `src/app/api/campaigns/send/route.ts:27`)
**Emails:** `POST /api/emails/send` (real Gmail if token else queued `src/app/api/emails/send/route.ts:14-24`), `POST /api/emails/sync` (7d inbox, 5 messages max `src/app/api/emails/sync/route.ts:12-14`)
**AI:** `POST /api/ai/{generate,personalize,analyze}` open, no auth/rate limit, `new AIService()` per request.
**Gmail:** `GET /api/integrations/gmail`, `GET /api/integrations/gmail/auth` (redirect `offline+consent` `src/app/api/integrations/gmail/auth/route.ts:12`), `GET /api/integrations/gmail/callback` (plain token storage)
**Meta:** `GET/POST /api/integrations/meta` stub `saved_stub` `src/app/api/integrations/meta/route.ts:7`
**Inbox:** `GET /api/inbox` open, `select('*, email_messages(*)')` `src/app/api/inbox/route.ts:5`

---

## 6. Existing Chrome Extension
**Manifest:** MV3 `extension/manifest.json:2-10` — `permissions storage/activeTab/scripting`, `host_permissions https://*/*`, `action popup.html`, `background.js` no-op `extension/background.js:1-4`, `content_scripts https://*/*`
**Popup:** `extension/popup.html:1` — single project option hard-coded, Country/Location/Niche inputs, checkboxes `Sources/Data` ignored `extension/popup.html:8-9`, results `Found:87 Usable:61` hard-coded `extension/popup.html:11`
**Popup.js:** `extension/popup.js:1-3` `API=vercel.app` / `LOCAL_API`, `START CLIENT HUNT` tries `tabs.sendMessage({EXTRACT_WEBSITE})` `extension/popup.js:9`, fallback demo leads `ABC Dental/Bright Smile` `extension/popup.js:12-15`, import via `fetch /api/extension/import` `Bearer token` `extension/popup.js:29-33`, `Reconnect` POST `/api/extension/session` `extension/popup.js:40-43`
**Content:** `extension/content.js:1-18` regex emails `content.js:5`, phones `content.js:6`, social `content.js:7`, `businessName` from `h1/title` `content.js:9`, listener `EXTRACT_WEBSITE` `content.js:19`
**Status:** IDs `IDLE→ERROR` required by spec are not implemented — only `✓ found N` shown.

---

## 7. Existing Integrations
**Gmail:** `googleapis@159` `package.json:15`, OAuth2 `src/lib/gmail/client.ts:2`, `sendEmailViaGmail` base64 `src/lib/gmail/client.ts:13`, `listMessages`/`getMessage` `src/lib/gmail/client.ts:16`, no refresh handling, sync slices 5 messages.
**AI:** `AIService` picks `OpenAIProvider` if `AI_API_KEY` else `FreeAIProvider` `src/lib/ai/service.ts:8`, Free does substitution `src/lib/ai/providers/free.ts:5`, OpenAI calls `api.openai.com/v1/chat/completions` `src/lib/ai/providers/openai.ts:7`
**Meta:** Stub only `src/app/api/integrations/meta/route.ts:3` — official API note, no DM.
**Verification:** FreeEmailVerifier `syntax→domain→MX→business` heuristic `src/lib/verification/email.ts:8-15`, `verifyPhone` heuristic `src/lib/verification/phone.ts:1`, `verifySocialUrl` `src/lib/verification/social.ts:4`

---

## 8. Broken Features
- **Buttons with no backend:** `campaigns` New Campaign `src/app/(app)/campaigns/page.tsx:5`, `templates` New Template `src/app/(app)/templates/page.tsx:4`, `integrations` Configure Meta `src/app/(app)/integrations/page.tsx:11`, `Composer` Save Draft `src/components/email/Composer.tsx:33`, `BulkActions` Export selected `src/components/leads/BulkActions.tsx:24`, `settings/extension` Generate Session `src/app/(app)/settings/extension/page.tsx:1`, `settings/api` lists only text.
- **Forms cause navigation:** `inbox` `action="/api/emails/sync"` `src/app/(app)/inbox/page.tsx:18`, `campaigns/[id]` `action="/api/campaigns/send"` `src/app/(app)/campaigns/[id]/page.tsx:23` — full page POST, not JSON fetch.
- **Auth bypass:** `api/leads/import` orphan `null` user `src/app/api/leads/import/route.ts:32`, `api/inbox` open, `api/leads/search` open, `api/campaigns/recipients` IDOR, `ai/*` open.
- **Demo fallbacks hide errors:** `dashboard byDay=[12,18...]` `src/app/(app)/dashboard/page.tsx:18`, `leads/[id]` fabricates `Lead ABC` `src/app/(app)/leads/[id]/page.tsx:22`, `campaigns/[id]` demo queue `src/app/(app)/campaigns/[id]/page.tsx:16`, `admin/logs` fake `lead_imported` `src/app/(app)/admin/logs/page.tsx:19`
- **Extension demo:** `popup.js:12-15` injects fake leads if extraction fails, `popup.html:11` hard-coded 87 results.

---

## 9. Missing Features
- **Auth:** No logout, no isAdmin UI gating, no provider list beyond Google.
- **Projects:** No edit/delete, `ProjectForm` only posts 4 fields `src/components/projects/ProjectForm.tsx:7` ignoring `description/states/services/target_positions` `supabase/schema.sql:17-26`
- **Leads:** No single create, no status PATCH, no delete, no tag CRUD, `LeadFilters` component unused.
- **Campaigns:** No follow-ups Day0/3/7 creation beyond badges `src/app/(app)/campaigns/[id]/page.tsx:27`, no unsubscribe, no queue worker.
- **Inbox:** No thread body rendering, no polling, no reply via threadId.
- **Templates/AI:** No CRUD for `email_templates`/`ai_prompts`/`ai_generations`, `PromptManager` never persists.
- **Sources:** 8 adapters empty `src/lib/sources/*/adapter.ts:6`, registry never used by extension.
- **Dedup/Scoring:** `dedup` lib unused, `scoreLead` used only dashboard, not on import.
- **System health:** `/admin/system-health` does not exist, `/admin/debug` does not exist — required by spec §50-51.

---

## 10. Environment Variables Required
`NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY` `NEXT_PUBLIC_APP_URL` `ADMIN_EMAILS` `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `GOOGLE_REDIRECT_URI` `AI_API_KEY` `AI_MODEL` `EMAIL_VERIFIER_API_KEY` `META_APP_ID` `META_APP_SECRET` — see `.env.example:1`, also referenced in `src/lib/gmail/client.ts:3`, `src/lib/ai/service.ts:8`, `src/lib/verification/email.ts:31`

---

## 11. Build Errors
- Vercel `5fe0d6b` failed: `supabase/server.ts:3` returned `null` → prerender `supabase.from()` threw during `next build` (fixed in `fe286cd` with mock chain `src/lib/supabase/server.ts:3`)
- Earlier `0e64bf2` failed: `templates/page.tsx:4` `{{business_name}}` raw JSX `TS2353` + `papaparse` missing `@types` + `middleware` cookie 3-arg — fixed `cc5f059`
- `next.config.ts:2` `experimental.serverActions` overly permissive but not failing.

---

## 12. Runtime Errors
- `GET /api/health` 404 before `OPTIONS` CORS `src/middleware.ts:5` — now fixed `src/app/api/health/route.ts:2`
- `mockClient` returns empty `[]` when env missing — hides misconfiguration, amber banner added `src/app/(app)/leads/page.tsx:10`, `projects/page.tsx:10`, `dashboard/page.tsx:6`
- `emails/send` silently marks `SENT` without Gmail if `acct` missing `src/app/api/campaigns/send/route.ts:21-24` — should return queued.
- `oauth_accounts` plain `access_token` `supabase/schema.sql:92` — no encryption, `CORS *` even for credentialed `src/middleware.ts:17` — CSRF risk.
- Gmail sync truncates `maxResults:20` `src/lib/gmail/client.ts:19` and slices 5 `src/app/api/emails/sync/route.ts:14` — >5 replies lost.

---

## 13. Recommended Fixes (P0 first)
1. **P0 Auth+DB:** Fix RLS (add policies for `campaign_recipients`, `email_threads`, `email_messages`, `oauth_accounts`, `extension_sessions`), encrypt tokens, add `state` CSRF to Gmail OAuth, require `userId` on all writes (remove orphan `null`).
2. **P0 CRM:** Remove ALL demo fallbacks, wire `ProjectForm` all fields, add `PATCH /api/leads/:id` status, add `/api/health` + `/api/extension/health` with real checks, add `System Health` + `Debug` pages.
3. **P0 Extension:** Remove demo leads injection `extension/popup.js:12-15`, implement real state machine `IDLE→ERROR`, `Test Connection` calling `GET /api/extension/health`, detect `Current site: Supported` via `getSourceInfo()`, real `search→extract→normalize→validate→deduplicate→preview`.
4. **P0 Import:** Enforce Zod on `POST /api/extension/import` (validate `business_name`, `email` regex), server deduct `scoreLead`, check `expires_at` for token, use `dedup` lib for phone+domain+name+address, return `NEW/DUPLICATE/POSSIBLE_DUPLICATE`.
5. **P0 Gmail:** Fix refresh `getOAuth2Client` auto-refresh, add `POST /api/gmail/sync` polling + `message_id` dedup, fix `send` to `QUEUED` if no token (not `SENT`), add test email flow.
6. **P0 AI:** Auth + rate limit `ai/*`, log to `ai_generations`, show `NOT CONFIGURED` if `AI_API_KEY` missing.
7. **P0 Buttons:** Every button must have `loading` + `try/catch` + `error banner` + disable duplicate clicks — audit all `onClick` handlers.
8. **Docs:** Create `USER_MANUAL.md`, `DEVELOPER_SETUP.md`, `API.md`, `ARCHITECTURE.md` per spec §58-61, separate seed `/dev/seed`.

