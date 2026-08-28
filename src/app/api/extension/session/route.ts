import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(){
  const supabase = await createClient()
  const { data:{ user } } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({ success:false, error:'Unauthorized' },{status:401})
  const token = crypto.randomUUID() + '-' + Date.now().toString(36)
  const expires = new Date(Date.now()+7*24*3600*1000).toISOString()
  await supabase.from('extension_sessions').insert({ user_id:user.id, token, expires_at: expires })
  return NextResponse.json({ success:true, data:{ token, expires_at: expires }, error:null })
}
export async function GET(req:Request){
  const token = new URL(req.url).searchParams.get('token')
  if(!token) return NextResponse.json({ success:false, error:'token required' },{status:400})
  return NextResponse.json({ success:true, data:{ valid:true }, error:null })
}
