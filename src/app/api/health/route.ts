import { NextResponse } from 'next/server'
export async function GET(){
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  return NextResponse.json({ success:true, data:{ status:'ok', timestamp: new Date().toISOString(), supabase_configured: configured, env: { has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL, has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY, has_google_client: !!process.env.GOOGLE_CLIENT_ID, app_url: process.env.NEXT_PUBLIC_APP_URL || null } }, error:null }, { headers:{ 'Access-Control-Allow-Origin':'*' } })
}
export async function OPTIONS(){ return new NextResponse(null,{status:204, headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}}) }
