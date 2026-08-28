export interface SearchCriteria {
  country: string; state?: string; city?: string; niche: string; subNiche?: string; position?: string; limit?: number
}
export interface RawLead {
  businessName: string; website?: string; address?: string; city?: string; state?: string; country?: string;
  phone?: string; email?: string; facebook?: string; instagram?: string; linkedin?: string;
  contactName?: string; contactPosition?: string; source: string; sourceUrl?: string; raw?: Record<string,unknown>
}
export interface NormalizedLead {
  business_name: string; website?: string; address?: string; city?: string; state?: string; country?: string;
  phone?: string; email?: string; facebook?: string; instagram?: string; linkedin?: string;
  contact_first_name?: string; contact_last_name?: string; contact_position?: string;
  source: string; source_url?: string; niche?: string
}
export interface SourceMetadata { id: string; name: string; description: string; supported: boolean }
export interface SourceAdapter {
  id: string
  metadata: SourceMetadata
  search(criteria: SearchCriteria): Promise<RawLead[]>
  extract(input: unknown): Promise<RawLead[]>
  normalize(raw: RawLead): NormalizedLead
  validate(normalized: NormalizedLead): { valid: boolean; errors: string[] }
  getSourceMetadata(): SourceMetadata
}
