# Cashbook Ledger & Central Treasury - Edge Cases & Boundary Values
**Document ID:** `QA-MOD-CSH-EDGE`  

---

## 1. Critical Boundary Scenarios
### Edge Case 1: Running balance dropping below zero (negative cash balance when expenses exceed cash on hand).
- **Boundary Type**: Extreme Boundary / Zero
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 2: High-value transactions (amounts exceeding ₹1,00,00,000 without integer overflow).
- **Boundary Type**: Precision / Overflow
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 3: Zero-amount transactions (income = 0 and out = 0) maintaining exact balance.
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 4: Two transactions occurring with identical timestamps preserving deterministic sorting by ID.
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.


## 2. Stress & Precision Invariants
- Verify that numeric amounts preserve two decimal places without floating-point drift.
- Ensure transaction isolation prevents race conditions.
