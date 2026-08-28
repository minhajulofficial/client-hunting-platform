# Setup Guide

## 1. Supabase
1. Create project at supabase.com
2. SQL Editor → run `supabase/schema.sql`
3. Auth → Providers → enable Google (add Client ID/Secret from Google Cloud)
4. Copy URL + anon key + service role to `.env.local`

## 2. Google OAuth (Gmail)
1. https://console.cloud.google.com → Create OAuth consent (External) + Credentials → OAuth Client ID (Web)
2. Authorized redirect: `https://yourdomain.com/api/integrations/gmail/callback` + `http://localhost:3000/api/integrations/gmail/callback`
3. Enable Gmail API
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

## 3. AI
Set `AI_API_KEY` (OpenAI) for real generation, else FreeAIProvider does variable substitution safely.

## 4. Admin
Set `ADMIN_EMAILS=you@gmail.com` — only those can access `/admin` and dashboard. Empty = all authenticated users (dev).

## 5. Run
```
npm install --legacy-peer-deps
npm run dev
```

## 6. Extension
`chrome://extensions` → Developer mode → Load unpacked → `extension/` → set `API` in `popup.js` to your `NEXT_PUBLIC_APP_URL` → Generate session token at `/settings/extension`.
