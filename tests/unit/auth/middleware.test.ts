import { describe, it, expect, vi, beforeEach } from 'vitest'
import { proxy as middleware } from '@/proxy'
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'

const JWT_SECRET = 'test_secret_key_for_vitest_unit_testing_minimum_32_characters'
const encodedSecret = new TextEncoder().encode(JWT_SECRET)

async function createTestToken(payload: Record<string, any>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30m')
    .sign(encodedSecret)
}

describe('middleware.ts - Edge Authentication Guard Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Static Assets & Public Path Bypass', () => {
    it('should_bypass_internal_paths_when_next_static_or_images_requested', async () => {
      // Arrange
      const req1 = new NextRequest('http://localhost:3000/_next/static/chunk.js')
      const req2 = new NextRequest('http://localhost:3000/logo.png')

      // Act
      const res1 = await middleware(req1)
      const res2 = await middleware(req2)

      // Assert
      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
    })

    it('should_bypass_public_endpoints_when_login_or_health_are_requested', async () => {
      // Arrange
      const reqLogin = new NextRequest('http://localhost:3000/api/auth/login', { method: 'POST' })
      const reqHealth = new NextRequest('http://localhost:3000/api/health')

      // Act
      const resLogin = await middleware(reqLogin)
      const resHealth = await middleware(reqHealth)

      // Assert
      expect(resLogin.status).toBe(200)
      expect(resHealth.status).toBe(200)
    })
  })

  describe('Protected API Routes (/api/*)', () => {
    it('should_return_401_unauthorized_when_api_token_is_missing', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/employees')

      // Act
      const res = await middleware(req)

      // Assert
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.detail).toContain('Unauthorized: Access token is missing')
    })

    it('should_allow_api_request_when_valid_bearer_token_is_provided', async () => {
      // Arrange
      const token = await createTestToken({ sub: 'rdjeans123', id: 1 })
      const req = new NextRequest('http://localhost:3000/api/employees', {
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      // Act
      const res = await middleware(req)

      // Assert
      expect(res.status).toBe(200)
      expect(res.headers).toBeDefined()
    })

    it('should_return_401_unauthorized_when_bearer_token_is_tampered_or_invalid', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/employees', {
        headers: {
          authorization: 'Bearer invalid.tampered.token'
        }
      })

      // Act
      const res = await middleware(req)

      // Assert
      expect(res.status).toBe(401)
    })
  })

  describe('Web Page Navigation Guard', () => {
    it('should_redirect_to_login_when_unauthenticated_browser_visits_protected_route', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/cashbook')

      // Act
      const res = await middleware(req)

      // Assert
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })

    it('should_redirect_to_dashboard_when_authenticated_user_visits_login_page', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/login', {
        headers: {
          cookie: 'rd_user=rdjeans123'
        }
      })

      // Act
      const res = await middleware(req)

      // Assert
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('should_allow_page_access_when_authenticated_session_cookie_is_present', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/employees', {
        headers: {
          cookie: 'rd_user=rdjeans123'
        }
      })

      // Act
      const res = await middleware(req)

      // Assert
      expect(res.status).toBe(200)
    })
  })
})
