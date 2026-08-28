import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
function cors(res: NextResponse){ res.headers.set('Access-Control-Allow-Origin','*'); res.headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS'); res.headers.set('Access-Control-Allow-Headers','Content-Type, Authorization'); return res }
export async function OPTIONS(){ return cors(new NextResponse(null,{status:204})) }
export async function POST(req: Request){
  const supabase = await createClient() as any
  if(!supabase) return cors(NextResponse.json({ success:false, error:'Supabase not configured' },{status:503}))
  const { data:{ user } } = await supabase.auth.getUser()
  if(!user) return cors(NextResponse.json({ success:false, error:'Unauthorized - login to CRM first' },{status:401}))
  const token = crypto.randomUUID() + '-' + Date.now().toString(36)
  const expires = new Date(Date.now()+7*24*3600*1000).toISOString()
  const { error } = await supabase.from('extension_sessions').insert({ user_id:user.id, token, expires_at: expires })
  if(error) return cors(NextResponse.json({ success:false, error:error.message },{status:500}))
  return cors(NextResponse.json({ success:true, data:{ token, expires_at: expires }, error:null }))
}
export async function GET(req:Request){
  const token = new URL(req.url).searchParams.get('token')
  if(!token) return cors(NextResponse.json({ success:false, error:'token required' },{status:400}))
  return cors(NextResponse.json({ success:true, data:{ valid:true }, error:null }))
}
