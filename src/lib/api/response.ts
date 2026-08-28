import { NextResponse } from 'next/server'

export function ok<T>(data: T, init?: ResponseInit){
  return withCors(NextResponse.json({ success:true, data, error:null }, init))
}
export function fail(error: string, status=400, extra?: Record<string, unknown>){
  return withCors(NextResponse.json({ success:false, data:null, error, ...(extra||{}) }, { status }))
}
export function withCors(res: NextResponse){
  res.headers.set('Access-Control-Allow-Origin','*')
  res.headers.set('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers','Content-Type, Authorization')
  return res
}
export function preflight(){ return withCors(new NextResponse(null,{ status:204 })) }
