import { NextResponse } from 'next/server'
import { AIService } from '@/lib/ai/service'
export async function POST(req:Request){
  const { prompt, variables } = await req.json()
  const svc = new AIService()
  const text = await svc.generateMessage(prompt || 'Generate outreach', variables || {})
  return NextResponse.json({ success:true, data:{ text }, error:null })
}
