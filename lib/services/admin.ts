import { getMongoDb, getNextSequence } from '../mongodb'
import { hashPassword } from '../auth'

export interface FactorySettings {
  company_name: string
  owner_name: string
  phone: string
  email?: string
  address: string
  gstin?: string
  currency_symbol: string
  default_stitching_rate: number
  default_washing_rate: number
  shift_hours: number
  fabric_types: string[]
  expense_categories: string[]
  income_sources: string[]
  employee_roles: string[]
  payment_methods: string[]
  updated_at?: string
}

export const DEFAULT_FACTORY_SETTINGS: FactorySettings = {
  company_name: 'Akshay RD Jeans Factory',
  owner_name: 'Akshay Gohel',
  phone: '9898000000',
  email: 'akshaygohel8195@gmail.com',
  address: 'Surat, Gujarat',
  gstin: '',
  currency_symbol: '₹',
  default_stitching_rate: 50,
  default_washing_rate: 5,
  shift_hours: 10,
  fabric_types: [
    'Heavy Indigo Denim 12oz',
    'Lycra Denim Stretch',
    'Cotton Twill 10oz',
    'Knit Denim',
    'Polyester Denim Blend',
    'Raw Indigo Denim 14oz',
    'Grey Slub Denim',
    'Black Cross Hatch Denim'
  ],
  expense_categories: [
    'Thread & Spools',
    'Needles & Accessories',
    'Machine Oil & Lubricants',
    'Maintenance & Machine Repair',
    'Electric Bill & Utilities',
    'Chai, Snacks & Food',
    'Transport & Logistics',
    'Factory Rent',
    'Packing & Polybags',
    'Washing Jobwork',
    'Hardware (Buttons, Rivets, Zips)',
    'Worker Incentive & Bonus',
    'Other Expenses'
  ],
  income_sources: [
    'Job Work Stitching',
    'Seth Settlement Billing',
    'Fabric Scrap / Chindi Sale',
    'Ready Jeans Stock Sales',
    'Trading Commission',
    'Other Income'
  ],
  employee_roles: [
    'Master Cutter',
    'Assistant Cutter',
    'Stitching Operator',
    'Overlock Operator',
    'Kaj-Button Operator',
    'Iron Master',
    'Checker / Quality',
    'Packing Operator',
    'Helper / Floor Worker'
  ],
  payment_methods: [
    'Cash',
    'Google Pay / UPI',
    'PhonePe',
    'Bank Transfer / NEFT',
    'Cheque'
  ]
}

export interface AdminUser {
  id: number
  username: string
  display_name?: string
  role: 'Admin' | 'Manager' | 'Cashier' | 'Operator' | 'Viewer'
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at?: string
}

export class AdminService {
  /**
   * Get factory profile & master lookup settings
   */
  static async getSettings(): Promise<FactorySettings> {
    const db = await getMongoDb()
    const doc = await db.collection('system_settings').findOne({ type: 'factory_settings' })
    if (!doc) {
      // Seed default factory settings
      const initial = { ...DEFAULT_FACTORY_SETTINGS, type: 'factory_settings', updated_at: new Date().toISOString() }
      await db.collection('system_settings').insertOne(initial)
      const { _id, type, ...rest } = initial as any
      return rest as FactorySettings
    }
    const { _id, type, ...rest } = doc
    return {
      ...DEFAULT_FACTORY_SETTINGS,
      ...rest
    } as FactorySettings
  }

  /**
   * Update factory settings and master lookups
   */
  static async saveSettings(settings: Partial<FactorySettings>): Promise<FactorySettings> {
    const db = await getMongoDb()
    const current = await this.getSettings()
    const now = new Date().toISOString()

    const updated: FactorySettings = {
      ...current,
      ...settings,
      company_name: settings.company_name !== undefined ? settings.company_name.trim() : current.company_name,
      owner_name: settings.owner_name !== undefined ? settings.owner_name.trim() : current.owner_name,
      phone: settings.phone !== undefined ? settings.phone.trim() : current.phone,
      address: settings.address !== undefined ? settings.address.trim() : current.address,
      default_stitching_rate: settings.default_stitching_rate !== undefined ? Number(settings.default_stitching_rate) : current.default_stitching_rate,
      default_washing_rate: settings.default_washing_rate !== undefined ? Number(settings.default_washing_rate) : current.default_washing_rate,
      updated_at: now
    }

    await db.collection('system_settings').updateOne(
      { type: 'factory_settings' },
      { $set: { type: 'factory_settings', ...updated } },
      { upsert: true }
    )

    return updated
  }

  /**
   * Get list of all staff / user accounts
   */
  static async getUsers(): Promise<AdminUser[]> {
    const db = await getMongoDb()
    const users = await db.collection('users').find({}).sort({ id: 1 }).toArray()
    return users.map(u => ({
      id: u.id || 1,
      username: u.username,
      display_name: u.display_name || u.username,
      role: u.role || (u.username === 'rdjeans123' ? 'Admin' : 'Operator'),
      status: u.status || 'Active',
      created_at: u.created_at || new Date().toISOString()
    }))
  }

  /**
   * Create a new user account
   */
  static async createUser(data: {
    username: string
    password: string
    display_name?: string
    role?: 'Admin' | 'Manager' | 'Cashier' | 'Operator' | 'Viewer'
    status?: 'Active' | 'Inactive'
  }): Promise<AdminUser> {
    const db = await getMongoDb()
    const cleanUsername = data.username.trim().toLowerCase()

    const existing = await db.collection('users').findOne({ username: cleanUsername })
    if (existing) {
      throw new Error(`Username "${cleanUsername}" already exists`)
    }

    const id = await getNextSequence('users')
    const passwordHash = await hashPassword(data.password)
    const now = new Date().toISOString()

    const newUser = {
      id,
      username: cleanUsername,
      password_hash: passwordHash,
      display_name: data.display_name?.trim() || cleanUsername,
      role: data.role || 'Operator',
      status: data.status || 'Active',
      created_at: now,
      updated_at: now
    }

    await db.collection('users').insertOne(newUser)

    return {
      id,
      username: cleanUsername,
      display_name: newUser.display_name,
      role: newUser.role,
      status: newUser.status,
      created_at: now
    }
  }

  /**
   * Update an existing user account
   */
  static async updateUser(
    id: number,
    data: {
      display_name?: string
      role?: 'Admin' | 'Manager' | 'Cashier' | 'Operator' | 'Viewer'
      status?: 'Active' | 'Inactive'
      password?: string
    }
  ): Promise<AdminUser> {
    const db = await getMongoDb()
    const user = await db.collection('users').findOne({ id: Number(id) })
    if (!user) {
      throw new Error('User not found')
    }

    const updateFields: any = {
      updated_at: new Date().toISOString()
    }

    if (data.display_name !== undefined) updateFields.display_name = data.display_name.trim()
    if (data.role !== undefined) updateFields.role = data.role
    if (data.status !== undefined) updateFields.status = data.status

    if (data.password && data.password.trim()) {
      updateFields.password_hash = await hashPassword(data.password.trim())
    }

    await db.collection('users').updateOne({ id: Number(id) }, { $set: updateFields })

    const updated = await db.collection('users').findOne({ id: Number(id) })
    return {
      id: updated.id,
      username: updated.username,
      display_name: updated.display_name,
      role: updated.role,
      status: updated.status,
      created_at: updated.created_at
    }
  }

  /**
   * Delete a user account (prevents deleting the root admin)
   */
  static async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const db = await getMongoDb()
    const user = await db.collection('users').findOne({ id: Number(id) })
    if (!user) {
      throw new Error('User not found')
    }

    if (user.username === 'rdjeans123' || user.id === 1) {
      throw new Error('Cannot delete primary system Administrator (rdjeans123)')
    }

    await db.collection('users').deleteOne({ id: Number(id) })
    return { success: true, message: `User "${user.username}" deleted successfully` }
  }

  /**
   * Full Factory Database Backup (exports all collections into a clean JSON archive)
   */
  static async createDatabaseBackup(): Promise<{
    metadata: {
      factory: string
      backup_date: string
      version: string
      total_records: number
    }
    collections: Record<string, any[]>
  }> {
    const db = await getMongoDb()
    const collectionNames = [
      'employees',
      'seths',
      'seth_hisabs',
      'cutting_entries',
      'rolls',
      'finished_goods',
      'cash_book_ledger',
      'incomes',
      'expenses',
      'upad_records',
      'salaries',
      'partners',
      'partner_transactions',
      'system_settings',
      'integration_settings'
    ]

    const collectionsData: Record<string, any[]> = {}
    let totalRecords = 0

    for (const name of collectionNames) {
      const docs = await db.collection(name).find({}).toArray()
      // Remove raw MongoDB _id for portability
      collectionsData[name] = docs.map(({ _id, ...rest }) => rest)
      totalRecords += docs.length
    }

    return {
      metadata: {
        factory: 'Akshay RD Jeans Factory',
        backup_date: new Date().toISOString(),
        version: '1.0.0',
        total_records: totalRecords
      },
      collections: collectionsData
    }
  }

  /**
   * Restore Factory Database from a JSON Backup
   */
  static async restoreDatabaseBackup(backupData: any): Promise<{
    success: boolean
    restored_collections: number
    total_records: number
    details: Record<string, number>
  }> {
    if (!backupData || !backupData.collections) {
      throw new Error('Invalid backup file format: "collections" object missing')
    }

    const db = await getMongoDb()
    let restoredCols = 0
    let totalRecords = 0
    const details: Record<string, number> = {}

    for (const [colName, docs] of Object.entries(backupData.collections)) {
      if (Array.isArray(docs) && docs.length > 0) {
        // Clear collection and batch re-insert
        await db.collection(colName).deleteMany({})
        await db.collection(colName).insertMany(docs.map((d: any) => ({ ...d })))
        details[colName] = docs.length
        totalRecords += docs.length
        restoredCols++
      }
    }

    return {
      success: true,
      restored_collections: restoredCols,
      total_records: totalRecords,
      details
    }
  }

  /**
   * Live Database Statistics across all factory collections
   */
  static async getDatabaseStats(): Promise<{
    total_records: number
    collections: Record<string, number>
    server_time: string
    db_connected: boolean
  }> {
    const db = await getMongoDb()
    const collectionList = [
      'employees',
      'seths',
      'seth_hisabs',
      'cutting_entries',
      'rolls',
      'finished_goods',
      'cash_book_ledger',
      'incomes',
      'expenses',
      'upad_records',
      'salaries',
      'partners',
      'users'
    ]

    const counts: Record<string, number> = {}
    let total = 0

    await Promise.all(
      collectionList.map(async (name) => {
        try {
          const count = await db.collection(name).countDocuments()
          counts[name] = count
          total += count
        } catch {
          counts[name] = 0
        }
      })
    )

    return {
      total_records: total,
      collections: counts,
      server_time: new Date().toISOString(),
      db_connected: true
    }
  }
}
