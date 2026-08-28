import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(req: Request){
  const body=await req.json()
  const supabase=await createClient()
  const { data, error } = await supabase.from('campaign_recipients').insert({ campaign_id: body.campaign_id, lead_id: body.lead_id, status:'QUEUED', recipient_email: body.recipient_email || null }).select().single()
  if(error) return NextResponse.json({ success:false, error:error.message },{status:500})
  return NextResponse.json({ success:true, data, error:null })
}
