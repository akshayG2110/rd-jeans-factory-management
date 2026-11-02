# Factory Operational Expenses - Formal Test Cases Catalog
**Document ID:** `QA-MOD-EXP-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-EXP-001** | `create` | Record factory overhead expense | Expense created and cashbook outflow logged atomically | High |
| **TC-EXP-002** | `update` | Update expense category and amount | Expense updated and cashbook entry synchronized | High |
| **TC-EXP-003** | `delete` | Delete expense receipt | Expense deleted and cashbook transaction removed | High |
| **TC-EXP-004** | `getAll` | Filter expenses by category and date range | Returns filtered expense list | High |

---

## 2. Detailed Test Specifications
### TC-EXP-001: Record factory overhead expense
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Expense created and cashbook outflow logged atomically.

### TC-EXP-002: Update expense category and amount
- **Target Function**: `update`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Expense updated and cashbook entry synchronized.

### TC-EXP-003: Delete expense receipt
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Expense deleted and cashbook transaction removed.

### TC-EXP-004: Filter expenses by category and date range
- **Target Function**: `getAll`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns filtered expense list.

