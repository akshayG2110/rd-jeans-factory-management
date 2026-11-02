# Cashbook Ledger & Central Treasury Module - Testing Specification
**Module ID:** `cashbook`  
**Target Service:** `lib/services/cashbook.ts`  
**Primary Database Table:** `cash_book_ledger`  
**Risk Rating:** `P0 (Critical)`  

---

## 1. Module Responsibility & Architecture
Central transactional ledger tracking factory cash drawer movements, running balance window calculation, and dual-entry synchronization with external modules.

### Key Business Invariants:
- Running balance for transaction i must equal running balance of (i-1) plus income_amount minus out_amount.
- Historical updates or deletions must cascade running balance recalculation across all subsequent entries.
- Foreign keys (upad_id, salary_id, seth_payment_id, income_id, expense_id, partner_id) must be accurately linked.

### Target Service Methods:
- `recalculateBalancesFrom(startId: number, client?: any)`
- `logTransaction(date, type, name, method, inAmt, outAmt, handledBy, refMod, refId, notes, client, fks)`
- `updateByReference(refMod, refId, data, client)`
- `deleteByReference(refMod, refId, client)`
- `getAll(filters)`
- `getSummary(dateFrom?, dateTo?, handledBy?)`
- `createManualEntry(data)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cashbook/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cashbook/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cashbook/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cashbook/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cashbook/COVERAGE.md): Code coverage targets and branch enforcement rules.
