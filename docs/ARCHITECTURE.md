# Architecture

SourceAdapter → Extractor → Normalizer → Validator → Deduplicator → CRM

Each source in `src/lib/sources/<id>/adapter.ts` implements `search/extract/normalize/validate`. Registry at `src/lib/sources/registry.ts` lets you add new source without rebuilding.

Verification: `EmailVerifier` (FreeVerifier with syntax/domain/business-domain, pluggable paid like Hunter/ZeroBounce). Phone via libphonenumber heuristic. Social `FOUND/NOT_FOUND/UNCERTAIN`.

AI: `AIService` → `ProviderAdapter` (`FreeAIProvider` variable substitution, `OpenAIProvider` chat completions). Prompts in `ai_prompts` table, never hallucinate.

Campaign: `campaigns` → `campaign_recipients` (QUEUED/SENDING/SENT/FAILED/BOUNCED/REPLIED/UNSUBSCRIBED) → Gmail API worker with rate limits, auto-stop on reply/unsubscribe.

Extension: popup collects criteria → content.js extracts public data → preview table → POST /api/extension/import (server final dedup/verify).
