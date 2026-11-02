# Cutting Lot Operations & Yield - Formal Test Cases Catalog
**Document ID:** `QA-MOD-CUT-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-CUT-001** | `create` | Log cutting lot consuming partial roll meters | Entry created, roll used_meter updated, status becomes Partially Used | High |
| **TC-CUT-002** | `create` | Log cutting lot consuming remaining roll meters exactly | Roll remaining_meter becomes 0, status transitions to Completed | High |
| **TC-CUT-003** | `create` | Attempt cutting exceeding available roll meters | Rejects with validation error, roll unchanged | High |
| **TC-CUT-004** | `create` | Auto-create finished goods entry for piece count | Finished goods record created with lot_number and total_pieces | High |
| **TC-CUT-005** | `update` | Modify meter_used on existing lot | Lot updated and roll meters/status recalculated | High |
| **TC-CUT-006** | `delete` | Delete cutting lot | Lot removed, roll meter restored, status reverted to Available if 0 used | High |

---

## 2. Detailed Test Specifications
### TC-CUT-001: Log cutting lot consuming partial roll meters
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Entry created, roll used_meter updated, status becomes Partially Used.

### TC-CUT-002: Log cutting lot consuming remaining roll meters exactly
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Roll remaining_meter becomes 0, status transitions to Completed.

### TC-CUT-003: Attempt cutting exceeding available roll meters
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Rejects with validation error, roll unchanged.

### TC-CUT-004: Auto-create finished goods entry for piece count
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Finished goods record created with lot_number and total_pieces.

### TC-CUT-005: Modify meter_used on existing lot
- **Target Function**: `update`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Lot updated and roll meters/status recalculated.

### TC-CUT-006: Delete cutting lot
- **Target Function**: `delete`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Lot removed, roll meter restored, status reverted to Available if 0 used.

