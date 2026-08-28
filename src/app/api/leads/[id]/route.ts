import { ok, fail, preflight } from '@/lib/api/response'
import { resolveUser } from '@/lib/api/auth'
import { leadUpdateSchema, formatZodError } from '@/lib/validation/schemas'
import type { z } from 'zod'

export async function OPTIONS(){ return preflight() }

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }){
  const { id } = await ctx.params
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).eq('user_id', auth.userId).maybeSingle()
  if(error) return fail('Failed to load lead - '+error.message, 500)
  if(!data) return fail('Lead not found', 404)
  return ok(data)
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }){
  const { id } = await ctx.params
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)

  let json: unknown
  try{ json = await req.json() }catch{ return fail('Invalid JSON body', 400) }
  const parsed = leadUpdateSchema.safeParse(json)
  if(!parsed.success) return fail('Validation failed - '+formatZodError(parsed.error as z.ZodError), 422)

  const { data: before } = await supabase.from('leads').select('status').eq('id', id).eq('user_id', auth.userId).maybeSingle()
  if(!before) return fail('Lead not found', 404)

  const patch: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('leads').update(patch).eq('id', id).eq('user_id', auth.userId).select('*').maybeSingle()
  if(error) return fail('Update failed - '+error.message, 500)

  if(parsed.data.status && parsed.data.status !== before.status){
    await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'status_changed', entity_type:'lead', entity_id: id, details:{ from: before.status, to: parsed.data.status, changed_by:'user' } })
  }
  return ok(data)
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }){
  const { id } = await ctx.params
  const { auth, supabase } = await resolveUser(req)
  if(!supabase) return fail(auth.error || 'Supabase not configured', 503)
  if(!auth.userId) return fail(auth.error || 'Unauthorized', 401)
  const { error } = await supabase.from('leads').delete().eq('id', id).eq('user_id', auth.userId)
  if(error) return fail('Delete failed - '+error.message, 500)
  await supabase.from('activity_logs').insert({ user_id: auth.userId, action:'lead_deleted', entity_type:'lead', entity_id: id, details:{} })
  return ok({ deleted: true, id })
}
