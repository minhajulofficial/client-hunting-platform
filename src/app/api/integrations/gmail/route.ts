import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(){
  const supabase=await createClient()
  const { data:{ user } }=await supabase.auth.getUser()
  if(!user) return NextResponse.json({ success:true, data:{ connected:false, reason:'not logged in' }, error:null })
  const { data } = await supabase.from('oauth_accounts').select('provider, created_at').eq('user_id',user.id).eq('provider','gmail').single()
  return NextResponse.json({ success:true, data:{ connected: !!data, account: data||null, authUrl: `/api/integrations/gmail/auth` }, error:null })
}
