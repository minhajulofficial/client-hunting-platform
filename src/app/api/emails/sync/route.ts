import { NextResponse } from 'next/server'
export async function POST(){ return NextResponse.json({ success:true, data:{ synced:0, message:'Gmail sync via polling/webhook - configure GOOGLE_CLIENT_ID/SECRET' }, error:null }) }
export async function GET(){ return NextResponse.json({ success:true, data:{ status:'idle' }, error:null }) }
