import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
export async function middleware(request: NextRequest){
  // Allow CORS for extension
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }
    const res = await updateSession(request)
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res
  }
  return await updateSession(request)
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }
