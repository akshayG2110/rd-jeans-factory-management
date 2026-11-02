# Factory Revenue & Incomes Module - Testing Specification
**Module ID:** `income`  
**Target Service:** `lib/services/income.ts`  
**Primary Database Table:** `incomes`  
**Risk Rating:** `P2 (Medium)`  

---

## 1. Module Responsibility & Architecture
Inward money flow tracking (Fabric scrap sales, Seth job-work charges, Machine leasing) and automatic cashbook inflow sync.

### Key Business Invariants:
- Every income logged must atomically create a cashbook inflow entry with reference_module="income".
- Updating income amount must update cashbook inflow and trigger running balance recalculation.
- Deleting income must remove corresponding cashbook record.

### Target Service Methods:
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/income/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/income/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/income/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/income/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/income/COVERAGE.md): Code coverage targets and branch enforcement rules.
