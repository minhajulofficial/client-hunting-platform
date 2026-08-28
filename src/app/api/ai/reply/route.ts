import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { AIService } from '@/lib/ai/service'
import { z } from 'zod'

const schema = z.object({
  inbound: z.string().min(1, 'inbound message required'),
  context: z.string().optional().default(''),
  leadId: z.string().uuid().optional().nullable(),
})

export async function OPTIONS(){ return preflight() }

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = schema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - inbound message required', 422)

  const svc = new AIService()
  const provider = svc.getProvider().id
  try{
    const text = await svc.suggestReply(parsed.data.inbound, parsed.data.context || '')
    await supabase.from('ai_generations').insert({ user_id: auth.userId, lead_id: parsed.data.leadId ?? null, input:{ type:'reply', inbound: parsed.data.inbound }, output: text })
    return ok({ text, provider, requires_approval: true, note:'AI never sends automatically - user must approve' })
  }catch(e){
    const message = e instanceof Error ? e.message : 'Unknown error'
    return fail('AI request failed - '+message, 502)
  }
}
