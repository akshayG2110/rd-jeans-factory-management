# RD Jeans Quality Assurance & Release Sign-Off Checklist
**Document ID:** `QA-DOC-013-QA-CHECKLIST`  
**System:** RD Jeans Factory Management System  

---

## 1. Developer Pre-Commit Checklist

Before staging or committing any code:
- [ ] Code compiles without TypeScript errors (`npx tsc --noEmit`).
- [ ] Unit tests for modified services exist and pass (`npm run test:unit`).
- [ ] No hardcoded database credentials or tokens committed.
- [ ] Mock assertions verify query parameters and connection releases.

---

## 2. Pull Request Review Checklist

Prior to merging any pull request:
- [ ] **Coverage Verified**: Branch and line coverage do not regress below 85% / 80%.
- [ ] **Financial Invariants Intact**:
  - [ ] Cashbook running balances update monotonically.
  - [ ] Upad deduction formula ($\text{Net} = \text{Salary} - \text{Upad}$) verified.
  - [ ] Roll meter deductions and state transitions (`Available` $\rightarrow$ `Partially Used` $\rightarrow$ `Completed`) confirmed.
- [ ] **Transaction Atomicity**: All multi-step database mutations use explicit `BEGIN` / `COMMIT` / `ROLLBACK`.
- [ ] **Negative Testing**: Validation error paths, constraint rejections, and unauthorized responses are tested.

---

## 3. Production Deployment Sign-Off Checklist

Before deploying a production build to production servers:
- [ ] Full regression suite passes cleanly (100% green).
- [ ] Database migrations executed and validated against staging database.
- [ ] Default admin seed account (`rdjeans123`) verified with bcrypt hashing.
- [ ] QA Lead sign-off documented in `docs/testing/reports/QA_SUMMARY.md`.
