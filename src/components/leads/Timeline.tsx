export function Timeline({ events }: { events: { date:string; text:string }[]}){
  return <ul className="space-y-3 mt-3">
    {events.map((e,i)=><li key={i} className="flex gap-3 text-sm"><span className="text-zinc-500 text-xs w-24 shrink-0">{e.date}</span><span>{e.text}</span></li>)}
    {events.length===0 && <li className="text-sm text-zinc-500">No activity yet</li>}
  </ul>
}
