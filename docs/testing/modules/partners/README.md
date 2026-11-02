# Partner Equity & Treasury Accounts Module - Testing Specification
**Module ID:** `partners`  
**Target Service:** `lib/services/partners.ts`  
**Primary Database Table:** `partners`  
**Risk Rating:** `P1 (High)`  

---

## 1. Module Responsibility & Architecture
Dual-owner equity passbooks (Rajubhai vs Dhruveshbhai), tracking capital investments, personal drawings, and operational cash handling balance.

### Key Business Invariants:
- equity_balance = opening_balance + total_invested + total_profit_share - total_drawings.
- net_cash_handled = cash_in_handled - cash_out_handled from cashbook ledger entries.
- Partner capital movements must update partner equity and sync to cashbook.

### Target Service Methods:
- `getAll()`
- `getByName(name)`
- `create(data)`
- `update(id, data)`
- `addTransaction(data)`
- `getSummary()`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/partners/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/partners/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/partners/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/partners/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/partners/COVERAGE.md): Code coverage targets and branch enforcement rules.
