export function Badge({children, tone='default'}:{children:React.ReactNode; tone?:'default'|'green'|'red'|'yellow'|'blue'}){
  const m={default:'bg-zinc-100 text-zinc-700 border border-zinc-200', green:'bg-green-50 text-green-700 border border-green-200', red:'bg-red-50 text-red-700 border border-red-200', yellow:'bg-amber-50 text-amber-700 border border-amber-200', blue:'bg-blue-50 text-blue-700 border border-blue-200'}
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${m[tone]}`}>{children}</span>
}
