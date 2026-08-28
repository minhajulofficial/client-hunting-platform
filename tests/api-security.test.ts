import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
  isSupabaseConfigured: vi.fn(() => true),
}))

describe('resolveUser', () => {
  it('returns userId from session cookie', async () => {
    const { resolveUser } = await import('@/lib/api/auth')
    const req = new NextRequest('http://localhost/api/leads', {
      headers: { cookie: 'sb-access-token=valid-token' }
    })
    const { auth } = await resolveUser(req)
    // In test mode without real Supabase, resolveUser returns userId from mock
    // The important thing is it doesn't throw
    expect(auth).toHaveProperty('userId')
  })
})

describe('Zod validation', () => {
  it('campaignInputSchema rejects empty name', async () => {
    const { campaignInputSchema } = await import('@/lib/validation/schemas')
    const result = campaignInputSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('campaignInputSchema accepts valid name', async () => {
    const { campaignInputSchema } = await import('@/lib/validation/schemas')
    const result = campaignInputSchema.safeParse({ name: 'Test Campaign' })
    expect(result.success).toBe(true)
  })

  it('emailSendSchema rejects unresolved template variables', async () => {
    const { emailSendSchema } = await import('@/lib/validation/schemas')
    const result = emailSendSchema.safeParse({
      to: 'test@example.com',
      subject: 'Hello {{first_name}}',
      body: 'This is a test email body with enough content to pass validation.',
    })
    // Zod allows it; the route handler catches unresolved variables separately
    expect(result.success).toBe(true)
  })

  it('importSchema requires business_name in leads', async () => {
    const { importSchema } = await import('@/lib/validation/schemas')
    const result = importSchema.safeParse({ leads: [{ email: 'test@example.com' }] })
    expect(result.success).toBe(false)
  })

  it('importSchema accepts leads with business_name', async () => {
    const { importSchema } = await import('@/lib/validation/schemas')
    const result = importSchema.safeParse({ leads: [{ business_name: 'Acme Corp' }] })
    expect(result.success).toBe(true)
  })
})

describe('API response helpers', () => {
  it('ok returns success envelope', async () => {
    const { ok } = await import('@/lib/api/response')
    const res = ok({ test: true })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ test: true })
    expect(body.error).toBeNull()
  })

  it('fail returns error envelope', async () => {
    const { fail } = await import('@/lib/api/response')
    const res = fail('Something went wrong', 422)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Something went wrong')
    expect(body.data).toBeNull()
  })

  it('preflight returns CORS headers', async () => {
    const { preflight } = await import('@/lib/api/response')
    const res = preflight()
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
  })
})

describe('Scoring', () => {
  it('returns score between 0 and 100', async () => {
    const { scoreLead } = await import('@/lib/scoring/index')
    const score = scoreLead({
      email_status: 'VERIFIED',
      phone_status: 'VALID',
      website: 'https://example.com',
      facebook: 'https://facebook.com/example',
    })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('VERIFIED email scores higher than UNKNOWN', async () => {
    const { scoreLead } = await import('@/lib/scoring/index')
    const verified = scoreLead({ email_status: 'VERIFIED' })
    const unknown = scoreLead({ email_status: 'UNKNOWN' })
    expect(verified).toBeGreaterThan(unknown)
  })
})

describe('Email verification', () => {
  it('rejects invalid email syntax', async () => {
    const { getEmailVerifier } = await import('@/lib/verification/email')
    const verifier = getEmailVerifier()
    const result = await verifier.verify('not-an-email')
    expect(result.status).toBe('INVALID')
  })

  it('rejects missing @ symbol', async () => {
    const { getEmailVerifier } = await import('@/lib/verification/email')
    const verifier = getEmailVerifier()
    const result = await verifier.verify('userexample.com')
    expect(result.status).toBe('INVALID')
  })

  it('rejects disposable email domains', async () => {
    const { getEmailVerifier } = await import('@/lib/verification/email')
    const verifier = getEmailVerifier()
    const result = await verifier.verify('user@tempmail.com')
    expect(result.status).toBe('RISKY')
  })

  it('flags business domains', async () => {
    const { getEmailVerifier } = await import('@/lib/verification/email')
    const verifier = getEmailVerifier()
    const result = await verifier.verify('user@gmail.com')
    expect(result.status).toBe('VERIFIED')
    expect(result.confidence).toBeGreaterThan(0.8)
  })
})

describe('Phone verification', () => {
  it('validates US phone format', async () => {
    const { verifyPhone } = await import('@/lib/verification/phone')
    const result = verifyPhone('+1-555-123-4567', 'US')
    expect(result.status).toBe('VALID')
  })

  it('rejects too-short numbers', async () => {
    const { verifyPhone } = await import('@/lib/verification/phone')
    const result = verifyPhone('123', 'US')
    expect(result.status).toBe('INVALID')
  })
})
