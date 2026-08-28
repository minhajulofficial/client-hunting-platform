import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(){
  const supabase = await createClient()
  const { data, error } = await supabase.from('email_threads').select('*, email_messages(*)').limit(20)
  if(error) return NextResponse.json({ success:false, error:error.message },{status:500})
  return NextResponse.json({ success:true, data, error:null })
}
