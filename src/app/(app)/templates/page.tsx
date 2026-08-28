import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
export default function Templates(){
  return <AppShell><div className="flex justify-between"><h1 className="text-2xl font-bold">Templates</h1><button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">New Template</button></div><Card className="mt-6"><p className="text-sm">Variables: {"{{first_name}} {{business_name}} {{city}} {{website}} {{service}}"} — subject + body + service/niche/country/language + status.</p><pre className="bg-zinc-50 p-4 rounded mt-3 text-xs">{"Subject: Quick idea for {{business_name}} in {{city}}\nBody: Hi {{first_name}}, I noticed {{business_name}}..."}</pre></Card></AppShell>
}
