import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { AIService } from '@/lib/ai/service'
import { z } from 'zod'

const schema = z.object({ prompt: z.string().min(1,'prompt required'), variables: z.record(z.string(), z.string()).optional().default({}), leadId: z.string().uuid().optional().nullable() })

export async function OPTIONS(){ return preflight() }

export async function POST(req: Request){
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = schema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - check required fields', 422)

  const svc = new AIService()
  const provider = svc.getProvider().id
  try{
    const text = await svc.generateMessage(parsed.data.prompt, parsed.data.variables || {})
    await supabase.from('ai_generations').insert({ user_id: auth.userId, lead_id: parsed.data.leadId ?? null, input:{ type:'generate', prompt: parsed.data.prompt, variables: parsed.data.variables }, output: text })
    return ok({ text, provider, configured: provider !== 'free', note: provider === 'free' ? 'AI_API_KEY not set - using safe template substitution (no invented facts)' : undefined })
  }catch(e){
    const message = e instanceof Error ? e.message : 'Unknown error'
    return fail('AI request failed - '+message, 502)
  }
}
