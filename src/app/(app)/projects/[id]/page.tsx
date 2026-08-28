import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/card'
export default async function ProjectDetail({params}:{params:Promise<{id:string}>}){ const {id}=await params; return <AppShell><h1 className="text-2xl font-bold">Project {id}</h1><Card className="mt-6"><p className="text-sm text-zinc-500">Project detail, pipeline Kanban (NEW → VERIFIED → CONTACTED → REPLIED → INTERESTED → MEETING → PROPOSAL → WON/LOST), leads, campaigns, activity timeline.</p></Card></AppShell> }
