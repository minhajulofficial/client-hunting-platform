import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(req:Request){
  const { searchParams } = new URL(req.url)
  const supabase = await createClient()
  let q = supabase.from('leads').select('*').order('created_at',{ascending:false}).limit(50)
  const country = searchParams.get('country'); if(country) q=q.eq('country',country)
  const city = searchParams.get('city'); if(city) q=q.eq('city',city)
  const niche = searchParams.get('niche'); if(niche) q=q.eq('niche',niche)
  const status = searchParams.get('status'); if(status) q=q.eq('status',status)
  const email_status = searchParams.get('email_status'); if(email_status) q=q.eq('email_status',email_status)
  const { data, error } = await q
  if(error) return NextResponse.json({ success:false, error:error.message },{status:500})
  return NextResponse.json({ success:true, data, error:null })
}
