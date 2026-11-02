# Salary & Payroll Settlement - Edge Cases & Boundary Values
**Document ID:** `QA-MOD-SAL-EDGE`  

---

## 1. Critical Boundary Scenarios
### Edge Case 1: Total Upad advance exceeding monthly base salary (net_payable <= 0).
- **Boundary Type**: Extreme Boundary / Zero
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 2: Zero paid amount (salary finalized but payout deferred to subsequent date).
- **Boundary Type**: Precision / Overflow
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 3: Worker with inactive status attempting salary generation.
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.

### Edge Case 4: Simultaneous settlement of 10+ Upad records in single monthly payout.
- **Boundary Type**: Concurrency / Transition
- **Verification Rule**: Must be asserted in test suite with explicit input fixtures.
- **Expected Behavior**: Safe handling without NaN, data truncation, or crash.


## 2. Stress & Precision Invariants
- Verify that numeric amounts preserve two decimal places without floating-point drift.
- Ensure transaction isolation prevents race conditions.
