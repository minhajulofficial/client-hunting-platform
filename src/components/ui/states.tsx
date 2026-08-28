export function EmptyState({ title, description, action }: { title:string; description:string; action?: React.ReactNode }){
  return <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
    <h3 className="font-semibold text-zinc-900">{title}</h3>
    <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">{description}</p>
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
}
export function ErrorState({ message }: { message:string }){
  return <div className="rounded-xl border border-red-200 bg-red-50 p-4">
    <h3 className="font-semibold text-red-900 text-sm">Something went wrong</h3>
    <p className="text-sm text-red-700 mt-1">{message}</p>
  </div>
}
export function SetupRequired({ what, vars }: { what:string; vars:string[] }){
  return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
    <h3 className="font-semibold text-amber-900 text-sm">NOT CONFIGURED — {what}</h3>
    <p className="text-sm text-amber-800 mt-1">Set these environment variables in Vercel → Settings → Environment Variables, then redeploy:</p>
    <ul className="text-xs text-amber-800 mt-2 space-y-0.5">{vars.map(v=> <li key={v}><code className="bg-white px-1 rounded">{v}</code></li>)}</ul>
    <p className="text-xs text-amber-700 mt-2">Full instructions: <code className="bg-white px-1 rounded">docs/DEVELOPER_SETUP.md</code></p>
  </div>
}
export function Spinner({ label }: { label:string }){
  return <span className="inline-flex items-center gap-2 text-sm text-zinc-500"><span className="h-3 w-3 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />{label}</span>
}
