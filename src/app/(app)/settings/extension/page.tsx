import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
export default function ExtSettings(){ return <AppShell><h1 className="text-2xl font-bold">Extension</h1><Card className="mt-6"><p className="text-sm">Connected: ✓ • Extension authenticates via short-lived session token, not permanent secret. Show Connected / Disconnect / Reconnect.</p><button className="mt-3 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">Generate Session Token</button></Card></AppShell> }
