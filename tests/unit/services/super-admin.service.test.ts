import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SuperAdminService } from '../../../lib/services/super-admin'
import * as mongoModule from '../../../lib/mongodb'

describe('SuperAdminService Unit Tests', () => {
  let mockDb: any
  let mockCollections: Record<string, any>

  beforeEach(() => {
    vi.clearAllMocks()

    const createMockCollection = () => {
      const docStore: any[] = []
      return {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockImplementation(async () => [...docStore])
          }),
          toArray: vi.fn().mockImplementation(async () => [...docStore])
        }),
        findOne: vi.fn().mockImplementation(async (query: any) => {
          return docStore.find(d => Object.keys(query).every(k => {
            const q = query[k]
            if (q && q.$regex) {
              return q.$regex.test(d[k])
            }
            return d[k] === q
          })) || null
        }),
        insertOne: vi.fn().mockImplementation(async (doc: any) => {
          docStore.push({ ...doc })
          return { acknowledged: true }
        }),
        insertMany: vi.fn().mockImplementation(async (docs: any[]) => {
          docStore.push(...docs)
          return { acknowledged: true }
        }),
        updateOne: vi.fn().mockImplementation(async (query: any, update: any, opts: any) => {
          let doc = docStore.find(d => Object.keys(query).every(k => d[k] === query[k]))
          if (!doc && opts?.upsert) {
            doc = { ...query }
            docStore.push(doc)
          }
          if (doc && update?.$set) {
            Object.assign(doc, update.$set)
          }
          return { acknowledged: true }
        }),
        deleteMany: vi.fn().mockImplementation(async () => {
          docStore.length = 0
          return { acknowledged: true }
        }),
        deleteOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        countDocuments: vi.fn().mockImplementation(async () => docStore.length)
      }
    }

    mockCollections = {
      system_settings: createMockCollection(),
      users: createMockCollection()
    }

    mockDb = {
      collection: vi.fn((name: string) => {
        if (!mockCollections[name]) {
          mockCollections[name] = createMockCollection()
        }
        return mockCollections[name]
      })
    }

    vi.spyOn(mongoModule, 'getMongoDb').mockResolvedValue(mockDb as any)
    vi.spyOn(mongoModule, 'getMongoClient').mockResolvedValue({ db: () => mockDb } as any)
    vi.spyOn(mongoModule, 'getNextSequence').mockResolvedValue(1001)
  })

  it('1. should authenticate Super Admin with initial credentials from database', async () => {
    const successResult = await SuperAdminService.authenticate('AkshayGohel21', 'Akshay21')
    expect(successResult.authenticated).toBe(true)
    expect(successResult.token).toBeDefined()
    expect(successResult.user?.username).toBe('AkshayGohel21')
    expect(successResult.user?.role).toBe('SuperAdmin')

    const failResult = await SuperAdminService.authenticate('AkshayGohel21', 'WrongPassword')
    expect(failResult.authenticated).toBe(false)
  })

  it('1b. should verify passwords dynamically from database and reject old password after update', async () => {
    // 1. Update password dynamically via createUser/updateUser
    await SuperAdminService.createUser({
      username: 'AkshayGohel21',
      password: 'BrandNewSecurePassword2026',
      role: 'SuperAdmin',
      status: 'Active'
    })

    // 2. Old password must now fail
    const oldPassResult = await SuperAdminService.authenticate('AkshayGohel21', 'Akshay21')
    expect(oldPassResult.authenticated).toBe(false)

    // 3. New password must authenticate successfully
    const newPassResult = await SuperAdminService.authenticate('AkshayGohel21', 'BrandNewSecurePassword2026')
    expect(newPassResult.authenticated).toBe(true)
    expect(newPassResult.user?.username).toBe('AkshayGohel21')
    expect(newPassResult.user?.role).toBe('SuperAdmin')
  })

  it('2. should return default super admin settings including 12 module visibility and dropdown categories', async () => {
    const settings = await SuperAdminService.getSettings()
    expect(settings.module_visibility.employees).toBe(true)
    expect(settings.module_visibility.cutting).toBe(true)
    expect(settings.dropdown_categories.fabric_types).toBeDefined()
    expect(settings.dropdown_categories.fabric_types.items.length).toBeGreaterThan(0)
    expect(settings.dropdown_categories.expense_categories).toBeDefined()
  })

  it('3. should add and edit items in the Dropdown Master', async () => {
    // Add new item to fabric_types
    const updatedItems = await SuperAdminService.updateDropdownItem('fabric_types', null, 'Super Heavy 16oz Denim')
    expect(updatedItems).toContain('Super Heavy 16oz Denim')

    // Edit item in fabric_types
    const editedItems = await SuperAdminService.updateDropdownItem('fabric_types', 'Super Heavy 16oz Denim', 'Ultra Heavy 16oz Denim')
    expect(editedItems).toContain('Ultra Heavy 16oz Denim')
    expect(editedItems).not.toContain('Super Heavy 16oz Denim')
  })

  it('4. should delete items from a dropdown category', async () => {
    const items = await SuperAdminService.deleteDropdownItem('fabric_types', 'Heavy Indigo Denim 12oz')
    expect(items).not.toContain('Heavy Indigo Denim 12oz')
  })

  it('5. should toggle module visibility dynamically', async () => {
    const updated = await SuperAdminService.saveSettings({
      module_visibility: {
        employees: true,
        upad: true,
        seths: true,
        hisab_seth: true,
        cutting: true,
        finished_goods: true,
        rolls: true,
        partners: false, // Hidden by Super Admin
        income: false,   // Hidden by Super Admin
        expense: true,
        cashbook: true,
        reports: true
      }
    })

    expect(updated.module_visibility.partners).toBe(false)
    expect(updated.module_visibility.income).toBe(false)
    expect(updated.module_visibility.employees).toBe(true)
  })

  it('6. should return dynamic visibility settings for user dashboard', async () => {
    const visibility = await SuperAdminService.getModuleVisibility()
    expect(visibility.modules).toBeDefined()
    expect(visibility.operations).toBeDefined()
    expect(visibility.operations.allow_delete_records).toBe(true)
  })
})

