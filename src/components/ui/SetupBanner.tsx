export function SetupBanner(){
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  // This is server component - check at runtime; if not configured show banner
  return null
}
export function SetupBannerClient({ isConfigured }: { isConfigured: boolean }){
  if(isConfigured) return null
  return <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <h3 className="font-semibold text-amber-900">Setup Required</h3>
    <p className="text-sm text-amber-800 mt-1">Supabase not configured. Set <code className="bg-white px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="bg-white px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code className="bg-white px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> in <code className="bg-white px-1 rounded">.env.local</code> and Vercel → Settings → Environment Variables.</p>
    <p className="text-xs text-amber-700 mt-2">Then run <code className="bg-white px-1 rounded">supabase/schema.sql</code> in Supabase SQL Editor. See <a href="/docs/BEGINNER_SETUP.md" className="underline">BEGINNER_SETUP.md</a></p>
  </div>
}
