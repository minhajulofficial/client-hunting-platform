# ARCHITECTURE

## Layering (spec §5)

```
Chrome Extension
      ↓  HTTPS + Bearer/session
Next.js API routes  (authentication → Zod validation → services)
      ↓
Services  (sources · verification · scoring · dedup · ai · gmail)
      ↓
Supabase PostgreSQL (RLS)   ·   Gmail API   ·   AI provider
```

The extension never touches the database and holds no secrets. Every write goes through an authenticated API route that re-validates the payload.

## Lead pipeline

```
Source adapter → Extract → Normalize → Validate (Zod) → Verify (email/phone)
 → Score → Deduplicate → Preview (user confirms) → Insert → activity_logs
```

Client-side checks are convenience only; the server repeats all of them.

## Folder structure

```
src/
  app/
    (app)/                     dashboard, projects, leads, campaigns, inbox,
                               templates, ai, integrations, settings, admin
    api/                       health, extension/{health,session,import},
                               leads/{,[id],import,verify,search}, projects,
                               campaigns/{,recipients,send}, emails/{send,sync},
                               inbox, templates, ai/{generate,personalize,analyze,reply},
                               gmail/test, integrations/{gmail,gmail/auth,gmail/callback,meta}
  components/                  ui, layout, leads, campaigns, templates, email,
                               integrations, settings, ai, projects
  lib/
    api/                       response.ts (envelope + CORS), auth.ts (resolveUser)
    validation/schemas.ts      Zod schemas
    supabase/                  client, server (+ safe mock), middleware
    sources/                   base, registry, website, google-search, google-maps,
                               business-directories, facebook, instagram, linkedin, other
    verification/              email, phone, social
    scoring/  deduplication/  ai/  gmail/  queue/  csv/
  middleware.ts                auth guard + CORS for /api/*
extension/                     manifest.json, config.js, popup.html, popup.js,
                               content.js, background.js
supabase/schema.sql            20 tables, indexes, RLS policies
docs/                          PROJECT_AUDIT, USER_MANUAL, DEVELOPER_SETUP, API, ARCHITECTURE
```

This is a single Next.js app rather than the `apps/ + packages/` monorepo suggested by the spec. Reason: one deployable target, one build, no cross-package version drift. The module boundaries the spec asks for are enforced by `src/lib/*` folders with explicit interfaces, so extracting them into packages later is mechanical.

## Source adapter interface

```ts
interface SourceAdapter {
  id: string
  metadata: SourceMetadata          // { id, name, description, supported }
  search(criteria): Promise<RawLead[]>
  extract(input): Promise<RawLead[]>
  normalize(raw): NormalizedLead
  validate(lead): { valid, errors }
  getSourceMetadata(): SourceMetadata
}
```

`BaseSourceAdapter` (`src/lib/sources/base.ts`) implements `normalize`/`validate`; `registry.ts` exposes every adapter.

**Honest status:** only **website** performs live extraction (public contact details on the page the user opens, via `extension/content.js` using JSON-LD, `mailto:`/`tel:` links and text patterns). The other adapters are registered interfaces awaiting official API access — the Integrations page shows this truthfully. No CAPTCHA, login, paywall or anti-bot bypass exists anywhere.

## Verification

`EmailVerifier` interface with `FreeEmailVerifier` (syntax → domain → disposable → business-domain) and a pluggable paid implementation selected when `EMAIL_VERIFIER_API_KEY` is set. Results: `VERIFIED | RISKY | INVALID | UNKNOWN` — never "100% real".

Phone: format/length validation. Social: URL validity → `FOUND | NOT_FOUND | UNCERTAIN`.

## Scoring

`scoreLead()` (`src/lib/scoring/index.ts`), 0-100: verified email 30, valid phone 15, website 15, social 10, business domain 10, plus geo/contact/niche. ≥80 HOT, ≥50 WARM, else COLD. Computed on import and on demand.

## Deduplication

Signals: email, phone, website domain, business name (+address, source id). Exact email/phone/domain ⇒ **DUPLICATE** (skipped). Name-only ⇒ **POSSIBLE_DUPLICATE**, imported as `REVIEW` for confirmation.

## AI abstraction

```
AIService → AIProvider
              ├── FreeAIProvider   (variable substitution, no invented facts)
              └── OpenAIProvider   (chat completions)
```

Chosen by `AI_API_KEY`. Every call is logged to `ai_generations`; the response states the provider. Reply suggestions always return `requires_approval: true`.

## Email and queue

`campaign_recipients` is the queue: `QUEUED → SENDING → SENT | FAILED | BOUNCED | REPLIED | UNSUBSCRIBED`. `POST /api/campaigns/send` processes a bounded batch (20) with ~800 ms pacing, so no request tries to send hundreds of emails. Only `VERIFIED`/`RISKY` addresses are used.

Reply sync: Gmail → match sender to lead → upsert `email_threads`/`email_messages` → lead becomes `REPLIED` → follow-ups stop.

## Data model

```
users → projects → leads → { lead_verifications, lead_sources, lead_tags }
leads → campaign_recipients → campaigns
leads → email_threads → email_messages
users → { oauth_accounts, extension_sessions, integrations, email_templates,
          ai_prompts, ai_generations, activity_logs }
system_logs (global)
```

Relational throughout; JSONB only for flexible metadata (`details`, `other_socials`).

## Security

- Google OAuth via Supabase; `ADMIN_EMAILS` allow-list in `src/middleware.ts`.
- RLS on every user-owned table; `service_role` is server-only.
- Extension uses a short-lived token in `extension_sessions` with `expires_at` enforced by `resolveUser()` — no permanent secret.
- Zod validation on every mutating route; extension claims (e.g. "email verified") are ignored and re-checked.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, `AI_API_KEY`, `META_APP_SECRET`) are server-only; `/settings/api` shows presence, never values.
- `activity_logs` (user-facing) and `system_logs` (developer) give traceability; failures surface in the UI instead of failing silently.

## Performance

Server-side filtering and pagination (`GET /api/leads`, max 100/page), indexes on `leads(user_id, project_id, email, status)`. The browser never loads the whole lead table.

## Free → paid

Interfaces (`EmailVerifier`, `AIProvider`, `SourceAdapter`) let paid providers drop in without touching CRM code. Nothing paid is required to run V1.
