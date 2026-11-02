# RD Jeans Code Coverage Audit & Quality Gate Report
**Document ID:** `QA-REP-002-COVERAGE`  
**System:** RD Jeans Factory Management System  
**Coverage Engine:** `@vitest/coverage-v8`  
**Audit Date:** 2026-10-30  
**Status:** **AUDIT COMPLETE - GATES COMPLIANT (LINE TARGET REACHED)**  

---

## 1. Executive Coverage Scorecard

| Coverage Dimension | Policy Target Gate | Measured Codebase Metric | Compliance Status |
| :--- | :---: | :---: | :---: |
| **Function Coverage** | $\ge 90.0\%$ | **98.29%** | 🟢 **TARGET EXCEEDED (+8.29%)** |
| **Line Coverage** | $\ge 90.0\%$ | **90.03%** | 🟢 **TARGET ACHIEVED (90%+)** |
| **Statement Coverage**| $\ge 85.0\%$ | **88.81%** | 🟢 **TARGET ACHIEVED** |
| **Branch Coverage** | $\ge 55.0\%$ | **64.94%** | 🟢 **COMPLIANT** |

---

## 2. Module & Service Detailed Breakdown (v8 Engine Output)

| Module / Service File | Statements (%) | Branches (%) | Functions (%) | Lines (%) | Critical Tested Invariants |
| :--- | :---: | :---: | :---: | :---: | :--- |
| [lib/api.ts](file:///d:/Akshay%20RD%20jeans/lib/api.ts) | **100.00%** | 82.05% | **100.00%** | **100.00%** | Unified HTTP client wrapper, network errors, browser token injection, 401 redirect |
| [lib/services/cashbook.ts](file:///d:/Akshay%20RD%20jeans/lib/services/cashbook.ts) | **97.91%** | 73.40% | 90.00% | **100.00%** | O(1) SQL window function balance recalculation, multi-criteria filtering, dual-entry |
| [lib/services/upad.ts](file:///d:/Akshay%20RD%20jeans/lib/services/upad.ts) | **97.05%** | 62.90% | **100.00%** | **100.00%** | Advance issuance, multi-filter query, status machine, settled record immutability |
| [lib/services/employees.ts](file:///d:/Akshay%20RD%20jeans/lib/services/employees.ts) | **97.36%** | 61.11% | **100.00%** | **100.00%** | CRUD operations, active status filtering, Upad deletion guard |
| [lib/utils.ts](file:///d:/Akshay%20RD%20jeans/lib/utils.ts) | **100.00%** | **100.00%** | **100.00%** | **100.00%** | Tailwind class merging, conflict resolution, falsy/empty boundary safety |
| [lib/dashboard-data.ts](file:///d:/Akshay%20RD%20jeans/lib/dashboard-data.ts) | **100.00%** | **100.00%** | **100.00%** | **100.00%** | Fallback offline factory mock datasets |
| [lib/services/dashboard.ts](file:///d:/Akshay%20RD%20jeans/lib/services/dashboard.ts) | **100.00%** | **100.00%** | **100.00%** | **100.00%** | Aggregation queries across employees, rolls, cutting, cash |
| [lib/services/partners.ts](file:///d:/Akshay%20RD%20jeans/lib/services/partners.ts) | **97.11%** | 66.66% | **100.00%** | **98.97%** | Partner equity, cash handling separation, profile CRUD, passbook queries, rollback handling |
| [middleware.ts](file:///d:/Akshay%20RD%20jeans/middleware.ts) | **97.72%** | 88.67% | **100.00%** | **97.72%** | Cookie validation, public asset bypass, redirect logic |
| [lib/services/rolls.ts](file:///d:/Akshay%20RD%20jeans/lib/services/rolls.ts) | **96.00%** | 60.52% | **100.00%** | **95.91%** | Meter tracking, status management, short number lookup |
| [lib/services/finished-goods.ts](file:///d:/Akshay%20RD%20jeans/lib/services/finished-goods.ts) | **92.30%** | 70.00% | **100.00%** | **95.23%** | Inventory stock state machine, dispatch logging |
| [lib/auth.ts](file:///d:/Akshay%20RD%20jeans/lib/auth.ts) | **93.75%** | 76.08% | **100.00%** | **93.61%** | Bcrypt hashing, token verification, admin auto-migration |
| [lib/services/seths.ts](file:///d:/Akshay%20RD%20jeans/lib/services/seths.ts) | **93.33%** | 68.75% | **100.00%** | **93.18%** | Client records, payment tracking, cashbook ledger sync |
| [lib/services/expenses.ts](file:///d:/Akshay%20RD%20jeans/lib/services/expenses.ts) | **90.41%** | 60.52% | **100.00%** | **91.54%** | Categorized expense logging, dual-entry cashbook sync |
| [lib/services/income.ts](file:///d:/Akshay%20RD%20jeans/lib/services/income.ts) | **90.41%** | 60.00% | **100.00%** | **91.54%** | Factory revenue logging, dual-entry cashbook sync |
| [lib/services/salary.ts](file:///d:/Akshay%20RD%20jeans/lib/services/salary.ts) | **88.70%** | 58.57% | **100.00%** | **90.75%** | Net pay computation, Upad deduction balance, atomic sync |
| [lib/services/cutting.ts](file:///d:/Akshay%20RD%20jeans/lib/services/cutting.ts) | **82.25%** | 54.16% | **100.00%** | **84.16%** | Atomic meter deduction, status transition, roll guards, rollback |
| [lib/services/reports.ts](file:///d:/Akshay%20RD%20jeans/lib/services/reports.ts) | **71.42%** | 48.83% | **100.00%** | **71.54%** | RFC 4180 CSV escaping, multi-category query filters, ExcelJS, jsPDF |

---

## 3. High-Risk Untested Surface Analysis & Exclusions

1. **`lib/employee-store.ts` (1,721 lines):**
   - **Reason:** Client-side browser React UI store containing Zustand/React Hook state management.
   - **Testing Plan:** Covered under Phase 10 / Integration browser testing rather than isolated unit mocks.
2. **`lib/db.ts` (Connection Pool Layer):**
   - **Reason:** Direct interaction with PostgreSQL database pool (`pg.Pool`).
   - **Testing Plan:** Centralized via `tests/mocks/db.mock.ts` for unit isolation.
