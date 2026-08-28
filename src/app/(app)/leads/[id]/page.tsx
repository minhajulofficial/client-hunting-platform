import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Timeline } from '@/components/leads/Timeline'
import { LeadStatusControl } from '@/components/leads/LeadStatusControl'
import { VerificationBadge } from '@/components/leads/VerificationBadge'
import { Composer } from '@/components/email/Composer'
import { EmptyState, SetupRequired } from '@/components/ui/states'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export default async function LeadDetail({ params }:{ params: Promise<{ id:string }> }){
  const { id } = await params
  if(!isSupabaseConfigured()){
    return <AppShell><h1 className="text-2xl font-bold">Lead</h1><div className="mt-6"><SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']} /></div></AppShell>
  }

  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()

  if(!lead){
    return <AppShell><h1 className="text-2xl font-bold">Lead</h1><div className="mt-6"><EmptyState title="Lead not found" description="This lead does not exist or belongs to another account. Row Level Security only exposes your own leads." action={<a href="/leads" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Back to Leads</a>} /></div></AppShell>
  }

  const { data: logs } = await supabase.from('activity_logs').select('*').eq('entity_id', id).order('created_at',{ ascending:true }).limit(50)
  const events = (logs||[]).map((r: { created_at:string; action:string; details?:unknown })=>({
    date: new Date(r.created_at).toLocaleString(),
    text: r.action.replace(/_/g,' ') + (r.details ? ' — ' + JSON.stringify(r.details).slice(0,90) : '')
  }))

  const socials = [lead.facebook, lead.instagram, lead.linkedin].filter(Boolean)

  return <AppShell>
    <div className="flex flex-wrap justify-between items-start gap-2">
      <div><h1 className="text-2xl font-bold">{lead.business_name}</h1><p className="text-sm text-zinc-500">{[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'No location'} · score {lead.lead_score ?? 0}/100</p></div>
      <Badge tone={lead.status==='WON'||lead.status==='REPLIED'?'green':lead.status==='LOST'||lead.status==='INVALID'?'red':'yellow'}>{lead.status}</Badge>
    </div>

    <div className="grid md:grid-cols-3 gap-6 mt-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <h3 className="font-semibold">Business &amp; contact</h3>
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-500 text-xs">Contact person</span><p>{[lead.contact_first_name, lead.contact_last_name].filter(Boolean).join(' ') || '—'}</p><p className="text-xs text-zinc-500">{lead.contact_position || '—'}</p></div>
            <div><span className="text-zinc-500 text-xs">Niche</span><p>{lead.niche || '—'}</p></div>
            <div><span className="text-zinc-500 text-xs">Email</span><p className="break-all">{lead.email || '—'}</p></div>
            <div><span className="text-zinc-500 text-xs">Phone</span><p>{lead.phone || '—'}</p></div>
            <div><span className="text-zinc-500 text-xs">Website</span><p className="truncate">{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="underline">{lead.website}</a> : '—'}</p></div>
            <div><span className="text-zinc-500 text-xs">Source</span><p>{lead.source || '—'}</p></div>
            <div className="sm:col-span-2"><span className="text-zinc-500 text-xs">Social</span><p className="text-xs break-all">{socials.length ? socials.join(' · ') : '—'}</p></div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-200"><VerificationBadge lead={lead} /></div>
        </Card>

        <Card>
          <h3 className="font-semibold">Send email</h3>
          {lead.email
            ? <div className="mt-3"><Composer to={lead.email} lead={lead} /></div>
            : <p className="text-sm text-zinc-500 mt-2">This lead has no email address, so no email can be sent. Add one or collect it from the business website.</p>}
        </Card>
      </div>

      <div className="space-y-6">
        <Card><h3 className="font-semibold">Status</h3><div className="mt-3"><LeadStatusControl leadId={lead.id} current={lead.status} /></div></Card>
        <Card><h3 className="font-semibold">Timeline</h3>
          {events.length ? <Timeline events={events} /> : <p className="text-sm text-zinc-500 mt-2">No activity recorded yet. Events appear here when the lead is verified, emailed or replies.</p>}
        </Card>
      </div>
    </div>
  </AppShell>
}
