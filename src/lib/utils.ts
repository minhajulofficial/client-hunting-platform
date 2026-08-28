export function cn(...a:(string|false|undefined)[]){ return a.filter(Boolean).join(' ') }
export function formatDate(d:string){ try{ return new Date(d).toLocaleString() } catch{ return d } }
