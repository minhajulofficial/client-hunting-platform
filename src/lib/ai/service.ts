import type { AIProvider } from './types'
import { FreeAIProvider } from './providers/free'
import { OpenAIProvider } from './providers/openai'
export class AIService {
  private provider: AIProvider
  constructor(provider?: AIProvider){
    if (provider) this.provider = provider
    else if (process.env.AI_API_KEY) this.provider = new OpenAIProvider(process.env.AI_API_KEY, process.env.AI_MODEL || 'gpt-4o-mini')
    else this.provider = new FreeAIProvider()
  }
  getProvider(){ return this.provider }
  generateMessage(p:string, v:Record<string,string>){ return this.provider.generateMessage(p,v) }
  personalizeMessage(t:string, l:Record<string,string>){ return this.provider.personalizeMessage(t,l) }
  analyzeLead(l:Record<string,string>){ return this.provider.analyzeLead(l) }
  generateFollowup(thread:string, instr:string){ return this.provider.generateFollowup(thread,instr) }
  suggestReply(inbound:string, ctx:string){ return this.provider.suggestReply(inbound,ctx) }
}
export const aiService = new AIService()
