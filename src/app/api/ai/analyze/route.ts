import { NextResponse } from 'next/server'
import { AIService } from '@/lib/ai/service'
export async function POST(req:Request){
  const { lead } = await req.json()
  const svc = new AIService()
  const text = await svc.analyzeLead(lead||{})
  return NextResponse.json({ success:true, data:{ text }, error:null })
}
