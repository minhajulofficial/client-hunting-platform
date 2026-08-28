import { AppShell } from '@/components/layout/AppShell'
import { Card, StatCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CampaignRunner } from '@/components/campaigns/CampaignRunner'
import { EmptyState, SetupRequired } from '@/components/ui/states'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

interface Recipient { id:string; recipient_email?:string|null; status:string; lead_id?:string|null; error?:string|null; sent_at?:string|null }

export default async function CampaignDetail({ params }:{ params: Promise<{ id:string }> }){
  const { id } = await params
  if(!isSupabaseConfigured()){
    return <AppShell><h1 className="text-2xl font-bold">Campaign</h1><div className="mt-6"><SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']} /></div></AppShell>
  }
  const supabase = await createClient()
  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle()
  if(!campaign){
    return <AppShell><h1 className="text-2xl font-bold">Campaign</h1><div className="mt-6"><EmptyState title="Campaign not found" description="It may have been deleted or belongs to another account." action={<a href="/campaigns" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Back to Campaigns</a>} /></div></AppShell>
  }

  const { data } = await supabase.from('campaign_recipients').select('*').eq('campaign_id', id).order('created_at',{ ascending:false }).limit(200)
  const list = (data || []) as Recipient[]
  const count = (s:string)=> list.filter(r=>r.status===s).length

  return <AppShell>
    <h1 className="text-2xl font-bold">{campaign.name}</h1>
    <p className="text-sm text-zinc-500 mt-1">Status {campaign.status} · created {new Date(campaign.created_at).toLocaleDateString()}</p>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <StatCard label="Queued" value={count('QUEUED')} />
      <StatCard label="Sent" value={count('SENT')} />
      <StatCard label="Failed" value={count('FAILED')+count('BOUNCED')} />
      <StatCard label="Replied" value={count('REPLIED')} />
    </div>

    <Card className="mt-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div><h3 className="font-semibold">Recipients ({list.length})</h3><p className="text-xs text-zinc-500 mt-1">Only VERIFIED / RISKY emails are sent. UNSUBSCRIBED, NOT_INTERESTED and WON leads are skipped.</p></div>
        <CampaignRunner campaignId={id} queued={count('QUEUED')} />
      </div>
      {list.length===0
        ? <p className="text-sm text-zinc-500 mt-4">No recipients yet. Open <a href="/leads" className="underline">Leads</a>, select leads and add them to this campaign.</p>
        : <div className="overflow-auto mt-4"><table className="w-full text-sm">
            <thead><tr className="text-zinc-500 border-b"><th className="text-left p-2">Email</th><th className="text-left p-2">Status</th><th className="text-left p-2">Sent at</th><th className="text-left p-2">Error</th></tr></thead>
            <tbody>{list.map(r=> <tr key={r.id} className="border-b last:border-0">
              <td className="p-2 break-all">{r.recipient_email || '—'}</td>
              <td className="p-2"><Badge tone={r.status==='SENT'?'green':r.status==='FAILED'||r.status==='BOUNCED'?'red':'yellow'}>{r.status}</Badge></td>
              <td className="p-2 text-xs text-zinc-500">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}</td>
              <td className="p-2 text-xs text-red-600 break-all">{r.error || ''}</td>
            </tr>)}</tbody>
          </table></div>}
    </Card>
  </AppShell>
}
