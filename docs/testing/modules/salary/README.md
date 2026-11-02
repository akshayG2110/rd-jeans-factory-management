# Salary & Payroll Settlement Module - Testing Specification
**Module ID:** `salary`  
**Target Service:** `lib/services/salary.ts`  
**Primary Database Table:** `salaries`  
**Risk Rating:** `P0 (Critical)`  

---

## 1. Module Responsibility & Architecture
Monthly worker wage calculation, deduction of active Upad cash advances, partial/full wage payouts, and automated cashbook outflow logging.

### Key Business Invariants:
- net_payable must strictly equal salary_amount minus total_upad_deducted.
- remaining_amount must strictly equal net_payable minus paid_amount.
- Settled Upad records must have status transitioned to "Settled" and settled_in_salary_id set to salary.id.
- Every salary disbursement must atomically record an outflow transaction in cash_book_ledger for the paid_amount.

### Target Service Methods:
- `getAll(filters)`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `getEmployeeSummary(employeeId)`

---

## 2. Testing Documentation Directory Index
- [UNIT_TESTS.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/salary/UNIT_TESTS.md): Detailed unit testing scope and test suite specification.
- [TEST_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/salary/TEST_CASES.md): Formal test case catalog with inputs and expected outcomes.
- [EDGE_CASES.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/salary/EDGE_CASES.md): Boundary values, zero/negative inputs, and overflow scenarios.
- [MOCKING.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/salary/MOCKING.md): Database queries, clients, and transactional mock patterns.
- [COVERAGE.md](file:///d:/Akshay%20RD%20jeans/docs/testing/modules/salary/COVERAGE.md): Code coverage targets and branch enforcement rules.
