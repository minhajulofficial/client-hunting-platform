import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { LeadTable } from '@/components/leads/LeadTable'
import { CsvImport } from '@/components/leads/CsvImport'
import { CsvExport } from '@/components/leads/CsvExport'
import Link from 'next/link'
export default async function Leads({ searchParams }: { searchParams: Promise<Record<string,string>> }){
  const params=await searchParams
  const configured = isSupabaseConfigured()
  let list:any[] = []
  let errorMsg = ''
  if(configured){
    try{
      const supabase=await createClient()
      if(supabase){
        let q=supabase.from('leads').select('*').order('created_at',{ascending:false}).limit(50)
        if(params.country) q=q.eq('country',params.country)
        if(params.city) q=q.eq('city',params.city)
        if(params.niche) q=q.eq('niche',params.niche)
        if(params.status) q=q.eq('status',params.status)
        const { data, error } = await q
        if(error) errorMsg = error.message
        else list = data||[]
      }
    }catch(e:any){ errorMsg = e.message }
  }
  return <AppShell>
    {!configured && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-semibold text-amber-900">Setup Required</h3><p className="text-sm text-amber-800 mt-1">Supabase not configured — leads will not persist. Add <code className="bg-white px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> + <code className="bg-white px-1 rounded">ANON_KEY</code> + <code className="bg-white px-1 rounded">SERVICE_ROLE</code> to Vercel env and redeploy. See <code className="bg-white px-1 rounded">docs/BEGINNER_SETUP.md</code></p></div>}
    <div className="flex flex-wrap gap-2 items-center justify-between"><h1 className="text-2xl font-bold">Leads</h1><div className="flex gap-2"><Link href="/leads?status=NEW" className="px-3 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Filter NEW</Link><CsvExport leads={list} /><Link href="/leads" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Add Lead</Link></div></div>
    {errorMsg && <p className="text-sm text-red-600 mt-3">Error: {errorMsg}</p>}
    <Card className="mt-4">
      <form className="flex flex-wrap gap-2 mb-4" method="GET">
        <input name="country" placeholder="Country" defaultValue={params.country||''} className="px-3 py-1.5 border border-zinc-200 rounded-full text-xs bg-white" />
        <input name="city" placeholder="City" defaultValue={params.city||''} className="px-3 py-1.5 border border-zinc-200 rounded-full text-xs bg-white" />
        <input name="niche" placeholder="Niche" defaultValue={params.niche||''} className="px-3 py-1.5 border border-zinc-200 rounded-full text-xs bg-white" />
        <select name="status" defaultValue={params.status||''} className="px-3 py-1.5 border border-zinc-200 rounded-full text-xs bg-white"><option value="">All statuses</option><option>NEW</option><option>VERIFIED</option><option>CONTACTED</option><option>REPLIED</option><option>WON</option></select>
        <button type="submit" className="px-4 py-1.5 bg-zinc-900 text-white rounded-full text-xs">Search</button>
      </form>
      <LeadTable leads={list} />
      {list.length===0 && configured && <p className="text-sm text-zinc-500 text-center py-4">No leads yet — use Chrome Extension → START CLIENT HUNT → preview → Import Selected, or import CSV below.</p>}
      <p className="text-xs text-zinc-500 mt-3">Filters: Country • City • Niche • Position • Email status • Website • Social • Status • Project • Date • Score • Tags. Deduplication on email/phone/domain/name server-side.</p>
    </Card>
    <Card className="mt-6"><CsvImport /></Card>
  </AppShell>
}
