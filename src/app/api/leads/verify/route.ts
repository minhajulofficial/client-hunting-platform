import { NextResponse } from 'next/server'
import { getEmailVerifier } from '@/lib/verification/email'
import { verifyPhone } from '@/lib/verification/phone'
export async function POST(req:Request){
  const { email, phone } = await req.json()
  const result:any={}
  if (email) result.email = await getEmailVerifier().verify(email)
  if (phone) result.phone = verifyPhone(phone)
  return NextResponse.json({ success:true, data: result, error:null })
}
