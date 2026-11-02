# RD Jeans Factory Management System - Testing & QA Documentation Suite
**Document Version:** `2.0.0`  
**Standard:** Enterprise QA Automation & Testing Architecture  
**System:** RD Jeans Factory Management System (Next.js 16 App Router, TypeScript 5.7, PostgreSQL)  

---

## 1. Overview & Purpose

This documentation repository represents the complete testing architecture, quality assurance standards, and verification guidelines for the **RD Jeans Factory Management System**. 

The RD Jeans platform controls high-throughput physical garment manufacturing operations, denim roll raw material inventory, worker wage obligations, weekly cash advances ("Upad"), and multi-owner financial ledgers. Because calculation discrepancies or database race conditions directly produce financial losses or labor disputes, rigorous automated testing is mandatory.

This suite provides exhaustive documentation for:
- Testing strategy, test pyramids, and architectural isolation.
- Unit testing guidelines, mocking strategies, and edge case catalogs.
- Module-by-module test specifications for all 14 core system domains.
- Automated test reporting, defect tracking, and regression policies.

---

## 2. Directory Structure

```
docs/testing/
├── README.md                              # This master index and navigation hub
├── PROJECT_DISCOVERY.md                   # Complete system inspection & baseline audit
├── TESTING_STRATEGY.md                    # Multi-tiered testing philosophy and pyramid
├── TESTING_ARCHITECTURE.md                # Test runner architecture and mocking isolation
├── UNIT_TESTING_GUIDELINES.md             # Developer conventions for authoring unit tests
├── TEST_CASE_STANDARDS.md                 # AAA structure, naming conventions, assertion rules
├── MOCKING_STRATEGY.md                    # Database, JWT, and file generation mocking patterns
├── COVERAGE_POLICY.md                     # Code coverage thresholds (lines, branches, functions)
├── EDGE_CASE_TESTING.md                   # Systematic boundary, zero, and overflow conditions
├── NEGATIVE_TESTING.md                    # Invalid input, constraint violation, and error paths
├── REGRESSION_TESTING.md                  # Regression prevention protocols and baseline suites
├── TEST_EXECUTION_GUIDE.md                # CLI instructions for running tests locally and in CI
├── FAILURE_ANALYSIS.md                    # Root cause triage workflow for broken tests
├── QA_CHECKLIST.md                        # Pre-commit, PR review, and release sign-off checklist
├── AUTOMATION_WORKFLOW.md                 # Continuous integration and automated test pipelines
├── SECURITY_TESTING_GUIDELINES.md         # Auth token, SQL injection, and permission testing
├── PERFORMANCE_TESTING_GUIDELINES.md      # Calculation latency and O(1) balance benchmarks
├── TEST_REPORT_TEMPLATE.md                # Standardized schema for test execution reports
│
├── modules/                               # Module-specific testing documentation
│   ├── README.md                          # Catalog of all 14 application modules
│   ├── auth/                              # Authentication & Session Security
│   ├── cashbook/                          # Central Ledger & Running Balance
│   ├── cutting/                           # Piece-Cutting Lots & Yield Calculation
│   ├── dashboard/                         # KPI Aggregations & Metrics
│   ├── employees/                         # Worker Registry & Wage Profiles
│   ├── expenses/                          # Factory Overheads & Expense Categorization
│   ├── finished-goods/                    # Production Stages & Dispatch Tracking
│   ├── income/                            # Revenue Inflows & Inward Billing
│   ├── partners/                          # Dual-Owner Equity & Cash Handling
│   ├── reports/                           # ExcelJS, jsPDF, and CSV Export Engine
│   ├── rolls/                             # Raw Denim Fabric Roll Inventory
│   ├── salary/                            # Payroll Calculation & Upad Settlement
│   ├── seths/                             # External Clients & Job-Work Tracking
│   └── upad/                              # Cash Advances & Worker Balance
│
├── reports/                               # QA Reports & Execution Baselines
│   ├── README.md                          # Test reports overview
│   ├── UNIT_TEST_REPORT.md                # Unit test execution status
│   ├── COVERAGE_REPORT.md                 # Granular code coverage audit
│   ├── FAILED_TESTS.md                    # Defect register and active failures
│   ├── REGRESSION_REPORT.md               # Regression suite verification status
│   ├── QA_SUMMARY.md                      # Executive QA summary & sign-off
│   └── BUG_REPORTS.md                     # Prioritized bug tracker and remediation
│
└── templates/                             # Reusable testing blueprints
    ├── MODULE_TEST_TEMPLATE.md            # Standard template for module testing specs
    ├── TEST_CASE_TEMPLATE.md              # Template for formal test case documentation
    ├── BUG_REPORT_TEMPLATE.md             # Standardized bug reporting form
    └── QA_REPORT_TEMPLATE.md              # Template for release QA audit reports
```

---

## 3. Core Testing Principles

1. **Deterministic Isolation**: Unit tests must never depend on external databases, live network endpoints, or file system side effects. All database queries through `lib/db.ts` must be mocked deterministically.
2. **Financial Precision**: All calculations dealing with currency, pieces, meters, and percentages must verify decimal precision and avoid floating-point drift.
3. **Audit Trail Immutability**: Business rules mandating that settled Upad records or finalized salaries cannot be modified without audit rollback must be explicitly asserted in negative unit tests.
4. **Zero Flakiness**: Tests must not rely on wall-clock delays or arbitrary timeouts. Time-dependent logic must use deterministic date fixtures.
