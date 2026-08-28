export function Badge({children, tone='default'}:{children:React.ReactNode; tone?:'default'|'green'|'red'|'yellow'|'blue'}){
  const m={default:'bg-zinc-100 text-zinc-700', green:'bg-green-100 text-green-700', red:'bg-red-100 text-red-700', yellow:'bg-amber-100 text-amber-700', blue:'bg-blue-100 text-blue-700'}
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${m[tone]}`}>{children}</span>
}
