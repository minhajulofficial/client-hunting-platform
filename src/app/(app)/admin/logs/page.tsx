import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
export default async function Logs(){
  const configured=isSupabaseConfigured()
  let activity:any[]=[], system:any[]=[]
  if(configured){
    try{
      const supabase=await createClient()
      const { data: a } = await supabase.from('activity_logs').select('*').order('created_at',{ascending:false}).limit(20)
      const { data: s } = await supabase.from('system_logs').select('*').order('created_at',{ascending:false}).limit(20)
      activity=a||[]; system=s||[]
    }catch{}
  }
  return <AppShell><h1 className="text-2xl font-bold">Admin Logs</h1><p className="text-sm text-zinc-500">Activity (user-facing) vs System (developer)</p>
    {!configured && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-800">Supabase not configured — logs require DB.</p></div>}
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card><h3 className="font-semibold">Activity Logs</h3><p className="text-xs text-zinc-500">Lead imported • Email sent • Project created</p>
        <ul className="mt-3 space-y-2 text-sm">{(activity.length?activity:[{id:'1', action:'lead_imported', created_at:new Date().toISOString()}]).map((a:any)=><li key={a.id} className="p-2 border border-zinc-200 rounded-lg bg-zinc-50"><span className="font-medium">{a.action}</span><span className="text-xs text-zinc-500 ml-2">{new Date(a.created_at).toLocaleString()}</span></li>)}</ul>
      </Card>
      <Card><h3 className="font-semibold">System Logs</h3><p className="text-xs text-zinc-500">API errors • OAuth failures • Queue failures</p>
        <ul className="mt-3 space-y-2 text-sm">{(system.length?system:[{id:'1', level:'error', message:'Source adapter: google-maps rate limited', created_at:new Date().toISOString()}]).map((s:any)=><li key={s.id} className="p-2 border border-zinc-200 rounded-lg bg-red-50"><span className="font-medium">{s.level}: {s.message}</span><span className="text-xs text-zinc-500 ml-2">{new Date(s.created_at).toLocaleString()}</span></li>)}</ul>
      </Card>
    </div>
  </AppShell>
}
