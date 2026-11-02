# Upad (Worker Cash Advances) - Edge Cases & Boundary Values
**Document ID:** `QA-MOD-UPD-EDGE`  

---

## 1. Critical Boundary Scenarios
### Edge Case 1: Worker taking multiple advances in the same week or on the same calendar day.
- **Boundary Type**: Extreme Boundary / Zero
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 2: Advance amount with decimal paise values (e.g. ₹2,500.50).
- **Boundary Type**: Precision / Overflow
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 3: Worker changing roles between Upad issuance and month-end salary settlement.
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.


## 2. Stress & Precision Invariants
- Verify that numeric amounts preserve two decimal places without floating-point drift.
- Ensure transaction isolation prevents race conditions.
