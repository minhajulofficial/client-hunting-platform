import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
function cors(res: NextResponse){ res.headers.set('Access-Control-Allow-Origin','*'); res.headers.set('Access-Control-Allow-Methods','GET,OPTIONS'); res.headers.set('Access-Control-Allow-Headers','Content-Type, Authorization'); return res }
export async function OPTIONS(){ return cors(new NextResponse(null,{status:204})) }
export async function GET(req: Request){
  const supabaseConfigured = isSupabaseConfigured()
  let dbOk=false, authOk=false
  let supabase:any=null
  try{ supabase=await createClient(); }catch{}
  if(supabase && supabaseConfigured){
    try{
      const { error } = await supabase.from('leads').select('id').limit(1)
      dbOk = !error
    }catch{ dbOk=false }
    try{
      const { data:{ user } } = await supabase.auth.getUser()
      authOk = !!user
    }catch{ authOk=false }
  }
  const authHeader=req.headers.get('authorization')||''
  const hasToken=authHeader.startsWith('Bearer ')
  return cors(NextResponse.json({
    success:true,
    data:{
      api: { status:'ok', timestamp: new Date().toISOString() },
      database: { connected: dbOk, supabase_configured: supabaseConfigured },
      authentication: { has_token: hasToken, session_valid: authOk, note: authOk ? 'Valid ✓' : hasToken ? 'Token present, checking...' : 'No token - login to CRM first' },
    },
    error:null
  }))
}
