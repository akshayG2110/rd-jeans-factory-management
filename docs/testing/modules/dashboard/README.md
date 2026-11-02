# Factory KPI Metrics & Analytics Module - Testing Specification
**Module ID:** `dashboard`  
**Target Service:** `lib/services/dashboard.ts`  
**Primary Database Table:** `multiple`  
**Risk Rating:** `P3 (Normal)`  

---

## 1. Module Responsibility & Architecture
Executive dashboard aggregator synthesizing live worker counts, active rolls, pieces cut, total Upad, monthly salary obligations, and real-time cash balance.

### Key Business Invariants:
- Metrics must reflect accurate count and sum queries across database tables.
- Cash balance in KPI card must exactly match latest cash_book_ledger running balance.
- Recent activities must return latest 10 cash transactions in reverse chronological order.

### Target Service Methods:
- `getMetrics()`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/dashboard/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/dashboard/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/dashboard/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/dashboard/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/dashboard/COVERAGE.md): Code coverage targets and branch enforcement rules.
