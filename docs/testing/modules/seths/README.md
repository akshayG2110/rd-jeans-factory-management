# Client ("Seth") & Job-Work Management Module - Testing Specification
**Module ID:** `seths`  
**Target Service:** `lib/services/seths.ts`  
**Primary Database Table:** `seths`  
**Risk Rating:** `P2 (Medium)`  

---

## 1. Module Responsibility & Architecture
External denim merchant and job-work client registry, roll segregation per client, and job-work payment tracking.

### Key Business Invariants:
- seth_name must be unique in the system.
- Client cannot be deleted if rolls or payments are associated with their profile.
- Payment from Seth must log to seth_payments and sync to cashbook ledger.

### Target Service Methods:
- `getAll(search?, status?)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `addPayment(sethId, data)`
- `getPayments(sethId)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/seths/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/seths/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/seths/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/seths/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/seths/COVERAGE.md): Code coverage targets and branch enforcement rules.
