# Factory Operational Expenses Module - Testing Specification
**Module ID:** `expenses`  
**Target Service:** `lib/services/expenses.ts`  
**Primary Database Table:** `expenses`  
**Risk Rating:** `P2 (Medium)`  

---

## 1. Module Responsibility & Architecture
Categorized factory overhead tracking (Rent, Electricity, Machine Maintenance, Transport, Chai/Snacks) and automatic cashbook outflow synchronization.

### Key Business Invariants:
- Every expense logged must atomically create a cashbook outflow entry with reference_module="expense".
- Updating expense amount must update cashbook outflow and trigger running balance recalculation.
- Deleting expense must remove corresponding cashbook record.

### Target Service Methods:
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/expenses/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/expenses/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/expenses/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/expenses/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/expenses/COVERAGE.md): Code coverage targets and branch enforcement rules.
