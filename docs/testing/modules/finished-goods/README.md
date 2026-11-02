# Finished Goods & Dispatch Module - Testing Specification
**Module ID:** `finished-goods`  
**Target Service:** `lib/services/finished-goods.ts`  
**Primary Database Table:** `finished_goods`  
**Risk Rating:** `P2 (Medium)`  

---

## 1. Module Responsibility & Architecture
Garment manufacturing lifecycle tracking from cutting table through stitching, washing, packing, and client dispatch.

### Key Business Invariants:
- total_pieces must equal stitching_pieces + finished_pieces + rejected_pieces + dispatched_pieces.
- Status transitions must follow factory pipeline: Cut -> In Stitching -> Washing -> Ready -> Dispatched -> Closed.
- Dispatched pieces cannot exceed finished pieces count.

### Target Service Methods:
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `updateStatus(id, status, dispatchDate)`
- `delete(id)`
- `getSummary()`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/finished-goods/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/finished-goods/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/finished-goods/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/finished-goods/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/finished-goods/COVERAGE.md): Code coverage targets and branch enforcement rules.
