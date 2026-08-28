import type { SourceAdapter, SourceMetadata, SearchCriteria, RawLead, NormalizedLead } from './types'
export abstract class BaseSourceAdapter implements SourceAdapter {
  abstract id: string
  abstract metadata: SourceMetadata
  abstract search(criteria: SearchCriteria): Promise<RawLead[]>
  abstract extract(input: unknown): Promise<RawLead[]>
  normalize(raw: RawLead): NormalizedLead {
    const nameParts = (raw.contactName||'').trim().split(/\s+/)
    return {
      business_name: raw.businessName.trim(),
      website: raw.website ? normalizeUrl(raw.website) : undefined,
      address: raw.address,
      city: raw.city,
      state: raw.state,
      country: raw.country,
      phone: raw.phone ? raw.phone.trim() : undefined,
      email: raw.email ? raw.email.toLowerCase().trim() : undefined,
      facebook: raw.facebook,
      instagram: raw.instagram,
      linkedin: raw.linkedin,
      contact_first_name: nameParts[0] || undefined,
      contact_last_name: nameParts.slice(1).join(' ') || undefined,
      contact_position: raw.contactPosition,
      source: this.id,
      source_url: raw.sourceUrl,
    }
  }
  validate(n: NormalizedLead): {valid:boolean; errors:string[]} {
    const errors:string[]=[]
    if (!n.business_name || n.business_name.length<2) errors.push('business_name required')
    if (n.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n.email)) errors.push('invalid email')
    if (n.website) try{ new URL(n.website) } catch{ errors.push('invalid website url')}
    return { valid: errors.length===0, errors }
  }
  getSourceMetadata(): SourceMetadata { return this.metadata }
}
function normalizeUrl(u:string){
  try { const url = u.startsWith('http')? u : 'https://'+u; return new URL(url).toString().replace(/\/$/,'') } catch { return u }
}
