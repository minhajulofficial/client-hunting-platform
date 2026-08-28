import { NextResponse } from 'next/server'

export async function GET(){
  const clientId = process.env.GOOGLE_CLIENT_ID
  if(!clientId) return NextResponse.json({ success:false, error:'GOOGLE_CLIENT_ID not set. Add it to Vercel environment variables.' }, {status:500})

  // Build redirect URI: use explicit GOOGLE_REDIRECT_URI or derive from APP_URL
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
    || (process.env.NEXT_PUBLIC_APP_URL || 'https://client-hunting-platform-five.vercel.app') + '/api/integrations/gmail/callback'

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ].join(' ')

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scopes)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(url.toString())
}
