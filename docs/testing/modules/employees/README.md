# Worker & Staff Registry Module - Testing Specification
**Module ID:** `employees`  
**Target Service:** `lib/services/employees.ts`  
**Primary Database Table:** `employees`  
**Risk Rating:** `P2 (Medium)`  

---

## 1. Module Responsibility & Architecture
Factory floor staff registry, worker role classification (Cutting, Stitching, Helpers, Staff), joining dates, and employment status.

### Key Business Invariants:
- employee_name cannot be empty.
- role must belong to designated factory labor tiers.
- Deleting worker must be prevented if active Upad advances or cutting entries are linked.

### Target Service Methods:
- `getAll(search?, role?, status?)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/employees/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/employees/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/employees/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/employees/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/employees/COVERAGE.md): Code coverage targets and branch enforcement rules.
