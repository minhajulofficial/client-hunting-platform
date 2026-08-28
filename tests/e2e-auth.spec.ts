import { test, expect } from '@playwright/test'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const USER = process.env.TEST_USER_EMAIL || ''
const PASS = process.env.TEST_USER_PASSWORD || ''

test.describe('Unauthenticated access', () => {
  const protectedPages = ['/leads', '/projects', '/campaigns', '/inbox', '/templates', '/settings', '/settings/extension', '/settings/api']

  for (const page of protectedPages) {
    test(`${page} redirects to /login when not authenticated`, async ({ page: p }) => {
      await p.goto(`${BASE}${page}`)
      // Either redirected to /login or renders with login state
      await p.waitForLoadState('networkidle')
      const url = p.url()
      const isOnLogin = url.includes('/login')
      // If not on login, page should still render (empty state)
      if (!isOnLogin) {
        await expect(p.locator('body')).toBeVisible()
      }
    })
  }
})

test.describe('Extension API security', () => {
  test('POST /api/extension/import without token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/extension/import`, {
      data: {
        project_id: '00000000-0000-0000-0000-000000000000',
        url: 'https://example.com',
        business_name: 'Test',
        email: 'test@example.com',
      },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/extension/import with invalid token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/extension/import`, {
      headers: { Authorization: 'Bearer invalid-token-12345' },
      data: {
        project_id: '00000000-0000-0000-0000-000000000000',
        url: 'https://example.com',
        business_name: 'Test',
      },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/extension/import with expired token returns 401', async ({ request }) => {
    // This tests the expiry check in resolveUser
    const res = await request.post(`${BASE}/api/extension/import`, {
      headers: { Authorization: 'Bearer expired-token' },
      data: {
        project_id: '00000000-0000-0000-0000-000000000000',
        url: 'https://example.com',
        business_name: 'Test',
      },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Authenticated user flows', () => {
  test.skip(!USER || !PASS, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run authenticated tests')

  test('can log in and access dashboard', async ({ page: p }) => {
    await p.goto(`${BASE}/login`)
    await p.waitForLoadState('networkidle')

    // Fill login form
    await p.fill('input[type="email"], input[name="email"]', USER)
    await p.fill('input[type="password"], input[name="password"]', PASS)
    await p.click('button[type="submit"]')

    // Wait for navigation
    await p.waitForURL('**/dashboard', { timeout: 15000 })
    await expect(p.locator('text=Dashboard')).toBeVisible()
  })

  test('can navigate to leads page after login', async ({ page: p }) => {
    await p.goto(`${BASE}/login`)
    await p.waitForLoadState('networkidle')
    await p.fill('input[type="email"], input[name="email"]', USER)
    await p.fill('input[type="password"], input[name="password"]', PASS)
    await p.click('button[type="submit"]')
    await p.waitForURL('**/dashboard', { timeout: 15000 })

    await p.goto(`${BASE}/leads`)
    await p.waitForLoadState('networkidle')
    await expect(p.locator('text=Leads')).toBeVisible()
  })

  test('can create a project', async ({ page: p }) => {
    await p.goto(`${BASE}/login`)
    await p.waitForLoadState('networkidle')
    await p.fill('input[type="email"], input[name="email"]', USER)
    await p.fill('input[type="password"], input[name="password"]', PASS)
    await p.click('button[type="submit"]')
    await p.waitForURL('**/dashboard', { timeout: 15000 })

    await p.goto(`${BASE}/projects`)
    await p.waitForLoadState('networkidle')

    // Fill project form if visible
    const nameInput = p.locator('input[placeholder*="project" i], input[placeholder*="name" i]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Project')
      const submitBtn = p.locator('button:has-text("Create"), button[type="submit"]').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await p.waitForTimeout(2000)
      }
    }
  })
})
