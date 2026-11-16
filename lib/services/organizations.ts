import { getMongoClient, getMongoDb } from '../mongodb'

export interface OrganizationSettings {
  default_stitching_rate?: number
  default_washing_rate?: number
  shift_hours?: number
  currency_symbol?: string
  google_sheets_webhook_url?: string
}

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

export interface Organization {
  id: number
  org_id: string
  name: string
  slug: string
  database_name: string
  owner_name: string
  phone: string
  address: string
  gstin?: string
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at?: string
  settings?: OrganizationSettings
  module_visibility?: ModuleVisibilitySettings
  stats?: {
    totalEmployees: number
    totalLots: number
    totalHisabs: number
    totalRolls: number
  }
}

export const MASTER_REGISTRY_DB = 'rd_master_registry'
export const DEFAULT_ORG_SLUG = 'rd-jeans-main'
export const DEFAULT_ORG_DB = process.env.MONGODB_DB || 'rd_jeans_factory'

export const DEFAULT_MODULE_VISIBILITY: ModuleVisibilitySettings = {
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
  reports: true,
}

class OrganizationsService {
  /**
   * Helper to get Master Registry DB
   */
  private async getMasterDb() {
    const client = await getMongoClient()
    return client.db(MASTER_REGISTRY_DB)
  }

  /**
   * Automatically initializes the default "RD Jeans Factory" organization in the master registry
   */
  async ensureDefaultOrganization(): Promise<Organization> {
    const masterDb = await this.getMasterDb()
    const orgsCol = masterDb.collection<Organization>('organizations')

    let defaultOrg = await orgsCol.findOne({ slug: DEFAULT_ORG_SLUG })
    if (!defaultOrg) {
      // Check if any organization exists
      const count = await orgsCol.countDocuments()
      const newOrg: Organization = {
        id: 1,
        org_id: 'org_rd_jeans_main',
        name: 'DenimFlow Factory',
        slug: DEFAULT_ORG_SLUG,
        database_name: DEFAULT_ORG_DB,
        owner_name: 'Akshay Gohel',
        phone: '+91 98765 43210',
        address: 'Ahmedabad, Gujarat',
        gstin: '24AAAAA0000A1Z5',
        status: 'Active',
        created_at: new Date().toISOString(),
        settings: {
          default_stitching_rate: 45,
          default_washing_rate: 5,
          shift_hours: 10,
          currency_symbol: '₹',
        },
        module_visibility: { ...DEFAULT_MODULE_VISIBILITY },
      }

      await orgsCol.insertOne(newOrg as any)
      defaultOrg = newOrg
    }

    // Ensure primary users are indexed in master directory
    try {
      await this.registerUserInDirectory({
        username: 'rdjeans123',
        org_slug: DEFAULT_ORG_SLUG,
        database_name: DEFAULT_ORG_DB,
        role: 'Operator',
        status: 'Active',
      })
      await this.registerUserInDirectory({
        username: 'AkshayGohel21',
        org_slug: DEFAULT_ORG_SLUG,
        database_name: DEFAULT_ORG_DB,
        role: 'SuperAdmin',
        status: 'Active',
      })
    } catch {
      // Ignore directory sync error during startup
    }

    return defaultOrg
  }

  /**
   * Looks up an organization context by username
   */
  async lookupUserOrg(username: string): Promise<{ org_slug: string; database_name: string } | null> {
    const clean = (username || '').trim()
    if (!clean) return null

    const masterDb = await this.getMasterDb()
    const userDir = masterDb.collection('users_directory')

    const entry = await userDir.findOne({ username: clean })
    if (entry) {
      return { org_slug: entry.org_slug, database_name: entry.database_name }
    }

    // Default RD Jeans user fallback
    return { org_slug: DEFAULT_ORG_SLUG, database_name: DEFAULT_ORG_DB }
  }

  /**
   * Registers or updates a user mapping in the central directory
   */
  async registerUserInDirectory(data: {
    username: string
    org_slug: string
    database_name: string
    role?: string
    status?: string
  }) {
    const masterDb = await this.getMasterDb()
    await masterDb.collection('users_directory').updateOne(
      { username: data.username.trim() },
      {
        $set: {
          username: data.username.trim(),
          org_slug: data.org_slug,
          database_name: data.database_name,
          role: data.role || 'Operator',
          status: data.status || 'Active',
          updated_at: new Date().toISOString(),
        },
        $setOnInsert: {
          created_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    )
  }

  /**
   * Returns all registered organizations with live statistics
   */
  async getOrganizations(): Promise<Organization[]> {
    await this.ensureDefaultOrganization()
    const masterDb = await this.getMasterDb()
    const client = await getMongoClient()
    const orgs = await masterDb.collection<Organization>('organizations').find({}).sort({ id: 1 }).toArray()

    // Enrich each organization with live database statistics
    const enriched: Organization[] = await Promise.all(
      orgs.map(async (org) => {
        try {
          const tenantDb = client.db(org.database_name)
          const [empCount, lotCount, hisabCount, rollCount] = await Promise.all([
            tenantDb.collection('employees').countDocuments().catch(() => 0),
            tenantDb.collection('cutting_entries').countDocuments().catch(() => 0),
            tenantDb.collection('seth_hisabs').countDocuments().catch(() => 0),
            tenantDb.collection('rolls').countDocuments().catch(() => 0),
          ])

          return {
            ...org,
            stats: {
              totalEmployees: empCount,
              totalLots: lotCount,
              totalHisabs: hisabCount,
              totalRolls: rollCount,
            },
          }
        } catch {
          return {
            ...org,
            stats: {
              totalEmployees: 0,
              totalLots: 0,
              totalHisabs: 0,
              totalRolls: 0,
            },
          }
        }
      })
    )

    return enriched
  }

  /**
   * Get single organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    await this.ensureDefaultOrganization()
    const masterDb = await this.getMasterDb()
    return await masterDb.collection<Organization>('organizations').findOne({ slug })
  }

  /**
   * Create a new organization with a 100% separate, clean database
   */
  async createOrganization(payload: {
    name: string
    slug?: string
    owner_name?: string
    phone?: string
    address?: string
    gstin?: string
    initial_username?: string
    initial_password?: string
    settings?: OrganizationSettings
    module_visibility?: Partial<ModuleVisibilitySettings>
  }): Promise<Organization> {
    const masterDb = await this.getMasterDb()
    const orgsCol = masterDb.collection<Organization>('organizations')

    const cleanName = (payload.name || '').trim()
    if (!cleanName) {
      throw new Error('Organization name is required')
    }

    // Generate safe unique slug
    let rawSlug = payload.slug?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    rawSlug = rawSlug.replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (!rawSlug) rawSlug = `org-${Date.now()}`

    const existing = await orgsCol.findOne({ slug: rawSlug })
    if (existing) {
      throw new Error(`Organization with slug "${rawSlug}" already exists. Please choose another name or slug.`)
    }

    // Dedicated physical database name for this tenant
    const safeDbName = `rd_tenant_${rawSlug.replace(/-/g, '_')}`

    // Calculate sequential ID
    const lastOrg = await orgsCol.find({}).sort({ id: -1 }).limit(1).toArray()
    const nextId = (lastOrg[0]?.id || 1) + 1

    const newOrg: Organization = {
      id: nextId,
      org_id: `org_${rawSlug.replace(/-/g, '_')}`,
      name: cleanName,
      slug: rawSlug,
      database_name: safeDbName,
      owner_name: (payload.owner_name || '').trim() || cleanName,
      phone: (payload.phone || '').trim() || '',
      address: (payload.address || '').trim() || '',
      gstin: (payload.gstin || '').trim() || '',
      status: 'Active',
      created_at: new Date().toISOString(),
      settings: {
        default_stitching_rate: payload.settings?.default_stitching_rate ?? 45,
        default_washing_rate: payload.settings?.default_washing_rate ?? 5,
        shift_hours: payload.settings?.shift_hours ?? 10,
        currency_symbol: payload.settings?.currency_symbol ?? '₹',
        google_sheets_webhook_url: payload.settings?.google_sheets_webhook_url || '',
      },
      module_visibility: {
        ...DEFAULT_MODULE_VISIBILITY,
        ...(payload.module_visibility || {}),
      },
    }

    // 1. Initialize the clean tenant database with seed metadata
    const client = await getMongoClient()
    const tenantDb = client.db(safeDbName)

    // Seed system settings
    await tenantDb.collection('system_settings').insertOne({
      type: 'super_admin_settings',
      company_name: newOrg.name,
      owner_name: newOrg.owner_name,
      phone: newOrg.phone,
      address: newOrg.address,
      modules: newOrg.module_visibility,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Seed default dropdowns
    await tenantDb.collection('system_settings').insertOne({
      type: 'dropdown_settings',
      fabric_types: ['Cotton Denim', 'Stretch Denim', 'Heavy Drill', 'Slub Lycra', 'Polyester Denim'],
      cutting_statuses: ['Cutting Complete', 'In Stitching', 'Washing Pending', 'Ready for Settlement'],
      payment_methods: ['Cash', 'Bank Transfer', 'GPay / UPI', 'Cheque'],
      departments: ['Cutting', 'Stitching', 'Ironing / Finishing', 'Packing', 'Management'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Seed factory balance
    await tenantDb.collection('factory_balance').insertOne({
      current_balance: 0,
      opening_balance: 0,
      last_updated: new Date().toISOString(),
    })

    // Seed Google Sheets integration if provided
    if (payload.settings?.google_sheets_webhook_url) {
      await tenantDb.collection('integration_settings').insertOne({
        type: 'google_sheets',
        webhook_url: payload.settings.google_sheets_webhook_url.trim(),
        auto_sync_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    // Seed initial counters (1, 2, 3...)
    await tenantDb.collection('counters').insertMany([
      { _id: 'employees' as any, seq: 0 },
      { _id: 'cutting_entries' as any, seq: 0 },
      { _id: 'rolls' as any, seq: 0 },
      { _id: 'seths' as any, seq: 0 },
      { _id: 'seth_hisabs' as any, seq: 0 },
      { _id: 'upad_records' as any, seq: 0 },
      { _id: 'incomes' as any, seq: 0 },
      { _id: 'expenses' as any, seq: 0 },
      { _id: 'cash_book_ledger' as any, seq: 0 },
      { _id: 'finished_goods' as any, seq: 0 },
    ])

    // Seed initial manager user for this tenant if provided
    if (payload.initial_username && payload.initial_username.trim()) {
      const cleanUser = payload.initial_username.trim()
      const rawPassword = payload.initial_password?.trim() || 'Admin@123'
      const { hashPassword } = await import('../auth')
      const passHash = await hashPassword(rawPassword)

      await tenantDb.collection('users').insertOne({
        id: 1,
        username: cleanUser,
        display_name: payload.owner_name || cleanName,
        password_hash: passHash,
        role: 'Admin',
        status: 'Active',
        org_slug: rawSlug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      await this.registerUserInDirectory({
        username: cleanUser,
        org_slug: rawSlug,
        database_name: safeDbName,
        role: 'Admin',
        status: 'Active',
      })
    }

    // 2. Register organization in master registry
    await orgsCol.insertOne(newOrg as any)

    return newOrg
  }

  /**
   * Update organization branding, settings, rates, and module visibility
   */
  async updateOrganization(
    slug: string,
    updates: Partial<Organization>
  ): Promise<Organization | null> {
    const masterDb = await this.getMasterDb()
    const orgsCol = masterDb.collection<Organization>('organizations')

    const existing = await orgsCol.findOne({ slug })
    if (!existing) {
      throw new Error(`Organization "${slug}" not found`)
    }

    const updateFields: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name) updateFields.name = updates.name.trim()
    if (updates.owner_name !== undefined) updateFields.owner_name = updates.owner_name.trim()
    if (updates.phone !== undefined) updateFields.phone = updates.phone.trim()
    if (updates.address !== undefined) updateFields.address = updates.address.trim()
    if (updates.gstin !== undefined) updateFields.gstin = updates.gstin.trim()
    if (updates.status) updateFields.status = updates.status

    if (updates.settings) {
      updateFields.settings = {
        ...existing.settings,
        ...updates.settings,
      }
    }

    if (updates.module_visibility) {
      updateFields.module_visibility = {
        ...existing.module_visibility,
        ...updates.module_visibility,
      }
    }

    await orgsCol.updateOne({ slug }, { $set: updateFields })

    // Also update tenant DB's system_settings for branding sync
    try {
      const client = await getMongoClient()
      const tenantDb = client.db(existing.database_name)
      await tenantDb.collection('system_settings').updateOne(
        { type: 'super_admin_settings' },
        {
          $set: {
            company_name: updateFields.name || existing.name,
            owner_name: updateFields.owner_name || existing.owner_name,
            phone: updateFields.phone || existing.phone,
            address: updateFields.address || existing.address,
            modules: updateFields.module_visibility || existing.module_visibility,
            updated_at: new Date().toISOString(),
          },
        },
        { upsert: true }
      )
      // Also sync Google Sheets Webhook URL to tenant DB integration_settings if provided
      if (updateFields.settings?.google_sheets_webhook_url !== undefined) {
        await tenantDb.collection('integration_settings').updateOne(
          { type: 'google_sheets' },
          {
            $set: {
              type: 'google_sheets',
              webhook_url: updateFields.settings.google_sheets_webhook_url.trim(),
              updated_at: new Date().toISOString(),
            },
          },
          { upsert: true }
        )
      }
    } catch (e) {
      console.warn('Failed to sync tenant db settings:', e)
    }

    return await orgsCol.findOne({ slug })
  }

  /**
   * Delete an organization (cannot delete primary RD Jeans)
   */
  async deleteOrganization(slug: string): Promise<boolean> {
    if (slug === DEFAULT_ORG_SLUG) {
      throw new Error('Cannot delete the primary RD Jeans organization')
    }

    const masterDb = await this.getMasterDb()
    const orgsCol = masterDb.collection<Organization>('organizations')

    const org = await orgsCol.findOne({ slug })
    if (!org) return false

    // Optional: Drop the tenant database
    try {
      const client = await getMongoClient()
      await client.db(org.database_name).dropDatabase()
    } catch (e) {
      console.warn('Failed to drop tenant database:', e)
    }

    await orgsCol.deleteOne({ slug })
    return true
  }

  /**
   * Export complete tenant database backup as JSON
   */
  async createTenantBackup(slug: string) {
    const org = await this.getOrganizationBySlug(slug)
    if (!org) {
      throw new Error(`Organization "${slug}" not found`)
    }

    const client = await getMongoClient()
    const tenantDb = client.db(org.database_name)

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
      'factory_balance',
      'counters',
    ]

    const collectionsData: Record<string, any[]> = {}
    let totalRecords = 0

    for (const name of collectionNames) {
      try {
        const docs = await tenantDb.collection(name).find({}).toArray()
        collectionsData[name] = docs.map(({ _id, ...rest }) => rest)
        totalRecords += docs.length
      } catch {
        collectionsData[name] = []
      }
    }

    return {
      metadata: {
        organization_name: org.name,
        organization_slug: org.slug,
        database_name: org.database_name,
        backup_date: new Date().toISOString(),
        version: '2.0.0 (RD Multi-Org Tenant Backup)',
        total_records: totalRecords,
      },
      collections: collectionsData,
    }
  }

  /**
   * Ping tenant database to measure live latency and health
   */
  async pingTenant(slug: string): Promise<{ success: boolean; latency_ms: number; database: string; status: string }> {
    const org = await this.getOrganizationBySlug(slug)
    if (!org) throw new Error(`Organization "${slug}" not found`)

    const client = await getMongoClient()
    const start = Date.now()
    try {
      await client.db(org.database_name).command({ ping: 1 })
      const latency = Date.now() - start
      return {
        success: true,
        latency_ms: latency,
        database: org.database_name,
        status: org.status,
      }
    } catch (err: any) {
      return {
        success: false,
        latency_ms: -1,
        database: org.database_name,
        status: 'Error: ' + err.message,
      }
    }
  }
}

export const organizationsService = new OrganizationsService()
