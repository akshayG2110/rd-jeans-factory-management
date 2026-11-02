# Denim Roll Inventory - Edge Cases & Boundary Values
**Document ID:** `QA-MOD-ROL-EDGE`  

---

## 1. Critical Boundary Scenarios
### Edge Case 1: Roll inward with decimal meters (e.g. 102.65 meters).
- **Boundary Type**: Extreme Boundary / Zero
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 2: Roll received with zero meters rejected by validation.
- **Boundary Type**: Precision / Overflow
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 3: Long roll numbers or special characters in short numbers (e.g. #SH-102/B).
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.


## 2. Stress & Precision Invariants
- Verify that numeric amounts preserve two decimal places without floating-point drift.
- Ensure transaction isolation prevents race conditions.
