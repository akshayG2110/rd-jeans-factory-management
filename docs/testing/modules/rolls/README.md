# Denim Roll Inventory Module - Testing Specification
**Module ID:** `rolls`  
**Target Service:** `lib/services/rolls.ts`  
**Primary Database Table:** `rolls`  
**Risk Rating:** `P0 (Critical)`  

---

## 1. Module Responsibility & Architecture
Raw denim fabric roll inward tracking, short numbers, fabric types, client ownership linkage, and meter balance accounting.

### Key Business Invariants:
- roll_number must be globally unique across the system.
- remaining_meter must equal received_meter minus used_meter.
- Initial creation must have used_meter = 0, remaining_meter = received_meter, status = "Available".

### Target Service Methods:
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/rolls/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/rolls/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/rolls/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/rolls/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/rolls/COVERAGE.md): Code coverage targets and branch enforcement rules.
