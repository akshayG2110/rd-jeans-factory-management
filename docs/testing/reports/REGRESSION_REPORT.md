# RD Jeans Automated Regression Test Report
**Document ID:** `QA-REP-004-REGRESSION`  
**System:** RD Jeans Factory Management System  
**Test Runner:** `vitest run`  
**Regression Status:** 🟢 **ALL 141 TESTS PASSING (0 REGRESSIONS DETECTED)**  
**Standard Naming:** `should_<expected_behavior>_when_<condition>`  

---

## 1. Regression Run Summary

| Target Release | Total Regression Cases | Pass Rate % | Regressions Detected | Stability Status |
| :---: | :---: | :---: | :---: | :---: |
| **v0.1.0-qa-baseline** | **141 Test Cases** | **100.0%** | **0** | 🟢 **STABLE** |

---

## 2. Regression Test Suites by Area

### 2.1 Financial Integrity Suite (P0 - High Criticality)
- **Cashbook (`tests/unit/services/cashbook.service.test.ts` - 13 Tests):** Running balance calculation, Money In / Money Out ledger logging, O(1) balance recalculation, multi-criteria queries.
- **Salary (`tests/unit/services/salary.service.test.ts` - 8 Tests):** Net payable logic, Upad deduction settlement, partial payout handling, cashbook sync.
- **Upad (`tests/unit/services/upad.service.test.ts` - 9 Tests):** Cash advance issuance, employee balance tracking, multi-criteria filtering, settled record immutability, cashbook sync.
- **Expenses & Income (`tests/unit/services/expenses.service.test.ts`, `income.service.test.ts` - 12 Tests):** Dual-entry bookkeeping synchronization and atomic database transactions.

### 2.2 Inventory & Manufacturing Suite (P0 - High Criticality)
- **Rolls (`tests/unit/services/rolls.service.test.ts` - 8 Tests):** Fabric roll registration, meters received/used/remaining, unique constraints, short roll numbers.
- **Cutting (`tests/unit/services/cutting.service.test.ts` - 9 Tests):** Cutting lots, meter deduction, average per piece, roll status transition (`Available` $\rightarrow$ `In Progress` $\rightarrow$ `Completed`), roll deletion guards, rollback on failure.
- **Finished Goods (`tests/unit/services/finished-goods.service.test.ts` - 7 Tests):** Inventory lot tracking, dispatch logging, lot size validations, status progression.

### 2.3 Security, Directory & Infrastructure Suite (P1 - Standard Criticality)
- **Auth & Middleware (`tests/unit/auth/auth.test.ts`, `middleware.test.ts` - 20 Tests):** Bcrypt hashing with salt 10, JWT token generation/verification, route guarding, cookie inspection.
- **Employees & Seths (`tests/unit/services/employees.service.test.ts`, `seths.service.test.ts` - 14 Tests):** Worker CRUD, Upad pre-deletion guards, client directory management, payment logging.
- **Partners, Reports & Utilities (`partners.service.test.ts`, `reports.service.test.ts`, `utils.test.ts`, `api.test.ts`, `dashboard.service.test.ts`, `dashboard-data.test.ts` - 41 Tests):** Capital equity calculations, multi-category domain reports, browser token injection, 401 session expiration, INR currency formatting.
