import { AppShell } from '@/components/layout/AppShell'
import { TemplateManager } from '@/components/templates/TemplateManager'
import { SetupRequired } from '@/components/ui/states'
import { isSupabaseConfigured } from '@/lib/supabase/server'

export default function Templates(){
  const configured = isSupabaseConfigured()
  return <AppShell>
    <h1 className="text-2xl font-bold">Templates</h1>
    <p className="text-sm text-zinc-500 mt-1">Stored in <code className="bg-zinc-100 px-1 rounded">email_templates</code>. Variables resolve before sending.</p>
    <div className="mt-6">
      {configured ? <TemplateManager /> : <SetupRequired what="Database" vars={['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']} />}
    </div>
  </AppShell>
}
