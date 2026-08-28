import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(req:Request){
  const { to, subject, body, leadId } = await req.json()
  if(!to || !subject) return NextResponse.json({ success:false, error:'to and subject required' },{status:400})
  // In production: use gmail client with stored oauth tokens; here queue
  const supabase = await createClient()
  // Log to activity
  await supabase.from('activity_logs').insert({ action:'email_queued', entity_type:'lead', entity_id: leadId || null, details:{ to, subject } })
  return NextResponse.json({ success:true, data:{ queued:true, to, subject }, error:null })
}
