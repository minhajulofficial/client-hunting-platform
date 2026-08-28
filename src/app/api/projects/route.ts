import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(){
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*').order('created_at',{ascending:false})
  return NextResponse.json({ success:true, data:data||[], error:null })
}
export async function POST(req:Request){
  const body = await req.json()
  const supabase = await createClient()
  const { data:{ user } } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({ success:false, error:'Unauthorized' },{status:401})
  const { data, error } = await supabase.from('projects').insert({ ...body, user_id:user.id }).select().single()
  if(error) return NextResponse.json({ success:false, error:error.message },{status:500})
  return NextResponse.json({ success:true, data, error:null })
}
