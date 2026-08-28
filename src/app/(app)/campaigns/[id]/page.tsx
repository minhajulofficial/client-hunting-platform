import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
export default async function CampaignDetail({params}:{params:Promise<{id:string}>}){ const {id}=await params; return <AppShell><h1 className="text-2xl font-bold">Campaign {id}</h1><Card className="mt-6"><p className="text-sm">Queue status: QUEUED / SENDING / SENT / FAILED / BOUNCED / REPLIED / UNSUBSCRIBED. Follow-ups Day 0 / Day 3 / Day 7. Auto-stop on reply.</p></Card></AppShell> }
