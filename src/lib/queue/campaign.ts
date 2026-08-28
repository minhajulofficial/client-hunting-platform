export type MessageStatus='QUEUED'|'SENDING'|'SENT'|'FAILED'|'BOUNCED'|'REPLIED'|'UNSUBSCRIBED'
export interface QueuedMessage { id:string; campaignId:string; leadId:string; to:string; subject:string; body:string; status:MessageStatus; attempts:number }

export async function enqueueCampaign(supabase:any, campaignId:string, recipients:{leadId:string; to:string; subject:string; body:string}[]){
  const rows = recipients.map(r=>({ campaign_id:campaignId, lead_id:r.leadId, recipient_email:r.to, subject:r.subject, body:r.body, status:'QUEUED' }))
  const { error } = await supabase.from('campaign_recipients').insert(rows)
  if (error) throw error
  return rows.length
}
// Worker would poll campaign_recipients where status=QUEUED and send via Gmail with rate limiting
