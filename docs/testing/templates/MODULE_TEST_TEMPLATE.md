# Module Test Specification Template: [MODULE_NAME]
**Module Name:** `[e.g., cashbook]`  
**Target Service:** `[e.g., lib/services/cashbook.ts]`  
**Associated Endpoints:** `[e.g., /api/cashbook, /api/cashbook/summary]`  

---

## 1. Module Overview & Scope
[Brief description of what this module does in the RD Jeans system, its business invariants, and financial/operational dependencies.]

---

## 2. Test Strategy for this Module
- **Unit Test File**: `tests/unit/services/[module_name].service.test.ts`
- **Mock Dependencies**: `lib/db.ts`
- **Key Invariants**:
  1. [Invariant 1]
  2. [Invariant 2]

---

## 3. Test Cases Catalog

| Test ID | Method | Scenario | Expected Outcome |
| :--- | :--- | :--- | :--- |
| `TC-[MOD]-001` | `[method]` | [Valid input scenario] | [Expected success outcome] |
| `TC-[MOD]-002` | `[method]` | [Boundary / Edge condition] | [Expected boundary outcome] |
| `TC-[MOD]-003` | `[method]` | [Invalid input / Constraint error] | [Expected error / rollback] |

---

## 4. Edge Cases & Boundary Values
- [Boundary 1]
- [Boundary 2]

---

## 5. Mocking Requirements
[Specify queries and tables to mock for this module.]
