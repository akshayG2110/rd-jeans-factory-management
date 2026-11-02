# RD Jeans Performance Testing & Algorithmic Efficiency Guidelines
**Document ID:** `QA-DOC-016-PERFORMANCE`  
**System:** RD Jeans Factory Management System  

---

## 1. Performance Critical Operations

In high-volume factory operations, data sets grow continuously (hundreds of rolls, thousands of cutting entries, tens of thousands of ledger transactions). The following algorithms must maintain tight latency bounds:

---

## 2. Benchmark Standards & Criteria

| Module / Operation | Target Complexity | Acceptable Execution Time | Performance Test Strategy |
| :--- | :---: | :---: | :--- |
| **Cashbook Running Balance Recalculation** (`recalculateBalancesFrom`) | **$O(1)$ DB Trip** (SQL Window Function) | $< 100\text{ ms}$ for 10,000 rows | Benchmark single SQL update utilizing `SUM(...) OVER (...)` rather than $O(N)$ sequential updates |
| **Salary Calculation & Upad Aggregation** | $O(N)$ where $N \le 50$ Upad records | $< 25\text{ ms}$ | Benchmark memory summation and balance settlement |
| **Fabric Meter Deduction & Roll Status** | $O(1)$ query | $< 15\text{ ms}$ | Benchmark single aggregated meter sum query |
| **Excel Report Generation** (`ReportService.exportToExcel`) | Streamed processing | $< 1.5\text{ s}$ for 5,000 rows | Benchmark `exceljs` buffer generation without heap exhaustion |
| **PDF Report Generation** (`ReportService.exportToPDF`) | Paged rendering | $< 2.0\text{ s}$ for 1,000 rows | Benchmark `jspdf-autotable` layout generation |

---

## 3. Memory Leak Prevention

- All unit tests and services must release connection pool clients (`client.release()`).
- Report generation must not retain intermediate raw data arrays in global scope.
