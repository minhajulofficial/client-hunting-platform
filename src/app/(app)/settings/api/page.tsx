import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
export default function ApiSettings(){ return <AppShell><h1 className="text-2xl font-bold">API Settings</h1><Card className="mt-6"><p className="text-sm text-zinc-500">Server-side keys only. Never expose to extension/frontend bundle.</p><ul className="text-sm mt-3 space-y-1"><li>AI API Key (server)</li><li>Supabase Service Role (server)</li><li>Gmail Client Secret (server)</li><li>Meta App Secret (server)</li></ul></Card></AppShell> }
