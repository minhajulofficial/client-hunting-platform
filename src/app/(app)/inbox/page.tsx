import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GmailSyncButton } from '@/components/email/GmailSyncButton'
import { EmptyState, SetupRequired } from '@/components/ui/states'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface Thread { id:string; subject?:string|null; snippet?:string|null; gmail_thread_id?:string|null; lead_id?:string|null; updated_at:string }

export default async function Inbox(){
  if(!isSupabaseConfigured()){
    return <AppShell><h1 className="text-2xl font-bold">Inbox</h1><div className="mt-6"><SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']} /></div></AppShell>
  }
  const supabase = await createClient()
  const { data, error } = await supabase.from('email_threads').select('*').order('updated_at',{ ascending:false }).limit(50)
  const threads = (data || []) as Thread[]

  return <AppShell>
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div><h1 className="text-2xl font-bold">Inbox</h1><p className="text-sm text-zinc-500 mt-1">Replies synced from Gmail and matched to leads by email address and thread id.</p></div>
      <GmailSyncButton />
    </div>

    {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>}

    <div className="mt-6">
      {threads.length===0
        ? <EmptyState title="No conversations yet" description="Connect Gmail in Integrations, send outreach, then press Sync Gmail. Real replies will appear here and set the lead status to REPLIED." action={<a href="/integrations" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Go to Integrations</a>} />
        : <div className="space-y-3">{threads.map(t=>
            <Card key={t.id}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{t.subject || '(no subject)'}</h3>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{t.snippet || ''}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone="green">REPLIED</Badge>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(t.updated_at).toLocaleString()}</p>
                </div>
              </div>
              {t.lead_id && <a href={'/leads/'+t.lead_id} className="text-xs underline mt-2 inline-block">Open lead</a>}
            </Card>)}
          </div>}
    </div>
  </AppShell>
}
