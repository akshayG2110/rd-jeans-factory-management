# RD Jeans Regression Testing Policy & Verification Strategy
**Document ID:** `QA-DOC-010-REGRESSION`  
**System:** RD Jeans Factory Management System  

---

## 1. Regression Risk in RD Jeans

Because domain services in RD Jeans are tightly coupled through the central cashbook ledger and roll inventory (e.g., modifying `CuttingService` affects `RollService` status and `FinishedGoodsService` creation), every code change carries regression risk.

---

## 2. Regression Suites & Execution Triggers

| Suite Level | Scope | Trigger | SLA / Max Runtime | Action on Failure |
| :--- | :--- | :--- | :--- | :--- |
| **Smoke Regression** | High-level sanity check (Auth, Cashbook, Roll status) | Pre-commit hook (`git commit`) | < 10 seconds | Block commit |
| **Full Unit Regression** | All 13 domain services, pure calculations, security guards | Every Pull Request & branch push | < 30 seconds | Block merge |
| **Integration Regression** | All API route handlers & schema constraints | Pre-deployment staging | < 2 minutes | Block release |

---

## 3. Regression Prevention Protocol

1. **Defect-Driven Regression Tests**:
   - Whenever a bug is discovered in production or QA (e.g., balance discrepancy on historical edit), a reproduction unit test must be written *first* that fails.
   - The fix is implemented, turning the test green.
   - The test is permanently added to the regression test suite under `tests/unit/services/` to prevent recurrence.
2. **Deterministic Baseline Retention**:
   - The test suite must remain free of time drift, random seeds, or unseeded pseudo-random data.
   - Test data fixtures must be version-controlled in `tests/mocks/fixtures/`.
