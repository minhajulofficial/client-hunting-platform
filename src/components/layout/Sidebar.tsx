'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Users, Megaphone, Inbox, FileText, Bot, Plug, Settings, Shield, LogOut } from 'lucide-react'
const nav = [
  { href:'/dashboard', label:'Dashboard', icon: LayoutDashboard },
  { href:'/projects', label:'Projects', icon: FolderKanban },
  { href:'/leads', label:'Leads', icon: Users },
  { href:'/campaigns', label:'Campaigns', icon: Megaphone },
  { href:'/inbox', label:'Inbox', icon: Inbox },
  { href:'/templates', label:'Templates', icon: FileText },
  { href:'/ai', label:'AI', icon: Bot },
  { href:'/integrations', label:'Integrations', icon: Plug },
  { href:'/settings', label:'Settings', icon: Settings },
  { href:'/admin/logs', label:'Admin Logs', icon: Shield },
]
export function Sidebar(){
  const path = usePathname()
  return <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white min-h-screen flex flex-col">
    <div className="p-5 border-b border-zinc-200"><Link href="/dashboard" className="font-bold text-lg text-zinc-900">🎯 Client Hunter</Link><p className="text-xs text-zinc-500">Personal CRM • Light</p></div>
    <nav className="flex-1 p-3 space-y-1">
      {nav.map(i=>{const active=path===i.href||(i.href!=='/dashboard'&&path.startsWith(i.href)); return <Link key={i.href} href={i.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active?'bg-zinc-900 text-white shadow-sm':'text-zinc-700 hover:bg-zinc-100'}`}><i.icon size={18}/>{i.label}</Link>})}
    </nav>
    <div className="p-3 border-t border-zinc-200"><a href="/login" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition"><LogOut size={16}/>Sign out</a></div>
  </aside>
}
