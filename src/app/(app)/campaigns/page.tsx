import { AppShell } from '@/components/layout/AppShell'
import { CampaignManager } from '@/components/campaigns/CampaignManager'
import { SetupRequired } from '@/components/ui/states'
import { isSupabaseConfigured } from '@/lib/supabase/server'

export default function Campaigns(){
  const configured = isSupabaseConfigured()
  return <AppShell>
    <h1 className="text-2xl font-bold">Campaigns</h1>
    <p className="text-sm text-zinc-500 mt-1">Queue: QUEUED → SENDING → SENT. Follow-ups stop automatically on REPLIED / UNSUBSCRIBED / WON.</p>
    <div className="mt-6 space-y-4">
      {!configured && <SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']} />}
      {configured && <CampaignManager />}
    </div>
  </AppShell>
}
