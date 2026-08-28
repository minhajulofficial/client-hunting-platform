import { NextResponse } from 'next/server'
export async function GET(req:Request){
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  // Exchange code for tokens, store in oauth_accounts (encrypted)
  return NextResponse.redirect(new URL('/integrations?gmail=connected', url.origin))
}
