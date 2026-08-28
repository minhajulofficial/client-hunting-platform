import type { SourceAdapter } from './types'
import { WebsiteAdapter } from './website/adapter'
import { GoogleSearchAdapter } from './google-search/adapter'
import { GoogleMapsAdapter } from './google-maps/adapter'
import { FacebookAdapter } from './facebook/adapter'
import { InstagramAdapter } from './instagram/adapter'
import { BusinessDirectoriesAdapter as BusinessDirectoryAdapter } from './business-directories/adapter'

const adapters: Record<string, SourceAdapter> = {
  'website': new WebsiteAdapter(),
  'google-search': new GoogleSearchAdapter(),
  'google-maps': new GoogleMapsAdapter(),
  'facebook': new FacebookAdapter(),
  'instagram': new InstagramAdapter(),
  'business-directories': new BusinessDirectoryAdapter(),
}
export function getAdapter(id:string){ return adapters[id] }
export function getAllAdapters(){ return Object.values(adapters) }
export function getSupportedSources(){ return Object.values(adapters).map(a=>a.getSourceMetadata()) }
