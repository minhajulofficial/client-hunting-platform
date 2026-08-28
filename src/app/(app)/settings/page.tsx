import { AppShell } from '@/components/layout/AppShell'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default function Settings(){
  return <AppShell>
    <h1 className="text-2xl font-bold">Settings</h1>
    <p className="text-sm text-zinc-500 mt-1">General · AI · Campaign — changes are saved to your account</p>
    <div className="mt-6"><SettingsForm /></div>
    <div className="flex gap-3 mt-6">
      <a href="/settings/api" className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm">API Keys (server-only)</a>
      <a href="/settings/extension" className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-sm">Extension session</a>
    </div>
  </AppShell>
}
