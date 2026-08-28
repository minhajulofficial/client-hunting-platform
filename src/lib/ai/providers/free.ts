import type { AIProvider } from '../types'
export class FreeAIProvider implements AIProvider {
  id='free'
  async generateMessage(prompt:string, vars:Record<string,string>){ return `[Free tier] Generated message for ${vars.business_name || 'lead'} - prompt: ${prompt.slice(0,120)}... (configure AI_API_KEY for real generation)` }
  async personalizeMessage(template:string, lead:Record<string,string>){ 
    let out = template
    for(const [k,v] of Object.entries(lead)) out = out.replaceAll(`{{${k}}}`, v).replaceAll(`{{${k.toLowerCase()}}}`, v)
    return out
  }
  async analyzeLead(lead:Record<string,string>){ return `Lead ${lead.business_name||''} in ${lead.city||''} - ${lead.website?'has website':'no website detected'}. Opportunity: check website publicly for service fit.` }
  async generateFollowup(thread:string){ return `Hi, just following up on my previous message. Would love to connect. (Free tier placeholder)` }
  async suggestReply(inbound:string){ return `Thanks for your reply! I'd be happy to discuss further. (Free tier placeholder)` }
}
