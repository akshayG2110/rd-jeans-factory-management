# Salary & Payroll Settlement - Formal Test Cases Catalog
**Document ID:** `QA-MOD-SAL-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-SAL-001** | `create` | Standard full salary payment with zero Upad | Salary record created with net_payable = salary_amount, cashbook logs outflow | High |
| **TC-SAL-002** | `create` | Salary payment with multiple Upad deductions | Upads marked Settled, net_payable deducted correctly, paid_amount logged to cashbook | High |
| **TC-SAL-003** | `create` | Partial salary payment (paid_amount < net_payable) | remaining_amount retains outstanding balance | High |
| **TC-SAL-004** | `create` | Transaction rollback when cashbook insertion fails | ROLLBACK triggered, no salary created, client connection released | High |
| **TC-SAL-005** | `delete` | Revert salary payout | Settled Upads reverted to Pending, cashbook entry deleted, salary deleted | High |
| **TC-SAL-006** | `getEmployeeSummary` | Query historical wage and advance stats | Returns total_earned, total_paid, total_upad_deducted, pending_salary | High |

---

## 2. Detailed Test Specifications
### TC-SAL-001: Standard full salary payment with zero Upad
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Salary record created with net_payable = salary_amount, cashbook logs outflow.

### TC-SAL-002: Salary payment with multiple Upad deductions
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Upads marked Settled, net_payable deducted correctly, paid_amount logged to cashbook.

### TC-SAL-003: Partial salary payment (paid_amount < net_payable)
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: remaining_amount retains outstanding balance.

### TC-SAL-004: Transaction rollback when cashbook insertion fails
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: ROLLBACK triggered, no salary created, client connection released.

### TC-SAL-005: Revert salary payout
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Settled Upads reverted to Pending, cashbook entry deleted, salary deleted.

### TC-SAL-006: Query historical wage and advance stats
- **Target Function**: `getEmployeeSummary`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns total_earned, total_paid, total_upad_deducted, pending_salary.

