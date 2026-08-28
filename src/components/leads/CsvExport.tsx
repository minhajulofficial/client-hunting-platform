'use client'
export function CsvExport({ leads }: { leads:any[]}){
  function exp(){
    if(!leads.length) return alert('No leads to export')
    const header=Object.keys(leads[0]).join(',')
    const rows=leads.map(r=> Object.values(r).map(v=> `"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob=new Blob([header+'\n'+rows],{type:'text/csv'})
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='leads.csv'; a.click()
  }
  return <button onClick={exp} className="px-3 py-2 border rounded-lg text-sm">Export filtered</button>
}
