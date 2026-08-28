import { z } from 'zod'

export const leadInputSchema = z.object({
  business_name: z.string().min(2, 'business_name must be at least 2 chars'),
  business_type: z.string().optional().nullable(),
  niche: z.string().optional().nullable(),
  sub_niche: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  contact_first_name: z.string().optional().nullable(),
  contact_last_name: z.string().optional().nullable(),
  contact_position: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const importPayloadSchema = z.object({
  leads: z.array(leadInputSchema).min(1, 'At least one lead required').max(500, 'Max 500 leads per import'),
  projectId: z.string().uuid('projectId must be a valid uuid').optional().nullable(),
})

export const projectInputSchema = z.object({
  name: z.string().min(2, 'Project name required'),
  description: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  states: z.array(z.string()).optional().nullable(),
  cities: z.array(z.string()).optional().nullable(),
  niche: z.string().optional().nullable(),
  sub_niche: z.string().optional().nullable(),
  services: z.array(z.string()).optional().nullable(),
  target_positions: z.array(z.string()).optional().nullable(),
  target_lead_count: z.number().int().positive().optional().nullable(),
  status: z.enum(['active','paused','completed','archived']).optional(),
})

export const leadStatusSchema = z.enum(['NEW','REVIEW','VERIFIED','CONTACTED','REPLIED','INTERESTED','NOT_INTERESTED','FOLLOW_UP','MEETING','PROPOSAL','WON','LOST','INVALID','UNSUBSCRIBED'])

export const leadUpdateSchema = z.object({
  status: leadStatusSchema.optional(),
  notes: z.string().optional().nullable(),
  next_followup: z.string().optional().nullable(),
  lead_score: z.number().int().min(0).max(100).optional(),
  project_id: z.string().uuid().optional().nullable(),
})

export const emailSendSchema = z.object({
  to: z.string().email('Valid recipient email required'),
  subject: z.string().min(1, 'Subject required'),
  body: z.string().min(1, 'Body required'),
  cc: z.string().optional().nullable(),
  bcc: z.string().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
})

export const campaignInputSchema = z.object({
  name: z.string().min(2, 'Campaign name required'),
  project_id: z.string().uuid().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  status: z.string().optional(),
})

export function formatZodError(err: z.ZodError){
  return err.issues.map(i=> `${i.path.join('.')||'payload'}: ${i.message}`).join('; ')
}
