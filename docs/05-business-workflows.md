# RD Jeans Factory Management System - End-to-End Business Workflows

This document details the primary operational and financial workflows of the RD Jeans Factory. Every workflow traces user triggers, preconditions, validation logic, database mutations, side effects, and terminal states.

---

## 1. Core Workflow Map

```mermaid
graph TD
    subgraph "Fabric & Production Lifecycle"
        W1[Seth Inward: Fabric Rolls] --> W2[Roll Quality & Meter Logging]
        W2 --> W3[Cutting Master Spreads Layers]
        W3 --> W4[Cutting Lot Yield: Pieces & Meter Deduction]
        W4 --> W5[Finished Denim Garment Components]
    end

    subgraph "Labor & Payroll Lifecycle"
        L1[Worker Onboarding & Role Tagging] --> L2[Mid-Month Advance: Upad]
        L2 --> L3[Upad Debited from Factory Cash]
        L3 --> L4[Month-End Wage Assessment]
        L4 --> L5[Net Salary Payout = Base - Upad]
    end

    subgraph "Cashbook & Equity Engine"
        C1[Income / Seth Receipts] --> C0[(Central Cashbook Ledger)]
        C2[Expenses / Material / Overhead] --> C0
        L2 --> C0
        L5 --> C0
        C0 --> P1[Partner Net Tracking: Rajubhai vs Dhruveshbhai]
        C0 --> D1[Real-time Factory Liquidity Dashboard]
    end
```

---

## 2. Workflow 1: Worker Onboarding, Advance (Upad) Issuance & Salary Settlement

### 2.1 Workflow Summary
* **Trigger**: Factory Owner or Accountant.
* **Preconditions**: Worker is employed at the factory; factory cash drawer has sufficient funds.
* **Primary Actors**: Rajubhai or Dhruveshbhai, Factory Accountant, Worker.

### 2.2 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Factory Owner (Rajubhai)
    actor Worker as Stitching Worker
    participant UI as Next.js Client
    participant UpadAPI as `/api/upad`
    participant SalAPI as `/api/salary`
    participant CashLedger as `cash_book_ledger` Table
    participant DB as PostgreSQL

    Worker->>Owner: Requests ₹2,500 advance on 15th of the month
    Owner->>UI: Enters Upad Form: Worker, ₹2,500, Cash, Handled by Rajubhai
    UI->>UpadAPI: POST /api/upad
    UpadAPI->>DB: INSERT INTO upad_records
    UpadAPI->>CashLedger: INSERT INTO cash_book_ledger (out_amount = 2500, handled_by = 'Rajubhai')
    Note over CashLedger: Running Balance recalculated (-₹2,500)
    UpadAPI-->>UI: Upad Logged Successfully

    Note over Owner, Worker: At month-end (30th): Salary Settlement
    Owner->>UI: Open Salary Form for Worker (Base: ₹18,000)
    UI->>UpadAPI: GET /api/upad/employee/[id]/summary?month=06&year=2026
    UpadAPI-->>UI: Total Upads Taken = ₹2,500
    UI-->>Owner: Displays: Base: ₹18,000 | Upad: ₹2,500 | Net Payable: ₹15,500
    Owner->>UI: Confirm Paid Amount: ₹15,500 (Method: Cash, Handled: Rajubhai)
    UI->>SalAPI: POST /api/salary
    SalAPI->>DB: INSERT INTO salaries (salary_amount=18000, paid_amount=15500, remaining_amount=2500)
    SalAPI->>CashLedger: INSERT INTO cash_book_ledger (out_amount = 15500, handled_by = 'Rajubhai')
    Note over CashLedger: Running Balance recalculated (-₹15,500)
    SalAPI-->>UI: Salary Settled
```

### 2.3 Step-by-Step Processing & Business Rules
1. **Upad Recording**:
   * Validates worker exists and is marked `status = 'Active'`.
   * Sets `reference_module = 'Upad'`, `out_amount = amount`.
   * Running cash balance decreases immediately by the advance amount.
2. **Salary Calculation**:
   * Base salary liability is recorded for the specific calendar month and year.
   * `remaining_amount` is calculated: $\text{salary\_amount} - \text{paid\_amount}$.
   * If `paid_amount > 0`, an outflow is logged in the cashbook.

---

## 3. Workflow 2: Fabric Roll Inward, Cutting Lot Production & Inventory Deduction

### 3.1 Workflow Summary
* **Trigger**: Fabric Delivery from Seth / Fabric Mill.
* **Preconditions**: Seth profile registered in system.
* **Primary Actors**: Cutting Floor Master, Factory Accountant.

### 3.2 Processing Flowchart

```mermaid
flowchart TD
    A([Start: Truck Arrives with Denim Rolls]) --> B[Inspect Delivery Challan & Measure Roll Length]
    B --> C[Enter Roll Inward Form in System]
    C --> D{Is Roll No. & Short No. Unique?}
    D -- No --> E[Display Error: Duplicate Roll Number]
    E --> C
    D -- Yes --> F[INSERT INTO rolls: received_meter = X, used_meter = 0, status = 'Available']
    F --> G[Cutting Master Takes Roll to Cutting Table]
    G --> H[Spread Fabric into Multiple Layers / Plies]
    H --> I[Log Cutting Lot Entry: lot_number, roll_id, meter_used, piece_count, size, pana, average]
    I --> J[Atomic Transaction: INSERT INTO cutting_entries]
    J --> K[Re-sum total used meters for roll_id]
    K --> L[Calculate: remaining_meter = received_meter - total_used]
    L --> M{remaining_meter <= 0?}
    M -- Yes --> N[UPDATE rolls SET status = 'Completed']
    M -- No --> O[UPDATE rolls SET status = 'Partially Used']
    N --> P([End: Lot Cut & Ready for Stitching])
    O --> P
```

### 3.3 Success & Failure Paths
* **Success Path**: Cutting entry is logged, `meter_used` is deducted, roll status reflects new availability, and finished piece count increases.
* **Failure Path**: If the database connection drops during cutting lot entry, the `ROLLBACK` directive aborts both the cutting entry insert and the roll status update, maintaining meter integrity.

---

## 4. Workflow 3: Seth Job Order, Commercial Billing & Cash Receipt

### 4.1 Workflow Summary
* **Trigger**: Seth delivers cloth for stitching or settles job-work billing.
* **Primary Actors**: Seth, Co-Owner (Dhruveshbhai).

### 4.2 Sequence of Operations
```mermaid
sequenceDiagram
    autonumber
    actor Seth as Client (Seth)
    actor Owner as Dhruveshbhai
    participant UI as Next.js Client
    participant API as `/api/seths/[id]/payments`
    participant CashLedger as `cash_book_ledger` Table

    Seth->>Owner: Hands over ₹50,000 Cheque / GPay for completed cutting job
    Owner->>UI: Navigates to Seth Profile -> Add Payment
    UI->>API: POST /api/seths/[id]/payments (amount: 50000, method: 'GPay', handled_by: 'Dhruveshbhai')
    API->>API: Verify Seth ID exists
    API->>API: INSERT INTO seth_payments
    API->>CashLedger: CashBookService.logTransaction(income_amount = 50000, handled_by = 'Dhruveshbhai', ref = 'Seth Payment')
    CashLedger-->>API: Running balance updated (+₹50,000)
    API-->>UI: 200 OK + Updated Seth Balance
    UI-->>Owner: Displays payment confirmation and updated factory cash balance
```

---

## 5. Workflow 4: Operational Expense Logging & Running Balance Recalculation

### 5.1 Workflow Summary
* **Trigger**: Cash disbursement for factory rent, electricity bills, thread supplies, machine maintenance, or freight.
* **Primary Actors**: Rajubhai or Dhruveshbhai.

### 5.2 Recalculation On Back-Dated Entry Modification
When an expense entered 5 days ago is corrected (e.g. from ₹4,000 to ₹4,500):

```mermaid
flowchart TD
    A[User Edits Expense from ₹4,000 to ₹4,500] --> B[API: PUT /api/expenses/42]
    B --> C[BEGIN Transaction]
    C --> D[UPDATE expenses SET amount = 4500 WHERE id = 42]
    D --> E[UPDATE cash_book_ledger SET out_amount = 4500 WHERE reference_id = 42]
    E --> F[Invoke recalculateBalancesFrom: startId = 185]
    F --> G[Fetch all ledger rows WHERE id >= 185 ORDER BY id ASC]
    G --> H[Loop through each row: new_bal = prev_bal + income - out]
    H --> I[UPDATE cash_book_ledger SET running_balance = new_bal WHERE id = current_row]
    I --> J[COMMIT Transaction]
    J --> K[Return Updated Ledger to Client]
```

---

## 6. Workflow 5: Period-End Reporting and Document Generation

### 6.1 Workflow Summary
* **Trigger**: Factory Accountant or Owner prepares monthly audit or tax summary.
* **Preconditions**: User specifies report category and date range.

### 6.2 Processing Flow
1. **User Selection**: Selects Report Type (`Cashbook`, `Salary`, `Upad`, `Cutting`, `Rolls`, `Seths`, `Expenses`) and Date Range (`2026-06-01` to `2026-06-30`).
2. **Data Query**: Next.js API queries SQL service with date bounds:
   ```sql
   SELECT * FROM cash_book_ledger 
   WHERE transaction_date >= $1 AND transaction_date <= $2 
   ORDER BY transaction_date DESC, id DESC
   ```
3. **Format Export**:
   * *JSON / CSV*: Route `/api/reports/export?format=csv` converts rows to RFC 4180 CSV with escaped quotes and returns downloadable attachment stream.
   * *Excel / PDF*: Planned enhancement via Node.js libraries (`exceljs`, `@react-pdf/renderer`).

---

## 7. Inconsistent & Incomplete Workflows Identified

1. **Unlinked Upad at Salary Settlement**: If an accountant enters a salary payout without inspecting the Upad summary, the system does not forcibly block the transaction or automatically apply the deduction.
2. **Missing Roll Negative Check**: If cutting meter exceeds remaining roll meter, the system calculates a negative balance without requiring supervisor approval.
3. **Partner Cash Transfer**: Currently, there is no workflow to record cash handoffs between Rajubhai and Dhruveshbhai (e.g. Rajubhai transferring ₹20,000 cash in hand to Dhruveshbhai).
