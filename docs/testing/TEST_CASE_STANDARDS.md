# RD Jeans Test Case Standards & Quality Architecture
**Document ID:** `QA-DOC-005-TEST-STANDARDS`  
**System:** RD Jeans Factory Management System  
**Standard Version:** 2.0 (Phase 5, 6 & 7 Compliant)  

---

## 1. Test Case Identification Taxonomy

Every formal test case across documentation and code must have a unique identifier:

$$\text{TC}-\langle\text{MODULE}\rangle-\langle\text{CATEGORY}\rangle-\langle\text{SEQUENCE}\rangle$$

### Module Abbreviations:
- `AUTH`: Authentication & Route Guards
- `CSH`: Cashbook Ledger & Window Recalculations
- `CUT`: Cutting Lots & Yield
- `DSH`: Dashboard Aggregations & KPIs
- `EMP`: Employees & Workers Directory
- `EXP`: Factory Expenses
- `FGD`: Finished Goods & Dispatch Pipeline
- `INC`: Factory Incomes & Scrap Sales
- `PTN`: Partners & Capital Equity
- `REP`: Reports & Document Exports (CSV/Excel/PDF)
- `ROL`: Fabric Rolls Inventory
- `SAL`: Salary & Payroll Settlement
- `STH`: Seths & Job-Work Providers
- `UPD`: Upad Advances & Balances

---

## 2. Test Specification & Naming Convention

All test blocks (`it(...)` or `test(...)`) must strictly adhere to the snake_case specification pattern:

$$\text{should\_\langle expected\_behavior\rangle\_when\_\langle condition\rangle}$$

### Compliant Examples:
- ✅ `should_return_error_when_email_is_invalid`
- ✅ `should_execute_sql_window_function_when_start_id_provided`
- ✅ `should_update_roll_to_partially_used_and_create_goods_when_valid_cutting_registered`
- ✅ `should_throw_error_and_rollback_when_meter_used_exceeds_available_balance`
- ✅ `should_revert_settled_upads_and_remove_cashbook_entry_when_salary_deleted`
- ❌ `should update roll` *(Non-compliant: Missing condition, lacks snake_case format)*
- ❌ `test cutting logic` *(Non-compliant: Vague, non-deterministic description)*

---

## 3. Phase 5 Categorical Test Coverage Matrix

Every testable function and domain service must be evaluated across the following six QA test categories:

### A. Positive Testing
- Verify nominal workflows with valid inputs and assert expected return contracts and database mutations.
- *Example:* Registering a valid cutting lot deducts fabric meters and updates status to `'Partially Used'`.

### B. Negative Testing
- Verify invalid inputs, malformed structures, unauthorized operations, and forbidden transitions.
- *Example:* Attempting to register cutting with a non-existent `roll_id` or an unauthenticated token.

### C. Boundary Value Testing
- Validate edge conditions:
  - Numeric limits: 0 meters used, exact roll exhaustion (0 remaining), zero salary payout.
  - String boundaries: empty strings (`''`), whitespace-only values, max-length identifiers.
  - Collections: empty arrays (`[]`), empty objects (`{}`).
  - Type boundaries: `null`, `undefined`, NaN, scientific notation.
  - Date limits: start of month, leap years, epoch zero.

### D. Error & Fault Injection Testing
- Verify proper exception handling, promise rejections, network drop recovery, and transaction rollbacks:
  - Database connection timeouts or drops during multi-statement operations.
  - Foreign key constraint violations.
  - Network fetch failures handled cleanly by client wrappers without crashing UI.

### E. Business Logic & Invariant Testing
- Verify denim manufacturing and factory accounting rules:
  - **O(1) SQL Window Balance Calculation:** `SUM(income_amount - out_amount) OVER (...)` prevents balance drift.
  - **Dual-Entry Synchronization:** Every expense, income, salary, and upad entry mirrors into `cash_book_ledger`.
  - **Upad Deletion Guard:** Workers with unsettled advances cannot be deleted from the database.
  - **Roll Lifecycle Machine:** `Available` $\rightarrow$ `Partially Used` $\rightarrow$ `Completed`.

### F. Regression Testing
- Verify that previous bug fixes remain permanently green across future refactoring passes.
- Regression test suites execute autonomously on every CI push (`npm test:ci`).

---

## 4. Phase 6 Mocking & Isolation Rules

1. **Isolation Guarantee:** Unit tests must never connect to live production or development databases.
2. **Mock Public Boundaries Only:** Never mock internal private methods of the class under test. Only mock external boundaries (`lib/db.ts`, external HTTP APIs, system time).
3. **Realistic Mock Contracts:** Mock database clients must simulate transaction mechanics (`BEGIN`, `COMMIT`, `ROLLBACK`) and accurately mimic PostgreSQL return shapes (`{ rows: [...], rowCount: N }`).
4. **State Cleanup:** Always execute `vi.clearAllMocks()` in `beforeEach()` to eliminate inter-test state contamination.
5. **Integration Testing Demarcation:** Complex PostgreSQL constraints (such as table-level cascades or physical index locks) must be formally designated as integration tests rather than falsely simulated via trivial unit mocks.

---

## 5. Phase 7 Test Quality & Structure (AAA Pattern)

Every test must adhere to the **Arrange-Act-Assert** layout:

```typescript
it('should_calculate_running_balance_and_insert_when_logging_valid_transaction', async () => {
  // 1. Arrange: Setup test inputs, mock responses, and expectations
  const mockQuery = vi.fn().mockResolvedValueOnce({ rows: [{ running_balance: '50000.00' }] })
  const client = { query: mockQuery }

  // 2. Act: Execute the actual public method under test
  const result = await CashBookService.logTransaction(
    '2026-05-10', 'Upad', 'Ramesh Patel', 'Cash', 0, 3000, 'Rajubhai', 'upad', 12, 'Advance', client
  )

  // 3. Assert: Validate return value, side effects, and parameter contracts
  expect(result).toBeDefined()
  expect(result.running_balance).toBe('47000.00')
  expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO cash_book_ledger'), expect.any(Array))
})
```
