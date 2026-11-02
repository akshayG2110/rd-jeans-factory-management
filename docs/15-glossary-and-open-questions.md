# RD Jeans Factory Management System - Glossary & Open Questions

## 1. Domain & Textile Industry Terminology

| Term | Hindi / Gujarati Colloquialism | Domain Definition in RD Jeans Factory Operations |
| :--- | :--- | :--- |
| **Upad** | ઉપાડ / उघाड़ / पेशगी | A short-term wage advance granted in cash to factory workers before the monthly salary settlement date. Deducted from monthly wages. |
| **Seth** | શેઠ / सेठ | An external textile merchant, clothing brand owner, or job-work client who supplies raw denim rolls to the factory for cutting and stitching. |
| **Roll** | તાકો / રોલ / थान | A large continuous bolt of denim fabric received from textile mills or Seths, measured in running meters (typically 80m to 150m). |
| **Short Number** | શોર્ટ નંબર | A unique merchant tracking number or mill batch code stamped on the fabric roll bundle for identification. |
| **Cutting Lot** | કટિંગ લોટ / लॉट | A distinct production cutting batch where fabric plies are spread on the cutting table and cut according to specific garment patterns and sizes. |
| **Layer / Ply** | થર / लेयर | The number of fabric lengths stacked on top of one another on the cutting table before cutting with an industrial vertical knife. |
| **Pana** | પાના / पना | The usable width of the fabric roll, measured in inches (standard denim pana: 54", 58", or 60"). Dictates pattern marker efficiency. |
| **Average** | એવરેજ | Fabric consumption efficiency per garment unit: $\text{Average} = \frac{\text{Meters Used}}{\text{Pieces Cut}}$ (typical denim jeans average: 1.25m to 1.45m). |
| **Sort Number** | સોર્ટ નંબર | Internal sorting classification assigned to cut piece bundles for sequential garment assembly in stitching lines. |

---

## 2. Technical & Accounting Terminology

| Term | Technical & Architectural Definition |
| :--- | :--- |
| **Cashbook** | Central financial ledger operating like a bank passbook with strictly chronological, dual-entry credit/debit records and real-time running balances. |
| **Monotonic Balance** | A state property where the running balance of row $i$ strictly equals the balance of row $i-1$ plus current inflow minus current outflow. |
| **Dual-Write Synchronization** | An architectural pattern where recording an operational event (e.g. paying salary or buying thread) atomically commits a corresponding ledger entry in the same DB transaction. |
| **Edge Middleware** | Lightweight Next.js request interceptor running before route evaluation to enforce session cookie presence. |
| **Route Handler** | Server-side Next.js HTTP endpoint (`route.ts`) implementing RESTful request handling (`GET`, `POST`, `PUT`, `DELETE`). |

---

## 3. Abbreviations & Acronyms

* **BRD**: Business Requirements Document
* **ERP**: Enterprise Resource Planning
* **DDL**: Data Definition Language (SQL Schema Scripts)
* **JWT**: JSON Web Token (RFC 7519)
* **NFR**: Non-Functional Requirement
* **RBAC**: Role-Based Access Control
* **UAT**: User Acceptance Testing
* **DoD**: Definition of Done

---

## 4. Master Requirement ID Index

| Requirement ID | Module | Title | Priority |
| :--- | :--- | :--- | :---: |
| `REQ-AUTH-001` | Authentication | Credential Validation | Critical |
| `REQ-AUTH-002` | Authentication | Session Persistence & JWT | High |
| `REQ-AUTH-003` | Authentication | Route Interception | Critical |
| `REQ-AUTH-004` | Authentication | Secure Logout | Medium |
| `REQ-AUTH-005` | Authentication | API Route Authorization Guard | Critical (Gap) |
| `REQ-DSH-001` | Dashboard | Real-Time Cash Position | High |
| `REQ-DSH-002` | Dashboard | Today & Monthly Cash Flow | High |
| `REQ-DSH-003` | Dashboard | Operational KPI Aggregation | High |
| `REQ-DSH-004` | Dashboard | Recent Activity Stream | Medium |
| `REQ-DSH-005` | Dashboard | Quick Access Navigation | Medium |
| `REQ-EMP-001` | Employees | Worker Registry & Profiles | High |
| `REQ-EMP-002` | Employees | Role Classification | High |
| `REQ-EMP-003` | Employees | Worker Financial History | High |
| `REQ-EMP-004` | Employees | Inactive Worker Status Toggle | High |
| `REQ-UPD-001` | Upad | Advance Issuance with Metadata | Critical |
| `REQ-UPD-002` | Upad | Atomic Cashbook Outflow Sync | Critical |
| `REQ-UPD-003` | Upad | Modification & Ledger Recalculation | Critical |
| `REQ-UPD-004` | Upad | Monthly Worker Advance Aggregations | High |
| `REQ-SAL-001` | Salary | Monthly Salary Ledger | Critical |
| `REQ-SAL-002` | Salary | Upad Auto-Deduction Warning | Critical |
| `REQ-SAL-003` | Salary | Atomic Cashbook Outflow Sync | Critical |
| `REQ-SAL-004` | Salary | Partial Payout & Remaining Balances | High |
| `REQ-STH-001` | Seths | Client Directory & Profiles | High |
| `REQ-STH-002` | Seths | Client Fabric Roll Allocation | High |
| `REQ-STH-003` | Seths | Seth Job-Work Payment Receipts | Critical |
| `REQ-STH-004` | Seths | Atomic Cashbook Inflow Sync | Critical |
| `REQ-ROL-001` | Rolls | Denim Fabric Roll Inward | Critical |
| `REQ-ROL-002` | Rolls | Meter Balance Tracking | Critical |
| `REQ-ROL-003` | Rolls | Automated Lifecycle Status Machine | Critical |
| `REQ-ROL-004` | Rolls | Unique Roll & Short Numbering | High |
| `REQ-CUT-001` | Cutting | Cutting Lot Registration | Critical |
| `REQ-CUT-002` | Cutting | Atomic Roll Meter Deduction | Critical |
| `REQ-CUT-003` | Cutting | Technical Production Metrics Logging | High |
| `REQ-CUT-004` | Cutting | Over-Consumption Prevention Guard | High (Gap) |
| `REQ-INC-001` | Income | Operational Revenue Logging | Critical |
| `REQ-EXP-001` | Expenses | Categorized Expense Logging | Critical |
| `REQ-INC-002` | Income / Expense | Atomic Cashbook Synchronization | Critical |
| `REQ-CSH-001` | Cashbook | Passbook-Style Chronological Ledger | Critical |
| `REQ-CSH-002` | Cashbook | Monotonic Running Cash Balance | Critical |
| `REQ-CSH-003` | Cashbook | Cascading Forward Recalculation | Critical |
| `REQ-CSH-004` | Cashbook | Multi-Parameter Ledger Filtering | High |
| `REQ-PRT-001` | Partners | Owner Inflow/Outflow Attribution | Critical |
| `REQ-PRT-002` | Partners | Isolated Partner Summary | High |
| `REQ-PRT-003` | Partners | Partner Passbook View | High |
| `REQ-REP-001` | Reports | Multi-Category Reporting | High |
| `REQ-REP-002` | Reports | Structured Date Range Filtering | High |
| `REQ-REP-003` | Reports | Formatted Excel (.xlsx) Export | High (Gap) |
| `REQ-REP-004` | Reports | Printable PDF (.pdf) Document Export | High (Gap) |
| `REQ-REP-005` | Reports | RFC 4180 CSV Data Export | Medium |

---

## 5. Open Strategic & Business Questions for Factory Stakeholders

The following architectural and business policy decisions require final sign-off from factory owners (Rajubhai and Dhruveshbhai):

### Question 1: Piece-Rate Wages vs. Fixed Monthly Salaries
* **Current Implementation**: Workers have fixed monthly salaries in `salaries`.
* **Business Reality**: Most stitching and cutting workers in garment hubs work on a *piece-rate* basis (e.g. ₹18 per pant stitched).
* **Decision Needed**: Should the system introduce a Piece-Rate Module that automatically calculates worker weekly/monthly earnings by multiplying cut/stitched piece quantities by worker piece-rates?

### Question 2: Roll Over-Consumption & Wastage Allowance
* **Current Implementation**: If cutting meters exceed remaining roll meters, the database allows negative balances.
* **Business Reality**: Denim fabric can stretch or shrink during humid monsoon seasons, leading to minor meter variances.
* **Decision Needed**: Should the system strictly block cutting entries exceeding roll balances, or permit a configurable variance threshold (e.g. $\pm 3\%$) with a supervisor approval flag?

### Question 3: Partner Capital Accounting vs. Cash Desk Handling
* **Current Implementation**: Partner balances equal total transactions marked `handled_by = 'Rajubhai'` vs `Dhruveshbhai`.
* **Business Reality**: Paying a factory electricity bill of ₹20,000 out of factory cash is a company expense, not a personal withdrawal by the partner who handed the cash to the meter reader.
* **Decision Needed**: Should we create a formal Double-Entry Partner Capital Account structure that separates **Company Cash in Hand** from **Partner Capital Investment** and **Personal Drawings**?

### Question 4: Multi-User Access Levels on Factory Floor
* **Current Implementation**: Single login (`rdjeans123`) shared across all devices.
* **Business Reality**: The cutting master entering lot plies on a tablet should not be able to view factory cash balances or partner profit withdrawals.
* **Decision Needed**: Shall we activate Role-Based Access Control (RBAC) with 3 tiers: `Owner (SuperAdmin)`, `Accountant`, and `Floor Master (Cutting/Stitching only)`?
