import { BaseSourceAdapter } from '../base'
import type { SearchCriteria, RawLead, SourceMetadata } from '../types'
export class FacebookAdapter extends BaseSourceAdapter {
  id = 'facebook'
  metadata: SourceMetadata = { id: 'facebook', name: 'Facebook', description: 'Adapter for facebook', supported: true }
  async search(criteria: SearchCriteria): Promise<RawLead[]> {
    // Placeholder: actual extraction happens via extension DOM or official APIs
    // This server adapter validates & enriches only; browser extension handles DOM scraping where permitted
    return []
  }
  async extract(input: unknown): Promise<RawLead[]> {
    if (Array.isArray(input)) return input as RawLead[]
    return []
  }
}
