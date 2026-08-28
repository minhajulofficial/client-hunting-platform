import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request){
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const base = url.origin

  if(error) return NextResponse.redirect(new URL('/integrations?gmail=error&msg='+encodeURIComponent(error), base))
  if(!code) return NextResponse.redirect(new URL('/integrations?gmail=missing_code', base))

  try{
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if(!clientId || !clientSecret) return NextResponse.redirect(new URL('/integrations?gmail=error&msg='+encodeURIComponent('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set'), base))

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || base + '/api/integrations/gmail/callback'

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      })
    })
    const tokens = await tokenRes.json()
    if(!tokenRes.ok) throw new Error(tokens.error_description || JSON.stringify(tokens))

    // Use service role to bypass RLS for oauth_accounts + integrations upserts
    const svc = await createServiceClient() as any

    // Get user from session cookie
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if(!user) return NextResponse.redirect(new URL('/integrations?gmail=error&msg='+encodeURIComponent('No active session. Log in first, then connect Gmail.'), base))

    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()

    const { error: upsertErr } = await svc.from('oauth_accounts').upsert({
      user_id: user.id,
      provider: 'gmail',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: expiryDate,
      scope: tokens.scope || 'gmail.send gmail.readonly gmail.modify',
    }, { onConflict: 'user_id,provider' })
    if(upsertErr) throw new Error('Failed to save OAuth tokens: ' + upsertErr.message)

    await svc.from('integrations').upsert({
      user_id: user.id,
      provider: 'gmail',
      status: 'connected',
      metadata: { scope: tokens.scope, connected_at: new Date().toISOString() }
    }, { onConflict: 'user_id,provider' })

    return NextResponse.redirect(new URL('/integrations?gmail=connected', base))
  }catch(e: any){
    return NextResponse.redirect(new URL('/integrations?gmail=error&msg='+encodeURIComponent(e.message || 'Unknown error'), base))
  }
}
