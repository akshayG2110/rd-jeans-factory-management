# Upad (Worker Cash Advances) - Formal Test Cases Catalog
**Document ID:** `QA-MOD-UPD-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-UPD-001** | `create` | Issue valid cash advance to active worker | Upad record created with Pending status, cashbook outflow logged | High |
| **TC-UPD-002** | `create` | Attempt to issue advance to non-existent worker | Rejects with employee not found error, rollback executed | High |
| **TC-UPD-003** | `update` | Update amount on Pending Upad record | Upad updated and linked cashbook outflow adjusted with balance recalculation | High |
| **TC-UPD-004** | `update` | Attempt to modify already Settled Upad record | Rejects with 400 Bad Request protecting financial audit integrity | High |
| **TC-UPD-005** | `delete` | Delete Pending Upad record | Upad deleted and linked cashbook transaction removed | High |
| **TC-UPD-006** | `getEmployeeSummary` | Calculate pending vs settled Upad balance | Returns total_taken, total_settled, and pending_balance accurately | High |

---

## 2. Detailed Test Specifications
### TC-UPD-001: Issue valid cash advance to active worker
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Upad record created with Pending status, cashbook outflow logged.

### TC-UPD-002: Attempt to issue advance to non-existent worker
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Rejects with employee not found error, rollback executed.

### TC-UPD-003: Update amount on Pending Upad record
- **Target Function**: `update`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Upad updated and linked cashbook outflow adjusted with balance recalculation.

### TC-UPD-004: Attempt to modify already Settled Upad record
- **Target Function**: `update`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Rejects with 400 Bad Request protecting financial audit integrity.

### TC-UPD-005: Delete Pending Upad record
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Upad deleted and linked cashbook transaction removed.

### TC-UPD-006: Calculate pending vs settled Upad balance
- **Target Function**: `getEmployeeSummary`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns total_taken, total_settled, and pending_balance accurately.

