import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
export default function Logs(){
  return <AppShell><h1 className="text-2xl font-bold">Admin Logs</h1><div className="grid md:grid-cols-2 gap-6 mt-6"><Card><h3 className="font-semibold">Activity Logs (user-facing)</h3><ul className="text-sm mt-3 space-y-1"><li>Lead imported • Email sent • Project created</li></ul></Card><Card><h3 className="font-semibold">System Logs (developer)</h3><ul className="text-sm mt-3 space-y-1"><li>API errors • OAuth failures • Queue failures</li></ul></Card></div></AppShell>
}
