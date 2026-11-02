# Factory KPI Metrics & Analytics - Formal Test Cases Catalog
**Document ID:** `QA-MOD-DSH-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-DSH-001** | `getMetrics` | Aggregate factory KPI counters | Returns accurate totals for employees, upad, salary, rolls, pieces, and cash | High |
| **TC-DSH-002** | `getMetrics` | Zero records in database (clean state) | Returns zeroes without NaN or null pointer crashes | High |
| **TC-DSH-003** | `getMetrics` | Verify recent activities feed | Returns top 10 latest transactions ordered by ID desc | High |

---

## 2. Detailed Test Specifications
### TC-DSH-001: Aggregate factory KPI counters
- **Target Function**: `getMetrics`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns accurate totals for employees, upad, salary, rolls, pieces, and cash.

### TC-DSH-002: Zero records in database (clean state)
- **Target Function**: `getMetrics`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns zeroes without NaN or null pointer crashes.

### TC-DSH-003: Verify recent activities feed
- **Target Function**: `getMetrics`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns top 10 latest transactions ordered by ID desc.

