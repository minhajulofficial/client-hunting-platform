import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(){
  const supabase = await createClient()
  const { data } = await supabase.from('campaigns').select('*').limit(20)
  return NextResponse.json({ success:true, data:data||[], error:null })
}
export async function POST(req:Request){
  const body = await req.json()
  const supabase = await createClient()
  const { data:{ user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('campaigns').insert({ ...body, user_id: user?.id }).select().single()
  if(error) return NextResponse.json({ success:false, error:error.message },{status:500})
  return NextResponse.json({ success:true, data, error:null })
}
