# Worker & Staff Registry - Formal Test Cases Catalog
**Document ID:** `QA-MOD-EMP-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-EMP-001** | `create` | Register new factory worker | Worker created with Active status and joining date | High |
| **TC-EMP-002** | `getAll` | Filter workers by role and status | Returns filtered list matching role criteria | High |
| **TC-EMP-003** | `getById` | Fetch worker by ID | Returns worker record or null if not found | High |
| **TC-EMP-004** | `update` | Deactivate worker status | Worker status set to Inactive | High |
| **TC-EMP-005** | `delete` | Delete worker with zero history | Worker record removed from database | High |

---

## 2. Detailed Test Specifications
### TC-EMP-001: Register new factory worker
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Worker created with Active status and joining date.

### TC-EMP-002: Filter workers by role and status
- **Target Function**: `getAll`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns filtered list matching role criteria.

### TC-EMP-003: Fetch worker by ID
- **Target Function**: `getById`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns worker record or null if not found.

### TC-EMP-004: Deactivate worker status
- **Target Function**: `update`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Worker status set to Inactive.

### TC-EMP-005: Delete worker with zero history
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Worker record removed from database.

