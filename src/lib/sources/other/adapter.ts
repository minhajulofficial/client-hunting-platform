import { BaseSourceAdapter } from '../base'
import type { SearchCriteria, RawLead, SourceMetadata } from '../types'
export class OtherAdapter extends BaseSourceAdapter {
  id = 'other'
  metadata: SourceMetadata = { id: 'other', name: 'Other', description: 'Adapter for other', supported: true }
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
