import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options)); supabaseResponse = NextResponse.next({ request }); cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options)) },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
  const isAdmin = user?.email ? adminEmails.length===0 || adminEmails.includes(user.email.toLowerCase()) : false
  const protectedPaths = ['/dashboard','/projects','/leads','/campaigns','/inbox','/templates','/ai','/integrations','/settings','/admin']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))
  if (isProtected && !user) return NextResponse.redirect(new URL('/login', request.url))
  if (request.nextUrl.pathname.startsWith('/admin') && user && !isAdmin) return NextResponse.redirect(new URL('/dashboard', request.url))
  return supabaseResponse
}
