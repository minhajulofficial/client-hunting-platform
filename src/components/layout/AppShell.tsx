import { Sidebar } from './Sidebar'
export function AppShell({children}:{children:React.ReactNode}){
  return <div className="flex min-h-screen bg-[#fcfcfd]">
    <Sidebar/>
    <main className="flex-1 min-w-0 bg-[#fcfcfd]"><div className="max-w-[1400px] mx-auto p-6 md:p-8">{children}</div></main>
  </div>
}
