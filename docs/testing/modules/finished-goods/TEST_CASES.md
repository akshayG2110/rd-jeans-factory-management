# Finished Goods & Dispatch - Formal Test Cases Catalog
**Document ID:** `QA-MOD-FGD-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-FGD-001** | `create` | Create finished goods lot from cutting | Record created with status Cut and initial piece counts | High |
| **TC-FGD-002** | `updateStatus` | Advance lot to Dispatched stage | Status updated to Dispatched with dispatch_date recorded | High |
| **TC-FGD-003** | `getAll` | Filter inventory by Seth and status | Returns matching garment lots | High |
| **TC-FGD-004** | `getSummary` | Aggregate warehouse stock counts | Returns total_cut, in_stitching, ready_stock, and dispatched_count | High |

---

## 2. Detailed Test Specifications
### TC-FGD-001: Create finished goods lot from cutting
- **Target Function**: `create`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Record created with status Cut and initial piece counts.

### TC-FGD-002: Advance lot to Dispatched stage
- **Target Function**: `updateStatus`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Status updated to Dispatched with dispatch_date recorded.

### TC-FGD-003: Filter inventory by Seth and status
- **Target Function**: `getAll`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns matching garment lots.

### TC-FGD-004: Aggregate warehouse stock counts
- **Target Function**: `getSummary`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns total_cut, in_stitching, ready_stock, and dispatched_count.

