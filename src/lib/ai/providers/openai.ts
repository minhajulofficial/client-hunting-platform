import type { AIProvider } from '../types'
export class OpenAIProvider implements AIProvider {
  id='openai'
  constructor(private apiKey:string, private model='gpt-4o-mini'){}
  private async call(prompt:string){
    if (!this.apiKey) throw new Error('AI API key not configured')
    const res = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{ 'Authorization':'Bearer '+this.apiKey, 'Content-Type':'application/json'},
      body: JSON.stringify({ model:this.model, messages:[{role:'user', content:prompt}], temperature:0.7 })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'AI request failed')
    return data.choices?.[0]?.message?.content || ''
  }
  generateMessage(prompt:string, vars:Record<string,string>){ return this.call(prompt + '\nVariables: '+JSON.stringify(vars)) }
  personalizeMessage(template:string, lead:Record<string,string>){ return this.call(`Personalize this template: ${template} with lead ${JSON.stringify(lead)}. Do not invent facts.`)}
  analyzeLead(lead:Record<string,string>){ return this.call(`Analyze lead ${JSON.stringify(lead)} for website/marketing/SEO opportunities. Do not invent business facts. If unknown, say unknown.`)}
  generateFollowup(thread:string, instruction:string){ return this.call(`Generate follow-up for thread: ${thread}. Instruction: ${instruction}. Do not fabricate.`)}
  suggestReply(inbound:string, context:string){ return this.call(`Suggest reply to: ${inbound}. Context: ${context}. Be professional.`)}
}
