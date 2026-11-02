# RD Jeans Defect Tracking & Bug Report Register
**Document ID:** `QA-REP-006-BUGS`  
**System:** RD Jeans Factory Management System  

---

## 1. Defect Classification Scheme
- **Blocker**: System crash, data corruption, financial ledger drift, authentication bypass.
- **Critical**: Core business process failure (e.g. cutting cannot deduct meters, salary calculation wrong).
- **Major**: Non-critical feature failure (e.g. PDF styling glitch, filter dropdown error).
- **Minor**: Cosmetic or minor documentation mismatch.

---

## 2. Active & Identified Defects Registry

| Defect ID | Severity | Module | Description | Discovery Source | Target Resolution |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **BUG-CUT-001** | Critical | `CuttingService` | When cutting entry exceeds available roll meter, validation error check is not strictly enforced in service before insert. | Discovery Audit | Phase 3 Unit Test & Guard Patch |
| **BUG-REP-001** | Major | `ReportService` | Excel download throws 404 gap if query params are malformed on specific export categories. | Discovery Audit | Phase 3 Unit Test & Guard Patch |
| **BUG-AUTH-001**| Critical | `Middleware` | Unauthenticated direct API cURL invocation without token previously bypassed in certain local conditions. | Discovery Audit | Verified fixed by Edge guard in `middleware.ts` |
