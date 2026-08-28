export type SocialStatus='FOUND'|'NOT_FOUND'|'UNCERTAIN'
export function verifySocialUrl(url?:string, businessName?:string): SocialStatus{
  if (!url) return 'NOT_FOUND'
  try{ new URL(url); return 'FOUND' } catch{ return 'UNCERTAIN' }
}
