import { getMongoClient, getMongoDb, getNextSequence } from '../mongodb'
import { hashPassword, verifyPassword, generateToken, ensureDefaultUser } from '../auth'
import { organizationsService, MASTER_REGISTRY_DB } from './organizations'

export interface ModuleVisibilitySettings {
  employees: boolean
  upad: boolean
  seths: boolean
  hisab_seth: boolean
  cutting: boolean
  finished_goods: boolean
  rolls: boolean
  partners: boolean
  income: boolean
  expense: boolean
  cashbook: boolean
  reports: boolean
}

export interface OperationToggles {
  allow_delete_records: boolean
  allow_sheets_sync_button: boolean
  allow_export_excel: boolean
  allow_upad_advances: boolean
  allow_worker_salary_payout: boolean
  cashbook_negative_balance_alert: boolean
}

export interface DropdownMasterItem {
  id: string
  label: string
  category: string
  is_active: boolean
  sort_order?: number
}

export interface SuperAdminSettings {
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
  module_visibility: ModuleVisibilitySettings
  operations: OperationToggles
  dropdown_categories: Record<string, { label: string; items: string[] }>
  updated_at?: string
}

export const DEFAULT_SUPER_ADMIN_SETTINGS: SuperAdminSettings = {
  company_name: 'DenimFlow ERP',
  owner_name: 'Akshay Gohel',
  phone: '9898000000',
  email: 'akshaygohel8195@gmail.com',
  address: 'Surat, Gujarat',
  gstin: '',
  currency_symbol: '₹',
  default_stitching_rate: 50,
  default_washing_rate: 5,
  shift_hours: 10,
  module_visibility: {
    employees: true,
    upad: true,
    seths: true,
    hisab_seth: true,
    cutting: true,
    finished_goods: true,
    rolls: true,
    partners: true,
    income: true,
    expense: true,
    cashbook: true,
    reports: true
  },
  operations: {
    allow_delete_records: true,
    allow_sheets_sync_button: true,
    allow_export_excel: true,
    allow_upad_advances: true,
    allow_worker_salary_payout: true,
    cashbook_negative_balance_alert: true
  },
  dropdown_categories: {
    fabric_types: {
      label: 'Fabric Types',
      items: [
        'Heavy Indigo Denim 12oz',
        'Lycra Denim Stretch',
        'Cotton Twill 10oz',
        'Knit Denim',
        'Polyester Denim Blend',
        'Raw Indigo Denim 14oz',
        'Grey Slub Denim',
        'Black Cross Hatch Denim'
      ]
    },
    expense_categories: {
      label: 'Expense Categories',
      items: [
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
      ]
    },
    income_sources: {
      label: 'Income Sources',
      items: [
        'Job Work Stitching',
        'Seth Settlement Billing',
        'Fabric Scrap / Chindi Sale',
        'Ready Jeans Stock Sales',
        'Trading Commission',
        'Other Income'
      ]
    },
    employee_roles: {
      label: 'Employee Roles / Designations',
      items: [
        'Master Cutter',
        'Assistant Cutter',
        'Stitching Operator',
        'Overlock Operator',
        'Kaj-Button Operator',
        'Iron Master',
        'Checker / Quality',
        'Packing Operator',
        'Helper / Floor Worker'
      ]
    },
    payment_methods: {
      label: 'Payment Methods',
      items: [
        'Cash',
        'Google Pay / UPI',
        'PhonePe',
        'Bank Transfer / NEFT',
        'Cheque'
      ]
    },
    jeans_sizes: {
      label: 'Jeans Sizes & Ratios',
      items: ['28', '30', '32', '34', '36', '38', '40', '42', 'Mix (28-36)']
    },
    colors_shades: {
      label: 'Color Shades',
      items: ['Deep Indigo', 'Light Blue', 'Raw Black', 'Ice Wash', 'Grey Slub', 'Vintage Tint', 'Royal Blue']
    },
    units_of_measurement: {
      label: 'Units of Measurement',
      items: ['Meters (m)', 'Pieces (pcs)', 'Rolls', 'Kilograms (kg)', 'Dozen (dz)']
    }
  }
}

export class SuperAdminService {
  /**
   * Authenticate Super Admin dynamically against MongoDB Atlas users collection
   */
  static async authenticate(username: string, password: string): Promise<{
    authenticated: boolean
    token?: string
    user?: { username: string; display_name: string; role: string }
    error?: string
  }> {
    const cleanUser = (username || '').trim()
    const cleanPass = (password || '').trim()

    if (!cleanUser || !cleanPass) {
      return {
        authenticated: false,
        error: 'Username and password are required'
      }
    }

    const db = await getMongoDb()

    // Ensure default initial credentials if users collection is empty
    const count = await db.collection('users').countDocuments()
    if (count === 0) {
      await ensureDefaultUser()
    }

    // Lookup user in tenant database (case-insensitive)
    let user = await db.collection('users').findOne({
      username: { $regex: new RegExp(`^${cleanUser}$`, 'i') }
    })

    // If not found in primary tenant DB, check master registry users directory
    if (!user) {
      try {
        const client = await getMongoClient()
        const masterDb = client.db(MASTER_REGISTRY_DB)
        const dirUser = await masterDb.collection('users_directory').findOne({
          username: { $regex: new RegExp(`^${cleanUser}$`, 'i') }
        })
        if (dirUser && dirUser.database_name) {
          const tenantDb = client.db(dirUser.database_name)
          user = await tenantDb.collection('users').findOne({
            username: { $regex: new RegExp(`^${cleanUser}$`, 'i') }
          })
        }
      } catch (e) {
        // Fallback silently if directory lookup fails
      }
    }

    if (!user) {
      return {
        authenticated: false,
        error: 'Invalid Super Admin username or password'
      }
    }

    // Role check: Only SuperAdmin accounts are authorized
    if (user.role !== 'SuperAdmin') {
      return {
        authenticated: false,
        error: 'Access denied: User does not have Super Admin privileges'
      }
    }

    // Status check
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return {
        authenticated: false,
        error: 'This Super Admin account has been deactivated'
      }
    }

    // Strict bcrypt hash verification against stored database hash
    const valid = await verifyPassword(cleanPass, user.password_hash)
    if (!valid) {
      return {
        authenticated: false,
        error: 'Invalid Super Admin username or password'
      }
    }

    const token = generateToken({ sub: user.username, role: 'SuperAdmin' })
    return {
      authenticated: true,
      token,
      user: {
        username: user.username,
        display_name: user.display_name || user.username,
        role: 'SuperAdmin'
      }
    }
  }

  /**
   * Get all Super Admin settings including dynamic module visibility & dropdown master
   */
  static async getSettings(): Promise<SuperAdminSettings> {
    const db = await getMongoDb()
    const doc = await db.collection('system_settings').findOne({ type: 'super_admin_settings' })
    if (!doc) {
      const initial = { ...DEFAULT_SUPER_ADMIN_SETTINGS, type: 'super_admin_settings', updated_at: new Date().toISOString() }
      await db.collection('system_settings').insertOne(initial)
      const { _id, type, ...rest } = initial as any
      return rest as SuperAdminSettings
    }

    const { _id, type, ...rest } = doc
    return {
      ...DEFAULT_SUPER_ADMIN_SETTINGS,
      ...rest,
      module_visibility: {
        ...DEFAULT_SUPER_ADMIN_SETTINGS.module_visibility,
        ...(rest.module_visibility || {})
      },
      operations: {
        ...DEFAULT_SUPER_ADMIN_SETTINGS.operations,
        ...(rest.operations || {})
      },
      dropdown_categories: rest.dropdown_categories || DEFAULT_SUPER_ADMIN_SETTINGS.dropdown_categories
    } as SuperAdminSettings
  }

  /**
   * Save Super Admin settings
   */
  static async saveSettings(settings: Partial<SuperAdminSettings>): Promise<SuperAdminSettings> {
    const db = await getMongoDb()
    const current = await this.getSettings()
    const now = new Date().toISOString()

    const updated: SuperAdminSettings = {
      ...current,
      ...settings,
      company_name: settings.company_name !== undefined ? settings.company_name.trim() : current.company_name,
      owner_name: settings.owner_name !== undefined ? settings.owner_name.trim() : current.owner_name,
      phone: settings.phone !== undefined ? settings.phone.trim() : current.phone,
      address: settings.address !== undefined ? settings.address.trim() : current.address,
      default_stitching_rate: settings.default_stitching_rate !== undefined ? Number(settings.default_stitching_rate) : current.default_stitching_rate,
      default_washing_rate: settings.default_washing_rate !== undefined ? Number(settings.default_washing_rate) : current.default_washing_rate,
      module_visibility: {
        ...current.module_visibility,
        ...(settings.module_visibility || {})
      },
      operations: {
        ...current.operations,
        ...(settings.operations || {})
      },
      dropdown_categories: {
        ...current.dropdown_categories,
        ...(settings.dropdown_categories || {})
      },
      updated_at: now
    }

    await db.collection('system_settings').updateOne(
      { type: 'super_admin_settings' },
      { $set: { type: 'super_admin_settings', ...updated } },
      { upsert: true }
    )

    return updated
  }

  /**
   * Get dynamic visibility configuration for main dashboard
   */
  static async getModuleVisibility(): Promise<{
    modules: ModuleVisibilitySettings
    operations: OperationToggles
  }> {
    const settings = await this.getSettings()
    return {
      modules: settings.module_visibility,
      operations: settings.operations
    }
  }

  /**
   * Dropdown Master: Get all dropdown categories or a specific category
   */
  static async getDropdowns(categoryKey?: string) {
    const settings = await this.getSettings()
    if (categoryKey) {
      const cat = settings.dropdown_categories[categoryKey]
      return cat ? cat.items : []
    }
    return settings.dropdown_categories
  }

  /**
   * Dropdown Master: Add or Edit an item in a category
   */
  static async updateDropdownItem(categoryKey: string, oldItem: string | null, newItem: string): Promise<string[]> {
    const settings = await this.getSettings()
    const categories = { ...settings.dropdown_categories }
    const cat = categories[categoryKey]

    if (!cat) {
      throw new Error(`Dropdown category "${categoryKey}" does not exist`)
    }

    const cleanNew = newItem.trim()
    if (!cleanNew) throw new Error('Item name cannot be empty')

    let items = [...cat.items]
    if (oldItem) {
      // Edit mode: replace old item
      items = items.map(item => item === oldItem ? cleanNew : item)
    } else {
      // Add mode: append if not duplicate
      if (!items.includes(cleanNew)) {
        items.push(cleanNew)
      }
    }

    categories[categoryKey] = { ...cat, items }
    await this.saveSettings({ dropdown_categories: categories })
    return items
  }

  /**
   * Dropdown Master: Remove an item from a category
   */
  static async deleteDropdownItem(categoryKey: string, itemToDelete: string): Promise<string[]> {
    const settings = await this.getSettings()
    const categories = { ...settings.dropdown_categories }
    const cat = categories[categoryKey]
    if (!cat) return []

    const items = cat.items.filter(i => i !== itemToDelete)
    categories[categoryKey] = { ...cat, items }
    await this.saveSettings({ dropdown_categories: categories })
    return items
  }

  /**
   * Dropdown Master: Create a brand new custom category
   */
  static async createDropdownCategory(key: string, label: string, initialItems: string[] = []): Promise<any> {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const settings = await this.getSettings()
    const categories = { ...settings.dropdown_categories }

    if (categories[cleanKey]) {
      throw new Error(`Dropdown category "${cleanKey}" already exists`)
    }

    categories[cleanKey] = {
      label: label.trim() || cleanKey,
      items: initialItems
    }

    await this.saveSettings({ dropdown_categories: categories })
    return categories[cleanKey]
  }

  /**
   * Dropdown Master: Delete an entire category
   */
  static async deleteDropdownCategory(categoryKey: string): Promise<boolean> {
    const settings = await this.getSettings()
    const categories = { ...settings.dropdown_categories }
    delete categories[categoryKey]
    await this.saveSettings({ dropdown_categories: categories })
    return true
  }

  /**
   * User Management: List all users
   */
  static async getUsers() {
    const db = await getMongoDb()
    const users = await db.collection('users').find({}).sort({ id: 1 }).toArray()
    return users.map(u => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name || u.username,
      role: u.role || 'Operator',
      status: u.status || 'Active',
      created_at: u.created_at || new Date().toISOString()
    }))
  }

  /**
   * User Management: Create new user or update credentials if user exists
   */
  static async createUser(data: {
    username: string
    password: string
    display_name?: string
    role?: string
    status?: string
    org_slug?: string
  }) {
    const db = await getMongoDb()
    const cleanUser = data.username.trim()
    const existing = await db.collection('users').findOne({
      username: { $regex: new RegExp(`^${cleanUser}$`, 'i') }
    })

    if (existing) {
      const updateFields: any = { updated_at: new Date().toISOString() }
      if (data.password && data.password.trim()) {
        updateFields.password_hash = await hashPassword(data.password.trim())
      }
      if (data.display_name) updateFields.display_name = data.display_name.trim()
      if (data.role) updateFields.role = data.role
      if (data.status) updateFields.status = data.status

      await db.collection('users').updateOne({ _id: existing._id }, { $set: updateFields })
      return {
        id: existing.id,
        username: existing.username,
        display_name: data.display_name?.trim() || existing.display_name || existing.username,
        role: data.role || existing.role || 'Operator',
        status: data.status || existing.status || 'Active'
      }
    }

    const id = await getNextSequence('users')
    const hash = await hashPassword(data.password)
    const now = new Date().toISOString()

    const newUser = {
      id,
      username: cleanUser,
      display_name: data.display_name?.trim() || cleanUser,
      password_hash: hash,
      role: data.role || 'Operator',
      status: data.status || 'Active',
      created_at: now,
      updated_at: now
    }

    await db.collection('users').insertOne(newUser)

    // Sync into master users directory
    try {
      const userOrg = data.org_slug || 'rd-jeans-main'
      const safeDb = userOrg === 'rd-jeans-main' ? 'rd_jeans_factory' : `rd_tenant_${userOrg.replace(/-/g, '_')}`
      await organizationsService.registerUserInDirectory({
        username: newUser.username,
        org_slug: userOrg,
        database_name: safeDb,
        role: newUser.role,
        status: newUser.status,
      })
    } catch (e) {
      console.warn('Failed to register user in master directory:', e)
    }

    return {
      id,
      username: newUser.username,
      display_name: newUser.display_name,
      role: newUser.role,
      status: newUser.status
    }
  }

  /**
   * User Management: Update user or change password
   */
  static async updateUser(id: number, data: any) {
    const db = await getMongoDb()
    const user = await db.collection('users').findOne({ id: Number(id) })
    if (!user) throw new Error('User not found')

    const updateFields: any = { updated_at: new Date().toISOString() }
    if (data.display_name !== undefined) updateFields.display_name = data.display_name.trim()
    if (data.role !== undefined) updateFields.role = data.role
    if (data.status !== undefined) updateFields.status = data.status
    if (data.password && data.password.trim()) {
      updateFields.password_hash = await hashPassword(data.password.trim())
    }

    await db.collection('users').updateOne({ id: Number(id) }, { $set: updateFields })
    return { success: true }
  }

  /**
   * User Management: Delete user (protect SuperAdmin)
   */
  static async deleteUser(id: number) {
    const db = await getMongoDb()
    const user = await db.collection('users').findOne({ id: Number(id) })
    if (!user) throw new Error('User not found')
    if (user.role === 'SuperAdmin') {
      const activeSuperCount = await db.collection('users').countDocuments({ role: 'SuperAdmin', status: { $ne: 'Inactive' } })
      if (activeSuperCount <= 1) {
        throw new Error('Cannot delete the last remaining active Super Admin account')
      }
    }

    await db.collection('users').deleteOne({ id: Number(id) })
    return { success: true }
  }

  /**
   * Full Database Backup
   */
  static async createBackup() {
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
      collectionsData[name] = docs.map(({ _id, ...rest }) => rest)
      totalRecords += docs.length
    }

    return {
      metadata: {
        factory: 'DenimFlow ERP',
        backup_date: new Date().toISOString(),
        version: '2.0.0 (Super Admin Master Backup)',
        total_records: totalRecords
      },
      collections: collectionsData
    }
  }

  /**
   * Restore Database from JSON
   */
  static async restoreBackup(backupData: any) {
    if (!backupData || !backupData.collections) {
      throw new Error('Invalid backup file: "collections" object missing')
    }

    const db = await getMongoDb()
    let restoredCols = 0
    let totalRecords = 0
    const details: Record<string, number> = {}

    for (const [colName, docs] of Object.entries(backupData.collections)) {
      if (Array.isArray(docs) && docs.length > 0) {
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
   * Live Database Statistics
   */
  static async getDatabaseStats() {
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
