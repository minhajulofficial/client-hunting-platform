import { Sidebar } from './Sidebar'
export function AppShell({children}:{children:React.ReactNode}){
  return <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
    <Sidebar/>
    <main className="flex-1 min-w-0"><div className="max-w-[1400px] mx-auto p-6 md:p-8">{children}</div></main>
  </div>
}
