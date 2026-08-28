import { NextResponse } from 'next/server'
export async function GET(){
  return NextResponse.json({ success:true, data:{ facebook:{ connected:false, note:'Connect via Meta App using official Graph API' }, instagram:{ connected:false }, docs:'Use official APIs only. Where API unavailable, use browser-assisted manual workflow. No CAPTCHA/stealth bypass.' }, error:null })
}
export async function POST(req: Request){
  const { provider, config } = await req.json()
  return NextResponse.json({ success:true, data:{ provider, status:'saved_stub', config }, error:null })
}
