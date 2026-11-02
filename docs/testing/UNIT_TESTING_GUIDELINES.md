# RD Jeans Unit Testing Guidelines & Authoring Rules
**Document ID:** `QA-DOC-004-UNIT-GUIDELINES`  
**System:** RD Jeans Factory Management System  

---

## 1. Core Unit Testing Mandates

All unit tests in the RD Jeans repository must adhere to the following principles:

1. **Arrange-Act-Assert (AAA) Pattern**: Every test must clearly delineate three phases:
   - **Arrange**: Set up fixtures, inputs, and mocked database responses.
   - **Act**: Invoke the method under test with defined arguments.
   - **Assert**: Validate return values, side effects, and verify exact queries fired.
2. **Single Behavioral Focus**: Each `it(...)` or `test(...)` block must test exactly one logical condition or invariant.
3. **Deterministic State Reset**: Use `beforeEach(() => { vi.clearAllMocks() })` to prevent state leakage between tests.
4. **No Real Database Access in Unit Tests**: Unit tests must never initiate a real TCP connection to PostgreSQL.
5. **Fast Feedback**: The entire unit testing suite (all 13 services) must execute in under 5 seconds.

---

## 2. Standard Test File Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SalaryService } from '@/lib/services/salary'
import * as db from '@/lib/db'

// Mock the database adapter
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))

describe('SalaryService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create()', () => {
    it('should correctly calculate net_payable as salary_amount minus total_upad_deducted', async () => {
      // 1. Arrange
      const mockClient = {
        query: vi.fn(),
        release: vi.fn()
      }
      vi.mocked(db.getClient).mockResolvedValue(mockClient as any)
      
      // Mock employee lookup & insert responses
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 10, employee_name: 'Ramesh Patel' }] }) // emp check
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            employee_id: 10, 
            salary_amount: 15000, 
            total_upad_deducted: 3000, 
            net_payable: 12000,
            paid_amount: 12000,
            remaining_amount: 0
          }] 
        }) // insert salary
        .mockResolvedValueOnce({ rows: [] }) // cashbook insert
        .mockResolvedValueOnce({ rows: [] }) // COMMIT

      // 2. Act
      const result = await SalaryService.create({
        employee_id: 10,
        salary_month: 5,
        salary_year: 2026,
        salary_amount: 15000,
        total_upad_deducted: 3000,
        paid_amount: 12000,
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        payment_date: '2026-05-31'
      })

      // 3. Assert
      expect(result.net_payable).toBe(12000)
      expect(result.remaining_amount).toBe(0)
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })
  })
})
```

---

## 3. Asynchronous Code & Error Handling Rules

When testing methods that throw errors:
1. Always use `await expect(async () => { ... }).rejects.toThrow(...)` or `rejects.toThrowError('expected message')`.
2. Ensure transactions are properly rolled back:
   ```typescript
   expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
   expect(mockClient.release).toHaveBeenCalled()
   ```
3. Never use empty catch blocks in tests.
