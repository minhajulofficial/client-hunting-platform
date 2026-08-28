# Client Hunting Platform
Personal CRM + Chrome Extension + Lead pipeline.

## Stack
Next.js 16 + React 19 + TypeScript + Tailwind 4, Supabase Postgres, Google OAuth, Gmail API, AI abstraction.

## Quick start
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill Supabase + Google OAuth
3. Run Supabase `supabase/schema.sql` in SQL editor, enable Google auth in Supabase Auth
4. `npm run dev` -> http://localhost:3000
5. Load `extension/` as unpacked in chrome://extensions

## Pages
/login, /dashboard, /projects, /projects/[id], /leads, /leads/[id], /campaigns, /campaigns/[id], /inbox, /templates, /ai, /integrations, /settings, /settings/api, /settings/extension, /admin/logs

## Architecture
SourceAdapter → Extractor → Normalizer → Validator → Deduplicator → CRM
- `src/lib/sources/*` modular adapters
- `src/lib/verification/*` EmailVerifier abstraction (FreeVerifier / Provider)
- `src/lib/ai/*` AIService provider adapter
- `src/lib/gmail/*` Gmail API + token storage
- `src/lib/deduplication/*` multi-signal dedup

## Security
- OAuth tokens server-side only, never in extension bundle
- RLS on Supabase, admin middleware via ADMIN_EMAILS
- Extension uses short-lived session token from /api/extension/session

## Gmail setup
Create OAuth consent + credentials at console.cloud.google.com, set redirect to /api/integrations/gmail/callback, enable Gmail API.

## AI setup
Set AI_API_KEY to enable OpenAI provider; otherwise FreeAIProvider does template variable substitution without inventing facts.

## Docs
See `docs/` for deployment, OAuth, security, logging.
