import { NextResponse } from 'next/server'
import { AIService } from '@/lib/ai/service'
export async function POST(req:Request){
  const { template, lead } = await req.json()
  const svc = new AIService()
  const text = await svc.personalizeMessage(template||'', lead||{})
  return NextResponse.json({ success:true, data:{ text }, error:null })
}
