# Cutting Lot Operations & Yield Module - Testing Specification
**Module ID:** `cutting`  
**Target Service:** `lib/services/cutting.ts`  
**Primary Database Table:** `cutting_entries`  
**Risk Rating:** `P0 (Critical)`  

---

## 1. Module Responsibility & Architecture
Precision denim piece-cutting entries, roll meter consumption, layer average calculations, and automatic finished goods inventory generation.

### Key Business Invariants:
- meter_used cannot exceed available remaining meters on the linked roll.
- Roll used_meter and remaining_meter must update atomically on every cutting entry.
- Roll status must automatically transition to "Partially Used" or "Completed" based on remaining meters.
- If piece_count > 0, finished_goods record must be automatically generated.

### Target Service Methods:
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cutting/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cutting/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cutting/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cutting/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cutting/COVERAGE.md): Code coverage targets and branch enforcement rules.
