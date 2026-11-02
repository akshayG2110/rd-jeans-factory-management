# RD Jeans Application Modules - Testing Catalog
**Document ID:** `QA-MOD-INDEX`  
**System:** RD Jeans Factory Management System  

---

## Overview

This directory contains the granular, module-by-module testing specifications for the **14 actual application modules** operating within the RD Jeans platform.

Each module directory contains:
- `README.md`: Module architecture, business responsibility, and invariants.
- `UNIT_TESTS.md`: Unit test specification and target functions under test.
- `TEST_CASES.md`: Comprehensive catalog of formal test cases (`TC-[MOD]-XXX`).
- `EDGE_CASES.md`: Boundary conditions, zero/overflow values, and decimal precision checks.
- `MOCKING.md`: Precise database queries, foreign keys, and external adapters to mock.
- `COVERAGE.md`: Code coverage requirements and target thresholds.

---

## The 14 Application Modules

| Module Directory | Target Domain Service | Primary Business Responsibility | Risk Level |
| :--- | :--- | :--- | :---: |
| [auth/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/auth/) | `lib/auth.ts`, `middleware.ts` | JWT tokens, bcrypt password hashing, Edge route protection | P1 |
| [cashbook/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cashbook/) | `lib/services/cashbook.ts` | Central financial ledger, running balance window calculation | P0 |
| [cutting/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/cutting/) | `lib/services/cutting.ts` | Fabric cutting lots, layer yields, roll meter deduction | P0 |
| [dashboard/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/dashboard/) | `lib/services/dashboard.ts` | Real-time factory KPI aggregation and activity feeds | P3 |
| [employees/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/employees/) | `lib/services/employees.ts` | Worker registry, roles, joining dates, active status | P2 |
| [expenses/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/expenses/) | `lib/services/expenses.ts` | Operational expenditures and cashbook outflow sync | P2 |
| [finished-goods/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/finished-goods/) | `lib/services/finished-goods.ts` | Production lifecycle (Cut $\rightarrow$ Stitching $\rightarrow$ Dispatched) | P2 |
| [income/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/income/) | `lib/services/income.ts` | Revenue inflows and cashbook inflow sync | P2 |
| [partners/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/partners/) | `lib/services/partners.ts` | Dual-owner capital equity (Rajubhai vs Dhruveshbhai) | P1 |
| [reports/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/reports/) | `lib/services/reports.ts` | Multi-format exports (CSV RFC 4180, ExcelJS, jsPDF) | P2 |
| [rolls/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/rolls/) | `lib/services/rolls.ts` | Denim fabric roll inventory and meter tracking | P0 |
| [salary/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/salary/) | `lib/services/salary.ts` | Monthly payroll calculation, Upad deduction, cash payout | P0 |
| [seths/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/seths/) | `lib/services/seths.ts` | External clients/job-workers and roll inventory linkage | P2 |
| [upad/](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/upad/) | `lib/services/upad.ts` | Worker cash advances, balance tracking, salary settlement | P0 |
