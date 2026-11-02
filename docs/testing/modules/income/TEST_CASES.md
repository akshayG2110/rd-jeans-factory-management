# Factory Revenue & Incomes - Formal Test Cases Catalog
**Document ID:** `QA-MOD-INC-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-INC-001** | `create` | Record scrap fabric revenue | Income created and cashbook inflow logged atomically | High |
| **TC-INC-002** | `update` | Update income amount | Income updated and cashbook entry synchronized | High |
| **TC-INC-003** | `delete` | Delete income record | Income deleted and cashbook transaction removed | High |
| **TC-INC-004** | `getAll` | Filter incomes by source and date range | Returns filtered income list | High |

---

## 2. Detailed Test Specifications
### TC-INC-001: Record scrap fabric revenue
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Income created and cashbook inflow logged atomically.

### TC-INC-002: Update income amount
- **Target Function**: `update`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Income updated and cashbook entry synchronized.

### TC-INC-003: Delete income record
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Income deleted and cashbook transaction removed.

### TC-INC-004: Filter incomes by source and date range
- **Target Function**: `getAll`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns filtered income list.

