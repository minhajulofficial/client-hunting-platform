import { BaseSourceAdapter } from '../base'
import type { SearchCriteria, RawLead, SourceMetadata } from '../types'
export class WebsiteAdapter extends BaseSourceAdapter {
  id = 'website'
  metadata: SourceMetadata = { id: 'website', name: 'Website', description: 'Adapter for website', supported: true }
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
