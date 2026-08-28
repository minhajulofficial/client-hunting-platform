# Security

- HTTPS enforced (Vercel), secure cookies, RLS on Supabase, server-side service role never exposed
- OAuth tokens stored in `oauth_accounts`, encrypted at rest; never sent to client/extension bundle
- Extension uses short-lived session token (`extension_sessions`) not permanent secret, validated server-side
- `ADMIN_EMAILS` middleware gates all `/dashboard`, `/leads`, `/projects`, `/campaigns`, `/inbox`, `/admin`
- Input validation via zod, rate limiting on APIs, audit + system logs
- Do NOT bypass CAPTCHA/auth/paywalls/robots — sources use official APIs or DOM extraction of publicly visible data only
