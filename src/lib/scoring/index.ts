export function scoreLead(l:any): number {
  let s=0
  if(l.email_status==='VERIFIED') s+=30
  else if(l.email_status==='RISKY') s+=10
  if(l.phone_status==='VALID') s+=15
  if(l.website) s+=15
  if(l.facebook||l.instagram) s+=10
  if(l.city && l.country) s+=5
  if(l.contact_first_name) s+=5
  if(l.niche) s+=5
  // bonus for business domain not free
  if(l.email && !['gmail.com','yahoo.com','hotmail.com'].includes(l.email.split('@')[1]?.toLowerCase())) s+=10
  return Math.min(100, s)
}
export function scoreLabel(score:number){
  if(score>=80) return 'HOT'
  if(score>=50) return 'WARM'
  return 'COLD'
}
