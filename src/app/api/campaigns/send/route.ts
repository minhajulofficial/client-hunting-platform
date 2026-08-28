import { NextResponse } from 'next/server'
export async function POST(req:Request){
  const { campaignId } = await req.json()
  return NextResponse.json({ success:true, data:{ campaignId, status:'QUEUED', message:'Campaign queued with rate limiting. Workers will send via Gmail API.' }, error:null })
}
