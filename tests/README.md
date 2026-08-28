# Client Hunting Platform - Compliance Tests

Three test tiers exist to verify security and compliance.

## Run them

```bash
npm test          # unit + API tests only
npm run test:e2e  # full browser-based user flow tests (requires Chrome + the platform running)
```

The npm script `test:e2e` runs against `http://localhost:3000` by default.
Set `TEST_BASE_URL` to run against a staging environment.

## Tiers

### 1. Unit / API tests (`tests/api-security.test.ts`)

Run via `vitest` with a mocked Supabase client (no live database needed). Covers:

- Authorization header checking on every route
- Zod validation rejecting bad payloads
- IDOR guard on campaign recipients
- `unresolved template variables` guard on emails/send
- ResolveUser returning userId from session and from extension Bearer token
- Access token expiry rejection

### 2. External probe tests (`tests/external-probe.test.ts`)

HTTP probes against the live production site. No local server or credentials needed. Covers:

- /api/health returns 200 + supabase_configured: true
- /api/extension/health returns 200 + database.connected: true
- /api/leads (unauthenticated) returns 401
- /api/projects (unauthenticated) returns 401
- /api/templates (unauthenticated) returns 401
- /api/ai/generate (unauthenticated POST) returns 401
- /api/emails/send (unauthenticated POST) returns 401
- /api/campaigns (unauthenticated GET) returns 401
- /leads, /projects, /campaigns, /templates all redirect to /login (307) when no session cookie

### 3. E2E browser tests (`tests/e2e-auth.spec.ts`)

Playwright with Chromium. Requires the running platform and at least one real Supabase user. Environment variables:

- TEST_USER_EMAIL / TEST_USER_PASSWORD: real user with Supabase auth
- TEST_BASE_URL: defaults to http://localhost:3000

Covers:

- Unauthenticated access to /leads, /projects, /campaigns, /inbox, /templates redirects to /login
- Extension POST to /api/extension/import without token returns 401
- Extension POST with invalid/expired token returns 401
- Extension POST with valid token inserts a lead (requires DB seeded with project)
- All recorded user flows execute without errors

## What is NOT tested (and why)

| Category | Reason |
|----------|--------|
| Gmail sends | Would send real emails; covered via integration test account + manual approval |
| Source scrapers | Most require API keys or manual search input |
| Paid verification APIs | Free mock verifier used in unit tests |
| AI content accuracy | Not machine-testable beyond structural schema validation |

## How to extend

Add a new file under `tests/`. Run `npm test` or `npx vitest run tests/yourfile.test.ts`.
Use `vitest` + `@testing-library/react` for component-level tests.
Use Playwright for anything requiring a browser or DOM interaction.
