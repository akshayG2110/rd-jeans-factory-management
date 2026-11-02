# Partner Equity & Treasury Accounts - Edge Cases & Boundary Values
**Document ID:** `QA-MOD-PTN-EDGE`  

---

## 1. Critical Boundary Scenarios
### Edge Case 1: Partner drawings exceeding current equity balance (negative equity state).
- **Boundary Type**: Extreme Boundary / Zero
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 2: Zero opening balance with profit share allocations.
- **Boundary Type**: Precision / Overflow
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 3: Cash handled reconciliation when handled_by has slight case variations.
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.


## 2. Stress & Precision Invariants
- Verify that numeric amounts preserve two decimal places without floating-point drift.
- Ensure transaction isolation prevents race conditions.
