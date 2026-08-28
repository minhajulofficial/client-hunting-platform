import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SetupRequired } from '@/components/ui/states'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface ActivityRow { id:string; action:string; entity_type?:string|null; created_at:string; details?:unknown }
interface SystemRow { id:string; level:string; message:string; created_at:string; details?:unknown }

export default async function Logs(){
  if(!isSupabaseConfigured()){
    return <AppShell><h1 className="text-2xl font-bold">Logs</h1><div className="mt-6"><SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']} /></div></AppShell>
  }
  const supabase = await createClient()
  const { data: activity, error: aErr } = await supabase.from('activity_logs').select('*').order('created_at',{ ascending:false }).limit(50)
  const { data: system, error: sErr } = await supabase.from('system_logs').select('*').order('created_at',{ ascending:false }).limit(50)

  const acts = (activity || []) as ActivityRow[]
  const sys = (system || []) as SystemRow[]

  return <AppShell>
    <h1 className="text-2xl font-bold">Logs</h1>
    <p className="text-sm text-zinc-500 mt-1">Activity (user-facing) and System (developer). No placeholder entries — empty means nothing has happened yet.</p>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card>
        <h3 className="font-semibold">Activity logs <Badge>{acts.length}</Badge></h3>
        {aErr && <p className="text-sm text-red-600 mt-2">{aErr.message}</p>}
        {acts.length===0 && !aErr && <p className="text-sm text-zinc-500 mt-3">No activity yet. Import a lead or send an email to generate events.</p>}
        <ul className="mt-3 space-y-2">{acts.map(a=> <li key={a.id} className="p-2 border border-zinc-200 rounded-lg bg-zinc-50 text-sm">
          <div className="flex justify-between gap-2"><span className="font-medium">{a.action.replace(/_/g,' ')}</span><span className="text-xs text-zinc-500 shrink-0">{new Date(a.created_at).toLocaleString()}</span></div>
          {a.details ? <pre className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap break-all">{JSON.stringify(a.details)}</pre> : null}
        </li>)}</ul>
      </Card>
      <Card>
        <h3 className="font-semibold">System logs <Badge>{sys.length}</Badge></h3>
        {sErr && <p className="text-sm text-red-600 mt-2">{sErr.message}</p>}
        {sys.length===0 && !sErr && <p className="text-sm text-zinc-500 mt-3">No system errors recorded. Failures (OAuth, queue, adapters) appear here.</p>}
        <ul className="mt-3 space-y-2">{sys.map(s=> <li key={s.id} className="p-2 border border-red-200 rounded-lg bg-red-50 text-sm">
          <div className="flex justify-between gap-2"><span className="font-medium">{s.level}: {s.message}</span><span className="text-xs text-zinc-500 shrink-0">{new Date(s.created_at).toLocaleString()}</span></div>
        </li>)}</ul>
      </Card>
    </div>
  </AppShell>
}
