import { vi } from 'vitest'

export interface MockClient {
  query: ReturnType<typeof vi.fn>
  release: ReturnType<typeof vi.fn>
  calls: Array<{ sql: string; params?: any[] }>
}

/**
 * Creates an isolated mock database client supporting transaction tracking.
 */
export function createMockClient(defaultRows: any[] = []): MockClient {
  const calls: Array<{ sql: string; params?: any[] }> = []

  const queryMock = vi.fn().mockImplementation((text: string, params?: any[]) => {
    calls.push({ sql: text, params })
    return Promise.resolve({ rows: defaultRows, rowCount: defaultRows.length })
  })

  const releaseMock = vi.fn().mockImplementation(() => {
    return Promise.resolve()
  })

  return {
    query: queryMock,
    release: releaseMock,
    calls
  }
}

/**
 * Creates a mock client tailored for BEGIN/COMMIT/ROLLBACK transaction life cycles.
 */
export function createTransactionMockClient(options?: {
  onQuery?: (sql: string, params?: any[]) => any
  shouldFailAt?: (sql: string) => boolean
  failureError?: Error
}) {
  const calls: Array<{ sql: string; params?: any[] }> = []
  let inTransaction = false

  const queryMock = vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
    calls.push({ sql, params })

    if (sql.trim().toUpperCase() === 'BEGIN') {
      inTransaction = true
      return { rows: [], rowCount: 0 }
    }
    if (sql.trim().toUpperCase() === 'COMMIT') {
      inTransaction = false
      return { rows: [], rowCount: 0 }
    }
    if (sql.trim().toUpperCase() === 'ROLLBACK') {
      inTransaction = false
      return { rows: [], rowCount: 0 }
    }

    if (options?.shouldFailAt && options.shouldFailAt(sql)) {
      throw options.failureError || new Error(`Simulated database failure during: ${sql}`)
    }

    if (options?.onQuery) {
      return options.onQuery(sql, params)
    }

    return { rows: [], rowCount: 0 }
  })

  const releaseMock = vi.fn().mockResolvedValue(undefined)

  return {
    query: queryMock,
    release: releaseMock,
    calls,
    isInTransaction: () => inTransaction
  }
}
