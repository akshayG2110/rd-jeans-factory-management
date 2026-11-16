import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminService } from '@/lib/services/admin'
import * as mongoModule from '@/lib/mongodb'

describe('AdminService Unit Tests', () => {
  let mockDb: any
  let mockCollections: Record<string, any>

  beforeEach(() => {
    vi.clearAllMocks()

    mockCollections = {
      system_settings: {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        updateOne: vi.fn().mockResolvedValue({ acknowledged: true })
      },
      users: {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, username: 'rdjeans123', display_name: 'Akshay Admin', role: 'Admin', status: 'Active' }
            ])
          })
        }),
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        deleteOne: vi.fn().mockResolvedValue({ acknowledged: true }),
        countDocuments: vi.fn().mockResolvedValue(1)
      },
      employees: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([{ id: 1, employee_name: 'Worker 1' }])
        }),
        countDocuments: vi.fn().mockResolvedValue(5),
        deleteMany: vi.fn().mockResolvedValue({ acknowledged: true }),
        insertMany: vi.fn().mockResolvedValue({ acknowledged: true })
      },
      seths: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([{ id: 1, seth_name: 'Seth A' }])
        }),
        countDocuments: vi.fn().mockResolvedValue(3)
      },
      seth_hisabs: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(2)
      },
      cutting_entries: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(8)
      },
      rolls: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(4)
      },
      finished_goods: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(4)
      },
      cash_book_ledger: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(15)
      },
      incomes: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(3)
      },
      expenses: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(6)
      },
      upad_records: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(7)
      },
      salaries: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(2)
      },
      partners: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(2)
      },
      partner_transactions: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(0)
      },
      integration_settings: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        countDocuments: vi.fn().mockResolvedValue(1)
      }
    }

    const createMockCollection = () => ({
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        }),
        toArray: vi.fn().mockResolvedValue([])
      }),
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      insertMany: vi.fn().mockResolvedValue({ acknowledged: true }),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      deleteMany: vi.fn().mockResolvedValue({ acknowledged: true }),
      deleteOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      countDocuments: vi.fn().mockResolvedValue(0)
    })

    mockDb = {
      collection: vi.fn((name: string) => {
        if (!mockCollections[name]) {
          mockCollections[name] = createMockCollection()
        } else {
          // Fill in any missing methods
          const defaults = createMockCollection()
          for (const [key, val] of Object.entries(defaults)) {
            if (!(mockCollections[name] as any)[key]) {
              (mockCollections[name] as any)[key] = val
            }
          }
        }
        return mockCollections[name]
      })
    }

    vi.spyOn(mongoModule, 'getMongoDb').mockResolvedValue(mockDb as any)
    vi.spyOn(mongoModule, 'getNextSequence').mockResolvedValue(2)
  })

  it('1. should return default factory settings and save updates', async () => {
    const settings = await AdminService.getSettings()
    expect(settings.company_name).toBe('Akshay RD Jeans Factory')
    expect(settings.default_stitching_rate).toBe(50)
    expect(settings.fabric_types.length).toBeGreaterThan(0)

    const updated = await AdminService.saveSettings({
      company_name: 'Akshay RD Denim Manufacturing',
      default_stitching_rate: 55
    })
    expect(updated.company_name).toBe('Akshay RD Denim Manufacturing')
    expect(updated.default_stitching_rate).toBe(55)
    expect(mockCollections.system_settings.updateOne).toHaveBeenCalled()
  })

  it('2. should manage staff user accounts', async () => {
    const users = await AdminService.getUsers()
    expect(users.length).toBe(1)
    expect(users[0].username).toBe('rdjeans123')

    const newUser = await AdminService.createUser({
      username: 'cutter1',
      password: 'Password@123',
      display_name: 'Ramesh Cutter',
      role: 'Operator'
    })
    expect(newUser.username).toBe('cutter1')
    expect(newUser.display_name).toBe('Ramesh Cutter')
    expect(mockCollections.users.insertOne).toHaveBeenCalled()
  })

  it('3. should create a full database backup archive', async () => {
    const backup = await AdminService.createDatabaseBackup()
    expect(backup.metadata).toBeDefined()
    expect(backup.metadata.factory).toBe('Akshay RD Jeans Factory')
    expect(backup.collections.employees).toBeDefined()
    expect(backup.collections.employees.length).toBe(1)
    expect(backup.collections.seths.length).toBe(1)
  })

  it('4. should restore database backup into collections', async () => {
    const backupData = {
      collections: {
        employees: [{ id: 1, employee_name: 'Restored Employee' }],
        seths: [{ id: 1, seth_name: 'Restored Seth' }]
      }
    }

    const restoreResult = await AdminService.restoreDatabaseBackup(backupData)
    expect(restoreResult.success).toBe(true)
    expect(restoreResult.restored_collections).toBe(2)
    expect(restoreResult.total_records).toBe(2)
  })

  it('5. should fetch database statistics across all factory collections', async () => {
    const stats = await AdminService.getDatabaseStats()
    expect(stats.db_connected).toBe(true)
    expect(stats.collections.employees).toBe(5)
    expect(stats.collections.seths).toBe(3)
    expect(stats.collections.cutting_entries).toBe(8)
    expect(stats.total_records).toBeGreaterThan(0)
  })
})
