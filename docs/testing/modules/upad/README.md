# Upad (Worker Cash Advances) Module - Testing Specification
**Module ID:** `upad`  
**Target Service:** `lib/services/upad.ts`  
**Primary Database Table:** `upad_records`  
**Risk Rating:** `P0 (Critical)`  

---

## 1. Module Responsibility & Architecture
Weekly cash advance issuance to factory workers, tracking pending vs settled status, balance aggregation, and cashbook outflow sync.

### Key Business Invariants:
- Creating an Upad record must atomically log an outflow entry in cash_book_ledger with reference_module="upad".
- An Upad record with status="Settled" cannot be modified or deleted without prior salary reversal.
- Employee must exist and have Active status when issuing an advance.

### Target Service Methods:
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `getEmployeeSummary(employeeId)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/upad/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/upad/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/upad/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/upad/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/upad/COVERAGE.md): Code coverage targets and branch enforcement rules.
