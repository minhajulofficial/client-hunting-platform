import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
export default function Inbox(){
  return <AppShell><h1 className="text-2xl font-bold">Inbox</h1><p className="text-sm text-zinc-500">Gmail-synced conversations matched to leads via thread ID</p><div className="grid md:grid-cols-3 gap-6 mt-6"><Card><h3 className="font-semibold">Conversations</h3><div className="mt-3 p-3 border rounded-lg"><p className="font-medium text-sm">ABC Dental — John Smith <Badge tone="green">REPLIED</Badge></p><p className="text-sm text-zinc-500">Hi, thanks for reaching out...</p></div></Card><Card className="md:col-span-2"><h3 className="font-semibold">Thread</h3><p className="text-sm text-zinc-500 mt-2">Lead info + email conversation + CRM timeline + AI reply suggestion (user must approve).</p></Card></div></AppShell>
}
