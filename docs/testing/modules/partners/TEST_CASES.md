# Partner Equity & Treasury Accounts - Formal Test Cases Catalog
**Document ID:** `QA-MOD-PTN-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-PTN-001** | `getAll` | Fetch partners with dynamic equity and cash stats | Returns partners with computed invested, drawings, equity, and net cash handled | High |
| **TC-PTN-002** | `addTransaction` | Record partner capital investment | Transaction logged and synced to cashbook as cash inflow | High |
| **TC-PTN-003** | `addTransaction` | Record partner personal drawing (withdrawal) | Transaction logged and synced to cashbook as cash outflow | High |
| **TC-PTN-004** | `getByName` | Fetch specific partner by name | Returns partner details matching name | High |
| **TC-PTN-005** | `getSummary` | Compute firm-wide partner totals | Aggregates total capital, total drawings, and net equity across all partners | High |

---

## 2. Detailed Test Specifications
### TC-PTN-001: Fetch partners with dynamic equity and cash stats
- **Target Function**: `getAll`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns partners with computed invested, drawings, equity, and net cash handled.

### TC-PTN-002: Record partner capital investment
- **Target Function**: `addTransaction`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Transaction logged and synced to cashbook as cash inflow.

### TC-PTN-003: Record partner personal drawing (withdrawal)
- **Target Function**: `addTransaction`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Transaction logged and synced to cashbook as cash outflow.

### TC-PTN-004: Fetch specific partner by name
- **Target Function**: `getByName`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns partner details matching name.

### TC-PTN-005: Compute firm-wide partner totals
- **Target Function**: `getSummary`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Aggregates total capital, total drawings, and net equity across all partners.

