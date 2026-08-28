import Link from 'next/link'
export default function Home(){
  return <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
    <h1 className="text-4xl font-bold">Client Hunting Platform</h1>
    <p className="text-zinc-500 mt-3 max-w-xl">One dashboard + one Chrome Extension = complete personal client-hunting workspace. Find → Collect → Verify → AI Personalize → Gmail Send → Reply → Client.</p>
    <div className="flex gap-3 mt-6"><Link href="/login" className="px-6 py-3 bg-zinc-900 text-white rounded-lg">Login with Google</Link><Link href="/dashboard" className="px-6 py-3 border rounded-lg">Go to Dashboard</Link></div>
    <p className="text-xs text-zinc-400 mt-8">Modular Source Adapter → Extractor → Normalizer → Validator → Deduplicator → CRM</p>
  </div>
}
