# Denim Roll Inventory - Formal Test Cases Catalog
**Document ID:** `QA-MOD-ROL-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-ROL-001** | `create` | Register valid denim fabric roll | Roll created with status Available and remaining_meter = received_meter | High |
| **TC-ROL-002** | `create` | Attempt duplicate roll_number entry | Rejects with unique constraint violation | High |
| **TC-ROL-003** | `getById` | Fetch roll details with linked Seth name | Returns roll details joined with seth_name | High |
| **TC-ROL-004** | `update` | Update roll fabric type or notes | Roll metadata updated successfully | High |
| **TC-ROL-005** | `delete` | Attempt deleting roll with existing cutting entries | Rejects with foreign key dependency error | High |
| **TC-ROL-006** | `getAll` | Filter rolls by status and fabric type | Returns filtered list matching query parameters | High |

---

## 2. Detailed Test Specifications
### TC-ROL-001: Register valid denim fabric roll
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Roll created with status Available and remaining_meter = received_meter.

### TC-ROL-002: Attempt duplicate roll_number entry
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Rejects with unique constraint violation.

### TC-ROL-003: Fetch roll details with linked Seth name
- **Target Function**: `getById`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns roll details joined with seth_name.

### TC-ROL-004: Update roll fabric type or notes
- **Target Function**: `update`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Roll metadata updated successfully.

### TC-ROL-005: Attempt deleting roll with existing cutting entries
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Rejects with foreign key dependency error.

### TC-ROL-006: Filter rolls by status and fabric type
- **Target Function**: `getAll`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns filtered list matching query parameters.

