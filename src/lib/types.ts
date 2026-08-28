export type LeadStatus = 'NEW'|'REVIEW'|'VERIFIED'|'CONTACTED'|'REPLIED'|'INTERESTED'|'NOT_INTERESTED'|'FOLLOW_UP'|'MEETING'|'PROPOSAL'|'WON'|'LOST'|'INVALID'|'UNSUBSCRIBED'
export type EmailStatus = 'VERIFIED'|'RISKY'|'INVALID'|'UNKNOWN'
export type PhoneStatus = 'VALID'|'INVALID'|'UNKNOWN'
export type SocialStatus = 'FOUND'|'NOT_FOUND'|'UNCERTAIN'
export type ProjectStatus = 'active'|'paused'|'completed'|'archived'
export interface Lead {
  id: string; project_id: string|null; business_name: string; business_type?: string; industry?: string; niche?: string; sub_niche?: string;
  country?: string; state?: string; city?: string; address?: string; postal_code?: string; website?: string; source?: string; source_url?: string;
  contact_first_name?: string; contact_last_name?: string; contact_position?: string;
  email?: string; email_status?: EmailStatus; phone?: string; phone_status?: PhoneStatus; whatsapp?: string;
  facebook?: string; instagram?: string; linkedin?: string; other_socials?: Record<string,string>;
  status: LeadStatus; lead_score?: number; notes?: string; tags?: string[];
  created_at: string; updated_at: string; last_contacted?: string; next_followup?: string;
}
