# RD Jeans Code Coverage Policy & Quality Gates
**Document ID:** `QA-DOC-007-COVERAGE`  
**System:** RD Jeans Factory Management System  

---

## 1. Quality Gates & Enforcement Thresholds

To maintain architectural integrity, code coverage thresholds are established as strict quality gates. CI/CD pipelines will automatically fail if coverage metrics fall below these baselines:

| Metric | Minimum Required Gate | Target Standard | Measurement Engine |
| :--- | :---: | :---: | :--- |
| **Line Coverage** | **85.0%** | **95.0%** | `@vitest/coverage-v8` |
| **Statement Coverage** | **85.0%** | **95.0%** | `@vitest/coverage-v8` |
| **Branch Coverage** | **80.0%** | **90.0%** | `@vitest/coverage-v8` |
| **Function Coverage** | **85.0%** | **95.0%** | `@vitest/coverage-v8` |

---

## 2. Critical Module Specific Thresholds

Financial and inventory calculation modules have elevated quality gates:

| Module / File | Minimum Line Coverage | Minimum Branch Coverage | Justification |
| :--- | :---: | :---: | :--- |
| `lib/services/cashbook.ts` | **95%** | **90%** | Central monetary ledger; zero calculation error tolerance |
| `lib/services/salary.ts` | **95%** | **90%** | Wage payout calculations and Upad settlements |
| `lib/services/upad.ts` | **95%** | **90%** | Advance payments and status transitions |
| `lib/services/cutting.ts` | **90%** | **85%** | Fabric consumption and roll meter deductions |
| `lib/services/rolls.ts` | **90%** | **85%** | Raw material inventory tracking |
| `lib/auth.ts` & `middleware.ts`| **90%** | **85%** | Security authorization and access control |

---

## 3. Exclusions & Exemption Rules

Coverage is explicitly evaluated on core domain logic. The following items are exempt from coverage reporting:
- Auto-generated Next.js build artifacts (`.next/**`).
- Third-party CSS or UI primitive wrappers (`components/ui/**`).
- Migration runner scripts (`scripts/run-migration.mjs`).
- Test files and test fixtures (`tests/**`).
