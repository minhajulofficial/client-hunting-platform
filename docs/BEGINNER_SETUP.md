# Beginner Setup Guide — Client Hunting Platform

This guide is for absolute beginners. Follow step-by-step. No step skipping.

---

## 0. What You Will Build

```
Find Lead → Collect → Review → Import → Verify → AI Message → Gmail Send → Reply → CRM Inbox → Follow-up → Client
```

You get:
- Web CRM (Next.js + Supabase)
- Chrome Extension (hunt leads)
- Gmail outreach + inbox sync
- AI personalization

---

## 1. Prerequisites (Install These First)

1. **Node.js 20+** → https://nodejs.org (LTS, check with `node --version`)
2. **Git** → https://git-scm.com (`git --version`)
3. **VS Code** (or any editor)
4. **Chrome browser**
5. **Accounts you will need (free):**
   - GitHub (for code)
   - Supabase (database + auth)
   - Google Cloud (Gmail API)
   - Vercel (hosting)
   - OpenAI (optional, for real AI — free tier works without)

---

## 2. Get The Code

```bash
git clone https://github.com/minhajulofficial/client-hunting-platform.git
cd client-hunting-platform
npm install --legacy-peer-deps
```

If `npm install` shows warnings, ignore them unless it shows `ERR`. On slow internet wait 2-5 minutes.

---

## 3. Create Supabase Project

1. Go to https://supabase.com → Sign in → **New Project**
2. Name: `client-hunter` → set DB password → Region: nearest → **Create** (wait 2 min)
3. Once ready:
   - Left menu → **SQL Editor** → **New query**
   - Open file `supabase/schema.sql` in VS Code → **Select All → Copy**
   - Paste in SQL Editor → **Run** (should say Success, 18 tables created)
4. Enable Google login:
   - Left → **Authentication** → **Providers** → **Google** → **Enable**
   - Leave Client ID/Secret empty for now (we fill after Google Cloud step)
5. Get API keys:
   - Left → **Project Settings** → **API**
   - Copy: `Project URL`, `anon public`, `service_role` (keep secret)

---

## 4. Create Google OAuth (Gmail)

1. Go to https://console.cloud.google.com → Create New Project `client-hunter`
2. **APIs & Services → Enable APIs** → Enable:
   - **Gmail API**
   - **People API** (optional)
3. **APIs & Services → OAuth consent screen**
   - User Type: **External** → **Create**
   - App name: `Client Hunter`, Support email: yours
   - Scopes: Add `.../auth/gmail.send`, `.../auth/gmail.readonly`, `.../auth/gmail.modify`
   - Test users: **Add your Gmail** (you@gmail.com)
   - Save
4. **APIs & Services → Credentials** → **Create Credentials** → **OAuth Client ID**
   - Type: **Web Application**
   - Name: `Client Hunter Web`
   - **Authorized redirect URIs** (add BOTH):
     ```
     http://localhost:3000/api/integrations/gmail/callback
     https://YOUR_VERCEL_DOMAIN.vercel.app/api/integrations/gmail/callback
     ```
     (You will update Vercel domain after deploy — add then, but add localhost now)
   - **Create** → Copy `Client ID` and `Client Secret`

---

## 5. Environment Variables (.env.local)

In project root create file `.env.local` (copy from `.env.example`):

```env
# Supabase (from Step 3.5)
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=you@gmail.com   # only you can login; comma-separated for more

# Gmail OAuth (from Step 4)
GOOGLE_CLIENT_ID=XXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=XXXX
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback

# AI (optional - leave empty for free tier template substitution)
AI_API_KEY=
AI_MODEL=gpt-4o-mini

# Optional paid verifiers (leave empty for free)
EMAIL_VERIFIER_API_KEY=
```

**IMPORTANT:** Never commit `.env.local` to GitHub. Never put these keys in extension.

---

## 6. Run Locally

```bash
npm run dev
```

Open http://localhost:3000 → Click **Login with Google** → Allow → You land on `/dashboard`.

If login fails: Check Supabase → Authentication → Providers → Google has Client ID/Secret, and in Google Cloud your redirect URI is exactly `http://localhost:3000/api/auth/callback` (added automatically via Supabase) + our gmail callback.

Test:
- `/projects` → Create test project (USA → Dental)
- `/leads` → Should be empty
- `/integrations` → Shows Gmail not connected

---

## 7. Connect Gmail

1. In app go to `/integrations` → **Connect Gmail**
2. Google consent → Allow gmail scopes → Redirect to `/integrations?gmail=connected`
3. Check Supabase → Table Editor → `oauth_accounts` → new row `gmail` for your user
4. Now `/inbox` → **Sync Gmail now** should work

---

## 8. AI Setup (Optional)

**Without key (free):** AI does safe variable substitution only (`{{business_name}}` → real name, no hallucination). Works immediately.

**With OpenAI:**
1. https://platform.openai.com → API Keys → Create
2. Set `AI_API_KEY=sk-...` in `.env.local` and Vercel env → Restart dev
3. Test at `/ai` → **Generate with AI**

---

## 9. Chrome Extension (Load Unpacked)

1. Build has no build step — folder `extension/` is ready
2. Chrome → `chrome://extensions` → Toggle **Developer mode** (top right)
3. **Load unpacked** → Select `client-hunting-platform/extension` folder
4. Pin extension (puzzle icon → pin 🎯)
5. Set API URL:
   - Open `extension/popup.js` → top line `const API = 'http://localhost:3000'` → change to your Vercel URL when deployed
6. Auth extension:
   - Login to CRM in Chrome same profile
   - Open extension → **Reconnect** → Creates short-lived token stored in `chrome.storage.local` (not permanent secret)
   - Should show `Connected: ✓`

**Usage:**
```
Extension popup → Project → Country → Location → Niche → Target Position → Sources☑ → Data☑ → START CLIENT HUNT
→ Preview table (Found 87 Usable 61 New 52 Duplicates 9) → Select → Import Selected → Leads appear in /leads
```

Extension never sees `SUPABASE_SERVICE_ROLE_KEY` or `AI_API_KEY`.

---

## 10. CSV Import / Export

- **Import:** `/leads` → **Import CSV** → Choose `.csv` with headers `business_name,email,phone,website,city,country,niche` → Preview 5 rows → **Import to CRM** (server dedups by email/phone/domain)
- **Export:** `/leads` → **Export filtered** (exports currently filtered list)

---

## 11. Lead Workflow (V1 Happy Path)

1. Find leads via Extension → Import
2. `/leads` → Filter `status=NEW` → Verify badges `VERIFIED/RISKY/INVALID`
3. Select leads → Create **Campaign** at `/campaigns` → Choose **Template** at `/templates`
4. **AI Personalize** at `/ai` or in **Composer** (To/CC/BCC/Subject/Body → Generate/Personalize)
5. **Send** → Queued → Gmail API → Status `QUEUED→SENT`
6. Client replies → Gmail sync → `/inbox` → thread matched to lead → status auto `REPLIED`
7. **AI Suggest Reply** → You approve → Send
8. Update status: `INTERESTED → MEETING → PROPOSAL → WON/LOST` (follow-ups auto-stop on reply/unsubscribe)

Check **Timeline** on `/leads/[id]` for `Lead imported → Email verified → Campaign added → Email sent → Reply received`.

---

## 12. Deploy to Vercel (Production)

1. Push to GitHub (already done)
2. https://vercel.com → **Add New Project** → Import `minhajulofficial/client-hunting-platform`
3. **Environment Variables** → Add ALL vars from `.env.local` BUT change:
   ```
   NEXT_PUBLIC_APP_URL=https://YOUR_PROJECT.vercel.app
   GOOGLE_REDIRECT_URI=https://YOUR_PROJECT.vercel.app/api/integrations/gmail/callback
   ```
4. **Deploy** → Wait 1-2 min → Visit `https://YOUR_PROJECT.vercel.app`
5. **After deploy:**
   - Supabase → Authentication → **URL Configuration** → Add `https://YOUR_PROJECT.vercel.app` to Site URL + Redirect URLs
   - Google Cloud → Credentials → OAuth Client → Add `https://YOUR_PROJECT.vercel.app/api/integrations/gmail/callback` to redirect URIs
6. Re-login on Vercel domain, reconnect Gmail, re-setup extension API to Vercel URL

---

## 13. Admin & Security Checklist

- `ADMIN_EMAILS` set? Only listed emails can access dashboard (empty = anyone with Google can access — dev only)
- `SUPABASE_SERVICE_ROLE_KEY` only on server (Vercel env), never in `extension/` or client bundle
- `AI_API_KEY`, `GOOGLE_CLIENT_SECRET` only server
- Monitor: `/admin/logs` (activity vs system logs), Supabase Table Editor, Vercel Logs
- RLS enabled (schema.sql did it). Do NOT disable.

---

## 14. Troubleshooting

| Problem | Fix |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL not set` | `.env.local` missing or not restarted `npm run dev` |
| Google login `redirect_uri_mismatch` | Google Cloud redirect URI must exactly match Supabase + Vercel + localhost |
| Gmail `access_denied` | Add your email as Test User in OAuth consent screen |
| Leads not showing | Check Supabase `leads` table has `user_id` = your user id; RLS filters by logged-in user |
| Extension `not connected` | Login to CRM in same Chrome profile → Extension → Reconnect |
| Vercel build fails | Check `npm run build` locally, ensure `@types/papaparse` installed |
| AI returns placeholder | Set `AI_API_KEY` — free tier returns template substitution only |

Logs:
- Browser console (F12)
- Vercel → Project → Logs
- Supabase → Logs

---

## 15. What Next?

- Add new source: copy `src/lib/sources/website/adapter.ts` → `src/lib/sources/<new>/adapter.ts` → register in `src/lib/sources/registry.ts`
- Add paid verifier: implement `EmailVerifier` in `src/lib/verification/email.ts`
- Add paid AI: add provider in `src/lib/ai/providers/`

No rebuild of core CRM needed.

---

## 16. Need Help?

- Repo: https://github.com/minhajulofficial/client-hunting-platform
- Open an Issue with logs + screenshot
- Keep `ADMIN_EMAILS` private, never share `service_role` key

Happy hunting! 🎯

