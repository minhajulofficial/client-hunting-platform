import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(req: Request){
  const url=new URL(req.url)
  const code=url.searchParams.get('code')
  const error=url.searchParams.get('error')
  if(error) return NextResponse.redirect(new URL('/integrations?gmail=error&msg='+encodeURIComponent(error), url.origin))
  if(!code) return NextResponse.redirect(new URL('/integrations?gmail=missing_code', url.origin))
  try{
    const redirectUri=process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL + '/api/integrations/gmail/callback'
    const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type:'authorization_code' })})
    const tokens=await tokenRes.json()
    if(!tokenRes.ok) throw new Error(tokens.error_description||JSON.stringify(tokens))
    const supabase=await createClient()
    const { data:{ user } }=await supabase.auth.getUser()
    if(user){
      await supabase.from('oauth_accounts').upsert({ user_id:user.id, provider:'gmail', access_token: tokens.access_token, refresh_token: tokens.refresh_token, expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : new Date(Date.now()+tokens.expires_in*1000).toISOString(), scope: tokens.scope },{ onConflict:'user_id,provider' })
      await supabase.from('integrations').upsert({ user_id:user.id, provider:'gmail', status:'connected', metadata:{ scope: tokens.scope } },{ onConflict:'user_id,provider' })
    }
    return NextResponse.redirect(new URL('/integrations?gmail=connected', url.origin))
  }catch(e:any){
    return NextResponse.redirect(new URL('/integrations?gmail=error&msg='+encodeURIComponent(e.message), url.origin))
  }
}
