# Cashbook Ledger & Central Treasury - Formal Test Cases Catalog
**Document ID:** `QA-MOD-CSH-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-CSH-001** | `logTransaction` | Log valid cash inflow | Transaction inserted with accurate running balance and reference linkage | High |
| **TC-CSH-002** | `logTransaction` | Log cash outflow with previous balance | Running balance decremented by out_amount accurately | High |
| **TC-CSH-003** | `recalculateBalancesFrom` | Recalculate balances after historical edit | Executes SQL window function updating all downstream running balances | High |
| **TC-CSH-004** | `updateByReference` | Update linked expense outflow amount | Cashbook entry updated and downstream balances recalculated | High |
| **TC-CSH-005** | `deleteByReference` | Delete linked Upad record | Cashbook entry deleted and downstream balances recalculated | High |
| **TC-CSH-006** | `getSummary` | Aggregate totals across date range | Returns total_income, total_out, and net_balance correctly | High |

---

## 2. Detailed Test Specifications
### TC-CSH-001: Log valid cash inflow
- **Target Function**: `logTransaction`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Transaction inserted with accurate running balance and reference linkage.

### TC-CSH-002: Log cash outflow with previous balance
- **Target Function**: `logTransaction`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Running balance decremented by out_amount accurately.

### TC-CSH-003: Recalculate balances after historical edit
- **Target Function**: `recalculateBalancesFrom`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Executes SQL window function updating all downstream running balances.

### TC-CSH-004: Update linked expense outflow amount
- **Target Function**: `updateByReference`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Cashbook entry updated and downstream balances recalculated.

### TC-CSH-005: Delete linked Upad record
- **Target Function**: `deleteByReference`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Cashbook entry deleted and downstream balances recalculated.

### TC-CSH-006: Aggregate totals across date range
- **Target Function**: `getSummary`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns total_income, total_out, and net_balance correctly.

