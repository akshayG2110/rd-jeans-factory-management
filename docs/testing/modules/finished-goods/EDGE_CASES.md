# Finished Goods & Dispatch - Edge Cases & Boundary Values
**Document ID:** `QA-MOD-FGD-EDGE`  

---

## 1. Critical Boundary Scenarios
### Edge Case 1: Zero piece count lot handling.
- **Boundary Type**: Extreme Boundary / Zero
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 2: Rejection rate exceeding 50% of cut pieces.
- **Boundary Type**: Precision / Overflow
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 3: Dispatching partial lots over multiple shipments.
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.


## 2. Stress & Precision Invariants
- Verify that numeric amounts preserve two decimal places without floating-point drift.
- Ensure transaction isolation prevents race conditions.
