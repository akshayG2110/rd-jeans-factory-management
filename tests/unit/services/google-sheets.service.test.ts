import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleSheetsService } from '@/lib/services/google-sheets'
import * as mongoModule from '@/lib/mongodb'

describe('GoogleSheetsService Unit Tests (All 12 Modules)', () => {
  let mockDb: any
  let mockCollections: Record<string, any>

  beforeEach(() => {
    vi.clearAllMocks()

    mockCollections = {
      integration_settings: {
        findOne: vi.fn().mockResolvedValue(null),
        updateOne: vi.fn().mockResolvedValue({ acknowledged: true })
      },
      employees: {
        countDocuments: vi.fn().mockResolvedValue(5),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, employee_name: 'Ramesh', role: 'Cutter', joining_date: '2026-01-01', status: 'Active' }
            ])
          }),
          toArray: vi.fn().mockResolvedValue([
            { id: 1, employee_name: 'Ramesh', role: 'Cutter', status: 'Active' }
          ])
        })
      },
      upad_records: {
        countDocuments: vi.fn().mockResolvedValue(10),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, date: '2026-02-01', employee_id: 1, amount: 2000, payment_method: 'Cash', status: 'Pending' }
            ])
          })
        })
      },
      seths: {
        countDocuments: vi.fn().mockResolvedValue(3),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, seth_name: 'Mahavir Seth', mobile_number: '9898000000', status: 'Active' }
            ])
          }),
          toArray: vi.fn().mockResolvedValue([
            { id: 1, seth_name: 'Mahavir Seth' }
          ])
        })
      },
      seth_hisabs: {
        countDocuments: vi.fn().mockResolvedValue(4),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              {
                id: 1,
                hisab_number: 'HSB-2026-0001',
                hisab_date: '2026-02-10',
                seth_name: 'Mahavir Seth',
                total_pieces: 150,
                total_meter_used: 200,
                average_consumption: 1.33,
                stitching_rate: 50,
                stitching_amount: 7500,
                total_amount: 8000,
                paid_amount: 3000,
                balance_amount: 5000,
                payment_status: 'Partially Paid'
              }
            ])
          }),
          toArray: vi.fn().mockResolvedValue([])
        })
      },
      cutting_entries: {
        countDocuments: vi.fn().mockResolvedValue(8),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, cutting_date: '2026-02-05', lot_number: 'LOT-01', roll_id: 1, piece_count: 150, meter_used: 200, size: '30-36' }
            ])
          }),
          toArray: vi.fn().mockResolvedValue([])
        })
      },
      finished_goods: {
        countDocuments: vi.fn().mockResolvedValue(8),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, lot_number: 'LOT-01', seth_id: 1, item_name: 'Jeans', size: '32', color_shade: 'Indigo', total_pieces: 150, status: 'Ready' }
            ])
          })
        })
      },
      rolls: {
        countDocuments: vi.fn().mockResolvedValue(6),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, entry_date: '2026-01-10', seth_id: 1, roll_number: 'R-101', fabric_type: 'Denim', received_meter: 500, used_meter: 200, remaining_meter: 300, status: 'Available' }
            ])
          }),
          toArray: vi.fn().mockResolvedValue([])
        })
      },
      partners: {
        countDocuments: vi.fn().mockResolvedValue(2),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, name: 'Partner A', profit_share_percentage: 50, opening_balance: 100000, current_balance: 150000, status: 'Active' }
            ])
          }),
          toArray: vi.fn().mockResolvedValue([])
        })
      },
      partner_transactions: {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      },
      incomes: {
        countDocuments: vi.fn().mockResolvedValue(7),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, income_date: '2026-02-01', income_source: 'Job Work', source_name: 'Mahavir Seth', amount: 5000, payment_method: 'Cash' }
            ])
          })
        })
      },
      expenses: {
        countDocuments: vi.fn().mockResolvedValue(12),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, expense_date: '2026-02-02', expense_category: 'Thread', party_name: 'Thread Traders', amount: 800, payment_method: 'Cash' }
            ])
          })
        })
      },
      cash_book_ledger: {
        countDocuments: vi.fn().mockResolvedValue(25),
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              { id: 1, transaction_date: '2026-02-01', transaction_type: 'Income', name: 'Cash In', income_amount: 5000, out_amount: 0, running_balance: 5000 },
              { id: 2, transaction_date: '2026-02-02', transaction_type: 'Expense', name: 'Thread', income_amount: 0, out_amount: 800, running_balance: 4200 }
            ]),
            limit: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([
                { id: 2, running_balance: 4200 }
              ])
            })
          })
        })
      }
    }

    mockDb = {
      collection: vi.fn((colName: string) => {
        if (!mockCollections[colName]) {
          mockCollections[colName] = {
            find: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
              toArray: vi.fn().mockResolvedValue([])
            }),
            findOne: vi.fn().mockResolvedValue(null),
            insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
            updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
            countDocuments: vi.fn().mockResolvedValue(0)
          }
        }
        return mockCollections[colName]
      })
    }

    vi.spyOn(mongoModule, 'getMongoDb').mockResolvedValue(mockDb as any)
  })

  it('1. should return default settings when none stored and save settings correctly', async () => {
    const settings = await GoogleSheetsService.getSettings()
    expect(settings.webhook_url).toBe('')
    expect(settings.auto_sync_enabled).toBe(true)

    const updated = await GoogleSheetsService.saveSettings({
      webhook_url: 'https://script.google.com/macros/s/test/exec',
      auto_sync_enabled: true
    })
    expect(updated.webhook_url).toBe('https://script.google.com/macros/s/test/exec')
    expect(mockCollections.integration_settings.updateOne).toHaveBeenCalled()
  })

  it('2. should return accurate record counts for all 12 modules in MongoDB', async () => {
    const counts = await GoogleSheetsService.getCounts()
    expect(counts.employees).toBe(5)
    expect(counts.upad).toBe(10)
    expect(counts.seths).toBe(3)
    expect(counts['hisab-seth']).toBe(4)
    expect(counts.cutting).toBe(8)
    expect(counts.inventory).toBe(8)
    expect(counts.rolls).toBe(6)
    expect(counts.partners).toBe(2)
    expect(counts.income).toBe(7)
    expect(counts.expense).toBe(12)
    expect(counts.cashbook).toBe(25)
    expect(counts.reports).toBe(7)
  })

  it('3. should format individual module data with headers and rows', async () => {
    const empData = await GoogleSheetsService.getModuleData('employees')
    expect(empData.sheetName).toBe('Employees')
    expect(empData.headers).toContain('Employee Name')
    expect(empData.rows.length).toBe(1)
    expect(empData.rows[0][1]).toBe('Ramesh')

    const hisabData = await GoogleSheetsService.getModuleData('hisab-seth')
    expect(hisabData.sheetName).toBe('Seth Hisab')
    expect(hisabData.headers).toContain('Hisab Number')
    expect(hisabData.rows.length).toBe(1)
    expect(hisabData.rows[0][0]).toBe('HSB-2026-0001')

    const cashbookData = await GoogleSheetsService.getModuleData('cashbook')
    expect(cashbookData.sheetName).toBe('Cash Book')
    expect(cashbookData.rows.length).toBe(2)
  })

  it('4. should bundle all 12 modules into a dictionary with separate sheet tabs', async () => {
    const factoryData = await GoogleSheetsService.getAllFactoryData()
    const expectedTabs = [
      'Employees',
      'Upad',
      'Seths',
      'Seth Hisab',
      'Cutting',
      'Finished Goods',
      'Rolls',
      'Partners',
      'Income',
      'Expenses',
      'Cash Book',
      'Reports Summary'
    ]

    for (const tab of expectedTabs) {
      expect(factoryData[tab]).toBeDefined()
      expect(factoryData[tab].headers.length).toBeGreaterThan(0)
      expect(Array.isArray(factoryData[tab].rows)).toBe(true)
    }
  })

  it('5. should execute full factory sync to Google Apps Script webhook', async () => {
    mockCollections.integration_settings.findOne.mockResolvedValue({
      type: 'google_sheets',
      webhook_url: 'https://script.google.com/macros/s/test/exec',
      auto_sync_enabled: true
    })

    // Mock fetch for Google Apps Script
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ status: 'success' })
    })
    global.fetch = mockFetch

    const result = await GoogleSheetsService.syncAllFactory()
    expect(result.success).toBe(true)
    expect(result.total_sheets).toBe(12)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/test/exec',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"sync_factory"')
      })
    )
  })
})
