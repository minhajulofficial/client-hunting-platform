import type { NormalizedLead } from '../sources/types'

export interface DuplicateCheck { isDuplicate: boolean; isPossibleDuplicate: boolean; matchedOn: string[]; existingId?: string }

function normalizeDomain(url?:string){ if(!url) return ''; try{ return new URL(url.startsWith('http')?url:'https://'+url).hostname.replace(/^www\./,'').toLowerCase() } catch{ return url.toLowerCase() } }

export function checkDuplicate(candidate: NormalizedLead, existing: {id:string; email?:string; phone?:string; website?:string; business_name?:string; address?:string}[]): DuplicateCheck[] {
  return existing.map(e=>{
    const matched:string[]=[]
    if (candidate.email && e.email && candidate.email.toLowerCase()===e.email.toLowerCase()) matched.push('email')
    if (candidate.phone && e.phone && candidate.phone.replace(/\D/g,'')===e.phone.replace(/\D/g,'')) matched.push('phone')
    if (candidate.website && e.website && normalizeDomain(candidate.website)===normalizeDomain(e.website)) matched.push('website')
    if (candidate.business_name && e.business_name && candidate.business_name.toLowerCase().trim()===e.business_name.toLowerCase().trim()) matched.push('business_name')
    if (matched.includes('email') || matched.includes('phone') || matched.includes('website')) return { isDuplicate:true, isPossibleDuplicate:false, matchedOn:matched, existingId:e.id }
    if (matched.length>0) return { isDuplicate:false, isPossibleDuplicate:true, matchedOn:matched, existingId:e.id }
    return { isDuplicate:false, isPossibleDuplicate:false, matchedOn:[], existingId:e.id }
  }).filter(r=>r.isDuplicate||r.isPossibleDuplicate)
}

export function dedupSummary(results:{isDuplicate:boolean; isPossibleDuplicate:boolean}[]){
  const dup = results.filter(r=>r.isDuplicate).length
  const possible = results.filter(r=>r.isPossibleDuplicate).length
  return { dup, possible }
}
