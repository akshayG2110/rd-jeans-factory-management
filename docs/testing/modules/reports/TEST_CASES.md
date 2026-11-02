# Reporting & Document Generation Engine - Formal Test Cases Catalog
**Document ID:** `QA-MOD-REP-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-REP-001** | `exportData` | Query cashbook category data with date filter | Returns formatted array of ledger transaction rows | High |
| **TC-REP-002** | `exportToCSV` | Generate CSV string from transaction rows | Returns valid RFC 4180 CSV with headers and escaped commas | High |
| **TC-REP-003** | `exportToExcel` | Generate Excel XLSX workbook buffer | Returns non-empty Buffer containing styled worksheet | High |
| **TC-REP-004** | `exportToPDF` | Generate PDF binary document | Returns non-empty Buffer containing PDF document structure | High |
| **TC-REP-005** | `exportData` | Unknown report category passed | Defaults safely to cashbook or returns empty list | High |

---

## 2. Detailed Test Specifications
### TC-REP-001: Query cashbook category data with date filter
- **Target Function**: `exportData`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns formatted array of ledger transaction rows.

### TC-REP-002: Generate CSV string from transaction rows
- **Target Function**: `exportToCSV`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns valid RFC 4180 CSV with headers and escaped commas.

### TC-REP-003: Generate Excel XLSX workbook buffer
- **Target Function**: `exportToExcel`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns non-empty Buffer containing styled worksheet.

### TC-REP-004: Generate PDF binary document
- **Target Function**: `exportToPDF`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns non-empty Buffer containing PDF document structure.

### TC-REP-005: Unknown report category passed
- **Target Function**: `exportData`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Defaults safely to cashbook or returns empty list.

