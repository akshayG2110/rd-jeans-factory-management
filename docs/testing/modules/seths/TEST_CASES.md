# Client ("Seth") & Job-Work Management - Formal Test Cases Catalog
**Document ID:** `QA-MOD-STH-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-STH-001** | `create` | Register new client profile | Seth profile created with Active status | High |
| **TC-STH-002** | `addPayment` | Record client job-work payment | Payment recorded in seth_payments and cashbook inflow logged | High |
| **TC-STH-003** | `getAll` | Search clients by business name | Returns matching client list | High |
| **TC-STH-004** | `delete` | Attempt to delete client with active rolls | Rejects with dependency error | High |

---

## 2. Detailed Test Specifications
### TC-STH-001: Register new client profile
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Seth profile created with Active status.

### TC-STH-002: Record client job-work payment
- **Target Function**: `addPayment`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Payment recorded in seth_payments and cashbook inflow logged.

### TC-STH-003: Search clients by business name
- **Target Function**: `getAll`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns matching client list.

### TC-STH-004: Attempt to delete client with active rolls
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Rejects with dependency error.

