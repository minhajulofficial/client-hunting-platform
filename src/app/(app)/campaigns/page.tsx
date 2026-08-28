import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
export default function Campaigns(){
  return <AppShell><div className="flex justify-between"><h1 className="text-2xl font-bold">Campaigns</h1><button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">New Campaign</button></div><div className="grid md:grid-cols-2 gap-4 mt-6"><Link href="/campaigns/1"><Card><h3 className="font-semibold">Dental Website Outreach</h3><p className="text-sm text-zinc-500">150 recipients • 112 verified • 21 risky • 17 invalid</p><p className="text-xs mt-2">QUEUED → SENDING → SENT with rate limiting. Stop on REPLIED/UNSUBSCRIBED/WON.</p></Card></Link></div></AppShell>
}
