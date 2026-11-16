import { describe, it, expect } from 'vitest'
import { isSuperAdminRequest, generateToken } from '@/lib/auth'

describe('Multi-Tenant Confidentiality & Access Control', () => {
  it('should deny Super Admin authority to regular staff requests', () => {
    const regularRequest = new Request('http://localhost:3000/api/organizations', {
      headers: {
        cookie: 'rd_user=rdjeans123; rd_token=mock_regular_token',
      },
    })
    expect(isSuperAdminRequest(regularRequest)).toBe(false)
  })

  it('should authorize Super Admin request when valid cookie/token is present', () => {
    const token = generateToken({ sub: 'AkshayGohel21', role: 'SuperAdmin' })
    const superAdminRequest = new Request('http://localhost:3000/api/organizations', {
      headers: {
        cookie: `super_admin_token=${token}`,
      },
    })
    expect(isSuperAdminRequest(superAdminRequest)).toBe(true)
  })

  it('should block regular user from masquerading with header tampering', () => {
    const maliciousRequest = new Request('http://localhost:3000/api/organizations', {
      headers: {
        cookie: 'rd_user=attacker; rd_active_org=rd-jeans-main',
        'x-user-name': 'attacker',
        'x-user-role': 'Operator',
      },
    })
    expect(isSuperAdminRequest(maliciousRequest)).toBe(false)
  })
})
