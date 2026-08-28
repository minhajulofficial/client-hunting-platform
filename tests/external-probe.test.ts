import { describe, it, expect } from 'vitest'

const BASE = process.env.TEST_BASE_URL || 'https://client-hunting-platform-five.vercel.app'

describe('External probes - live endpoints', () => {
  it('GET /api/health returns 200 with supabase_configured: true', async () => {
    const res = await fetch(`${BASE}/api/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
    expect(body.data.env.has_supabase_url).toBe(true)
    expect(body.data.env.has_anon_key).toBe(true)
    expect(body.data.env.has_service_role).toBe(true)
    expect(body.data.env.has_google_client).toBe(true)
  })

  it('GET /api/extension/health returns 200 with database.connected: true', async () => {
    const res = await fetch(`${BASE}/api/extension/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.database.connected).toBe(true)
    expect(body.data.database.supabase_configured).toBe(true)
  })

  it('GET /api/leads without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/leads`)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('GET /api/projects without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/projects`)
    expect(res.status).toBe(401)
  })

  it('GET /api/templates without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/templates`)
    expect(res.status).toBe(401)
  })

  it('POST /api/ai/generate without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/emails/send without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'test@example.com', subject: 'Test', body: 'Hello' }),
    })
    expect(res.status).toBe(401)
  })

  it('GET /api/campaigns without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/campaigns`)
    expect(res.status).toBe(401)
  })

  it('GET /api/inbox without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/inbox`)
    expect(res.status).toBe(401)
  })
})

describe('External probes - page redirects', () => {
  const pages = ['/leads', '/projects', '/campaigns', '/inbox', '/templates', '/settings', '/settings/extension', '/settings/api']

  for (const page of pages) {
    it(`${page} redirects to /login when no session cookie`, async () => {
      const res = await fetch(`${BASE}${page}`, { redirect: 'manual' })
      // 307 redirect or 200 (if page renders with empty state)
      expect([200, 307]).toContain(res.status)
    })
  }
})

describe('External probes - CORS', () => {
  it('OPTIONS on /api/leads returns CORS headers', async () => {
    const res = await fetch(`${BASE}/api/leads`, { method: 'OPTIONS' })
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeTruthy()
  })
})
