import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title:'Client Hunter - Personal CRM', description:'AI-powered client hunting platform' }
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en" className="light" style={{ colorScheme: 'light' }}><body className="min-h-screen bg-[#fcfcfd] text-zinc-900 antialiased">{children}</body></html>
}
