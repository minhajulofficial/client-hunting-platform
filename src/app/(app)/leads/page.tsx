import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { LeadWorkspace, type LeadRow } from '@/components/leads/LeadWorkspace'
import { CsvImport } from '@/components/leads/CsvImport'
import { SetupRequired, ErrorState } from '@/components/ui/states'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

const STATUSES = ['NEW','REVIEW','VERIFIED','CONTACTED','REPLIED','INTERESTED','FOLLOW_UP','MEETING','PROPOSAL','WON','LOST','INVALID','UNSUBSCRIBED']

export default async function Leads({ searchParams }:{ searchParams: Promise<Record<string,string>> }){
  const params = await searchParams
  if(!isSupabaseConfigured()){
    return <AppShell><h1 className="text-2xl font-bold">Leads</h1><div className="mt-6"><SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']} /></div></AppShell>
  }

  const supabase = await createClient()
  let q = supabase.from('leads').select('*').order('created_at',{ ascending:false }).limit(100)
  for(const key of ['country','city','niche','status','email_status'] as const){
    if(params[key]) q = q.eq(key, params[key])
  }
  if(params.q) q = q.ilike('business_name', '%'+params.q+'%')
  const { data, error } = await q
  const leads = (data || []) as LeadRow[]

  const { data: projectData } = await supabase.from('projects').select('id,name').order('created_at',{ ascending:false }).limit(100)
  const projects = (projectData || []) as { id:string; name:string }[]

  return <AppShell>
    <h1 className="text-2xl font-bold">Leads</h1>
    <p className="text-sm text-zinc-500 mt-1">{leads.length} lead(s) shown · newest first · server-side filtering</p>

    {error && <div className="mt-4"><ErrorState message={error.message} /></div>}

    <Card className="mt-4">
      <form method="GET" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={params.q || ''} placeholder="Business name" className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs" />
        <input name="country" defaultValue={params.country || ''} placeholder="Country" className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs w-28" />
        <input name="city" defaultValue={params.city || ''} placeholder="City" className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs w-28" />
        <input name="niche" defaultValue={params.niche || ''} placeholder="Niche" className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs w-28" />
        <select name="status" defaultValue={params.status || ''} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-white"><option value="">Any status</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
        <select name="email_status" defaultValue={params.email_status || ''} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-white"><option value="">Any email status</option><option>VERIFIED</option><option>RISKY</option><option>INVALID</option><option>UNKNOWN</option></select>
        <button className="px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-xs">Filter</button>
        <a href="/leads" className="px-3 py-1.5 border border-zinc-200 bg-white rounded-lg text-xs">Reset</a>
      </form>
      <div className="mt-4"><LeadWorkspace leads={leads} /></div>
    </Card>

    <Card className="mt-6"><CsvImport projects={projects} /></Card>
  </AppShell>
}
