import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getAuthenticatedUser,
  isSuperAdminRequest,
  ensureDefaultUser
} from '@/lib/auth'
import * as mongoModule from '@/lib/mongodb'

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

  describe('isSuperAdminRequest()', () => {
    it('should_return_true_when_valid_super_admin_jwt_is_provided', () => {
      const token = generateToken({ sub: 'admin_rahul', role: 'SuperAdmin' })
      const req = new Request('http://localhost:3000/api/organizations', {
        headers: {
          cookie: `super_admin_token=${token}`
        }
      })
      expect(isSuperAdminRequest(req)).toBe(true)
    })

    it('should_return_false_when_plain_cookie_is_spoofed_without_valid_jwt', () => {
      const req = new Request('http://localhost:3000/api/organizations', {
        headers: {
          cookie: 'super_admin_user=AkshayGohel21'
        }
      })
      expect(isSuperAdminRequest(req)).toBe(false)
    })

    it('should_return_false_when_jwt_has_operator_role', () => {
      const token = generateToken({ sub: 'operator_1', role: 'Operator' })
      const req = new Request('http://localhost:3000/api/organizations', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      expect(isSuperAdminRequest(req)).toBe(false)
    })
  })

  describe('ensureDefaultUser()', () => {
    let mockUsersCol: any
    let docStore: any[]

    beforeEach(() => {
      docStore = []
      mockUsersCol = {
        countDocuments: vi.fn(async (query?: any) => {
          if (!query || Object.keys(query).length === 0) return docStore.length
          return docStore.filter(d => Object.keys(query).every(k => d[k] === query[k])).length
        }),
        findOne: vi.fn(async (query: any) => docStore.find(d => Object.keys(query).every(k => d[k] === query[k])) || null),
        insertOne: vi.fn(async (doc: any) => {
          docStore.push({ ...doc })
          return { acknowledged: true }
        }),
        updateOne: vi.fn(async (query: any, update: any) => {
          const doc = docStore.find(d => Object.keys(query).every(k => d[k] === query[k]))
          if (doc && update?.$set) Object.assign(doc, update.$set)
          return { acknowledged: true }
        })
      }

      vi.spyOn(mongoModule, 'getMongoDb').mockResolvedValue({
        collection: vi.fn(() => mockUsersCol)
      } as any)
    })

    it('should_seed_default_users_when_collection_is_completely_empty', async () => {
      await ensureDefaultUser()
      expect(docStore.length).toBe(2)
      expect(docStore.some(u => u.username === 'rdjeans123')).toBe(true)
      expect(docStore.some(u => u.username === 'AkshayGohel21' && u.role === 'SuperAdmin')).toBe(true)
    })

    it('should_never_overwrite_passwords_when_users_already_exist', async () => {
      // Pre-seed an existing user with customized password
      docStore.push({
        id: 1,
        username: 'AkshayGohel21',
        password_hash: '$2b$10$customized_super_admin_hash_that_must_never_be_wiped',
        role: 'SuperAdmin',
        status: 'Active'
      })

      await ensureDefaultUser()

      // The existing password hash must remain 100% untouched
      expect(docStore[0].password_hash).toBe('$2b$10$customized_super_admin_hash_that_must_never_be_wiped')
      expect(mockUsersCol.updateOne).not.toHaveBeenCalled()
    })
  })
})
