import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getAuthenticatedUser,
  ensureDefaultUser
} from '@/lib/auth'
import * as db from '@/lib/db'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('lib/auth.ts - Authentication & Cryptography Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Password Hashing & Verification', () => {
    it('should_hash_password_with_bcrypt_salt_when_plain_string_provided', async () => {
      // Arrange
      const plain = 'RD@123'

      // Act
      const hashed = await hashPassword(plain)

      // Assert
      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(plain)
      expect(hashed.startsWith('$2a$') || hashed.startsWith('$2b$')).toBe(true)
    })

    it('should_return_true_when_verifying_matching_password', async () => {
      // Arrange
      const plain = 'RD@123'
      const hashed = await hashPassword(plain)

      // Act
      const isMatch = await verifyPassword(plain, hashed)

      // Assert
      expect(isMatch).toBe(true)
    })

    it('should_return_false_when_verifying_incorrect_password', async () => {
      // Arrange
      const plain = 'RD@123'
      const hashed = await hashPassword(plain)

      // Act
      const isMatch = await verifyPassword('WrongPassword', hashed)

      // Assert
      expect(isMatch).toBe(false)
    })

    it('should_return_false_when_stored_hash_is_empty_null_or_invalid', async () => {
      // Act & Assert
      expect(await verifyPassword('RD@123', '')).toBe(false)
      expect(await verifyPassword('RD@123', null as any)).toBe(false)
      expect(await verifyPassword('RD@123', 'not_a_valid_bcrypt_hash')).toBe(false)
    })
  })

  describe('JWT Token Generation & Verification', () => {
    it('should_generate_valid_jwt_token_when_claims_payload_provided', () => {
      // Arrange
      const payload = { sub: 'rdjeans123', id: 1, role: 'admin' }

      // Act
      const token = generateToken(payload)
      const decoded = verifyToken(token)

      // Assert
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
      expect(decoded).not.toBeNull()
      expect(decoded?.sub).toBe('rdjeans123')
      expect(decoded?.id).toBe(1)
      expect(decoded?.role).toBe('admin')
    })

    it('should_return_null_when_verifying_tampered_or_invalid_token', () => {
      // Arrange
      const validToken = generateToken({ sub: 'admin' })
      const tampered = validToken.slice(0, -5) + 'xxxxx'

      // Act & Assert
      expect(verifyToken('invalid.token.structure')).toBeNull()
      expect(verifyToken('')).toBeNull()
      expect(verifyToken(tampered)).toBeNull()
    })
  })

  describe('getAuthenticatedUser()', () => {
    it('should_extract_user_when_custom_headers_injected_by_middleware', async () => {
      // Arrange
      const req = new Request('http://localhost:3000/api/employees', {
        headers: {
          'x-user-name': 'rdjeans123',
          'x-user-id': '42'
        }
      })

      // Act
      const user = await getAuthenticatedUser(req)

      // Assert
      expect(user).toEqual({
        id: 42,
        username: 'rdjeans123'
      })
    })

    it('should_extract_and_verify_user_when_bearer_token_header_is_present', async () => {
      // Arrange
      const token = generateToken({ sub: 'operator', id: 5 })
      const req = new Request('http://localhost:3000/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      // Act
      const user = await getAuthenticatedUser(req)

      // Assert
      expect(user).toEqual({
        id: 5,
        username: 'operator'
      })
    })

    it('should_extract_token_when_cookie_header_contains_rd_token', async () => {
      // Arrange
      const token = generateToken({ sub: 'cookieUser', id: 9 })
      const req = new Request('http://localhost:3000/api/employees', {
        headers: {
          cookie: `theme=dark; rd_token=${token}; session=active`
        }
      })

      // Act
      const user = await getAuthenticatedUser(req)

      // Assert
      expect(user).toEqual({
        id: 9,
        username: 'cookieUser'
      })
    })

    it('should_return_null_when_no_valid_authorization_header_or_cookie_exists', async () => {
      // Arrange
      const req = new Request('http://localhost:3000/api/employees')

      // Act
      const user = await getAuthenticatedUser(req)

      // Assert
      expect(user).toBeNull()
    })
  })

  describe('ensureDefaultUser()', () => {
    it('should_seed_default_admin_when_users_table_is_empty', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act
      await ensureDefaultUser()

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM users')
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['rdjeans123'])
      )
    })

    it('should_upgrade_plaintext_password_when_existing_record_has_cleartext', async () => {
      // Arrange
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, password_hash: 'RD@123' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any)

      // Act
      await ensureDefaultUser()

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash = $1 WHERE id = $2'),
        expect.any(Array)
      )
    })
  })
})
