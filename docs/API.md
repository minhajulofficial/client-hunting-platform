# API REFERENCE

Base URL: `https://client-hunting-platform-five.vercel.app`

Every endpoint returns the same envelope:

```json
{ "success": true, "data": { }, "error": null }
```

Errors:

```json
{ "success": false, "data": null, "error": "Human readable reason" }
```

| Code | Meaning |
|---|---|
| 200 | OK |
| 400 | Malformed request (bad JSON, missing query param) |
| 401 | Not authenticated / expired extension token |
| 404 | Not found (or not yours — RLS) |
| 422 | Zod validation failed; `error` lists each field |
| 500 | Server/database error |
| 502 | Upstream failure (Gmail, AI) |
| 503 | NOT CONFIGURED (missing environment variables) |

## Authentication

Two accepted methods:

1. **Browser session** — Supabase auth cookie (Google OAuth).
2. **Extension token** — `Authorization: Bearer <token>` from `POST /api/extension/session`. Expiry is enforced on every request.

Resolved by `src/lib/api/auth.ts:resolveUser()`. CORS is enabled for extension use.

---

## Health

### `GET /api/health`
Public. Reports app status and which environment variables are present (never values).

```json
{ "success": true, "data": { "status": "ok", "supabase_configured": true,
  "env": { "has_supabase_url": true, "has_anon_key": true, "has_service_role": true, "has_google_client": true } } }
```

### `GET /api/extension/health`
Public; richer with a Bearer token. Performs a real database query.

```json
{ "success": true, "data": {
  "api": { "status": "ok" },
  "database": { "connected": true, "supabase_configured": true },
  "authentication": { "has_token": false, "session_valid": false, "note": "No token - login to CRM first" } } }
```

---

## Projects

### `GET /api/projects` · auth
Your projects, newest first.

### `POST /api/projects` · auth · Zod
```json
{ "name": "USA Dental Outreach", "country": "USA", "cities": ["Miami"], "niche": "Dental Clinic" }
```
Writes `project_created` to `activity_logs`.

---

## Leads

### `GET /api/leads` · auth
Query: `page` (1), `per_page` (25, max 100), `country`, `state`, `city`, `niche`, `status`, `email_status`, `project_id`, `q` (business name).

```json
{ "success": true, "data": { "leads": [], "page": 1, "per_page": 25, "total": 0 } }
```

### `POST /api/leads` · auth · Zod
Creates one lead. Email is verified server-side; `lead_score` is computed.

### `GET /api/leads/:id` · auth
404 if it is not yours.

### `PATCH /api/leads/:id` · auth · Zod
```json
{ "status": "INTERESTED", "notes": "Asked for pricing", "next_followup": "2026-09-01T09:00:00Z" }
```
A status change writes `status_changed` with `{ from, to }` to `activity_logs`.

### `DELETE /api/leads/:id` · auth

### `POST /api/leads/import` · auth · Zod
CSV/manual bulk import. Max 500 per call.

```json
{ "leads": [ { "business_name": "ABC Dental", "email": "hello@abcdental.com" } ], "projectId": "uuid" }
```
```json
{ "success": true, "data": { "received": 1, "imported": 1, "duplicates": 0, "failed": 0, "errors": [] } }
```

### `POST /api/leads/verify` · auth
```json
{ "email": "hello@abcdental.com", "phone": "+13051234567" }
```
Returns `VERIFIED | RISKY | INVALID | UNKNOWN` plus the individual checks.

### `GET /api/leads/search` · auth
Simple filtered search (superseded by `GET /api/leads`).

---

## Extension

### `POST /api/extension/session` · auth (browser session)
Issues a 7-day token stored in `extension_sessions`.

```json
{ "success": true, "data": { "token": "…", "expires_at": "2026-09-04T…Z" } }
```

### `POST /api/extension/import` · auth (session or Bearer) · Zod
The only write path for the extension. The backend re-validates everything — extension claims are never trusted.

```json
{ "leads": [ { "business_name": "ABC Dental", "email": "hello@abcdental.com",
  "website": "https://abcdental.com", "source": "website", "source_url": "https://abcdental.com/contact" } ],
  "projectId": "uuid" }
```
```json
{ "success": true, "data": { "received": 1, "imported": 1, "duplicates": 0,
  "possible_duplicates": 0, "failed": 0, "errors": [] } }
```

Pipeline: Zod → email verification → phone validation → `lead_score` → duplicate check (email, phone, website domain, business name) → insert → `activity_logs` + `lead_verifications`.

Duplicate rules: exact email, phone, or website domain match ⇒ **DUPLICATE** (skipped). Business-name-only match ⇒ **POSSIBLE_DUPLICATE** (imported with status `REVIEW`).

---

## Campaigns

### `GET /api/campaigns` · auth
### `POST /api/campaigns` · auth
```json
{ "name": "Miami Dental Outreach", "status": "draft" }
```
### `POST /api/campaigns/recipients` · auth
```json
{ "campaign_id": "uuid", "lead_id": "uuid" }
```
### `POST /api/campaigns/send` · auth
Processes up to 20 `QUEUED` recipients per call: `QUEUED → SENDING → SENT|FAILED`, paced ~800 ms apart. Only `VERIFIED`/`RISKY` addresses are used.

```json
{ "success": true, "data": { "sent": 12, "failed": 1, "total": 13 } }
```

---

## Email

### `POST /api/emails/send` · auth · Zod
```json
{ "to": "hello@abcdental.com", "subject": "Quick idea", "body": "<p>Hi</p>", "leadId": "uuid" }
```
With Gmail connected the message is really sent and the lead becomes `CONTACTED`. Without Gmail the response says `queued` — never a false "sent".

### `POST /api/emails/sync` · auth
Reads the last 7 days of inbox mail, matches the sender to a lead, upserts `email_threads` / `email_messages`, sets matched leads to `REPLIED`.

### `GET /api/inbox` · auth
Threads with nested messages.

---

## Gmail

### `GET /api/integrations/gmail` · auth — connection state
### `GET /api/integrations/gmail/auth` — starts OAuth (offline + consent)
### `GET /api/integrations/gmail/callback` — exchanges the code, upserts `oauth_accounts`
### `GET /api/gmail/test` · auth — 503 NOT CONFIGURED, 400 not connected, 200 connected
### `POST /api/gmail/test` · auth — sends a **real** test email
```json
{ "to": "you@example.com" }
```

---

## AI

All require auth, validate with Zod, log to `ai_generations`, and report the active provider. Without `AI_API_KEY` the response includes a note that free mode is active. The AI is instructed never to invent business facts.

### `POST /api/ai/generate`
```json
{ "prompt": "Offer website redesign and local SEO", "variables": { "business_name": "ABC Dental", "city": "Miami" } }
```
### `POST /api/ai/personalize`
```json
{ "template": "Hi {{first_name}} …", "lead": { "first_name": "John", "business_name": "ABC Dental" } }
```
### `POST /api/ai/analyze`
```json
{ "lead": { "business_name": "ABC Dental", "website": "https://abcdental.com" } }
```
### `POST /api/ai/reply`
```json
{ "inbound": "How much do you charge?", "context": "Dental clinic, website + SEO" }
```
Returns `requires_approval: true` — V1 never auto-sends.

---

## Templates

### `GET /api/templates` · auth
### `POST /api/templates` · auth · Zod
```json
{ "name": "Dental v1", "subject": "Quick idea for {{business_name}}", "body": "Hi {{first_name}} …" }
```
### `DELETE /api/templates?id=uuid` · auth

---

## Meta

### `GET /api/integrations/meta`
Reports not connected until an approved Meta app is configured. No scraping or unauthorised DM path exists.

---

## Examples

```bash
curl https://client-hunting-platform-five.vercel.app/api/health

curl -X POST https://client-hunting-platform-five.vercel.app/api/extension/import \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"leads":[{"business_name":"ABC Dental","email":"hello@abcdental.com"}],"projectId":"UUID"}'
```

Observed live behaviour (unauthenticated):

| Endpoint | Status |
|---|---|
| `/api/health` | 200 |
| `/api/extension/health` | 200 |
| `/api/projects` | 401 |
| `/api/leads` | 401 |
| `/api/templates` | 401 |
| `/api/gmail/test` | 401 |
| `/api/extension/import` (bad token) | 401 |
| `/dashboard`, `/leads`, `/campaigns` | 307 → `/login` |
