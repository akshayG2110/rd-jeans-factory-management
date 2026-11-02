# RD Jeans Factory Management System - Developer Onboarding Guide

## 1. Welcome & 5-Minute System Overview

Welcome to the **RD Jeans Factory Management System** engineering team!

This application is a full-stack factory operations and financial ERP built for garment and denim manufacturing. It manages:
* **Human Resources & Wages**: Worker directory, salary advances (**Upad**), and monthly salary payouts.
* **Denim Inventory & Production**: Raw denim fabric rolls, cutting lots, piece yields, fabric width (*pana*), and layer metrics.
* **Accounting & General Ledger**: A centralized, passbook-accurate cash ledger (**Cashbook**) recording every penny moving in or out of the factory.
* **Partner Accounts**: Inflow and outflow attribution between factory co-owners (**Rajubhai** and **Dhruveshbhai**).

---

## 2. Codebase Organization & Mental Model

```
d:\Akshay RD jeans/
├── app/                        # Next.js 16 App Router (Pages & API Routes)
│   ├── api/                    # Server-side HTTP Route Handlers
│   │   ├── auth/login/         # POST /api/auth/login
│   │   ├── employees/          # GET / POST /api/employees
│   │   ├── upad/               # Advance payments & summaries
│   │   ├── salary/             # Wage settlements
│   │   ├── rolls/              # Fabric roll tracking
│   │   ├── cutting/            # Cutting table lots
│   │   ├── seths/              # Client profiles & job receipts
│   │   ├── cashbook/           # Central passbook & metrics
│   │   ├── partners/           # Owner attribution summaries
│   │   └── reports/            # Data exports & CSV streaming
│   ├── (modules)/              # Frontend Client Pages
│   │   ├── employees/          # Worker registry UI
│   │   ├── upad/               # Advances UI
│   │   ├── salary/             # Wage payout UI
│   │   ├── rolls/              # Roll inventory UI
│   │   ├── cutting/            # Cutting production UI
│   │   ├── seths/              # Client management UI
│   │   ├── cashbook/           # Passbook view UI
│   │   ├── partners/           # Partner passbook UI
│   │   ├── reports/            # Reporting center UI
│   │   └── login/              # Login screen UI
│   ├── layout.tsx              # Root HTML shell & font providers
│   └── page.tsx                # Main Dashboard UI
│
├── components/                 # Reusable React UI Components
│   ├── dashboard-header.tsx    # App bar with logout button
│   ├── cash-balance-card.tsx   # Dashboard cash liquidity card
│   ├── factory-summary.tsx     # KPI summary cards grid
│   └── recent-activities.tsx   # Top 10 ledger transaction list
│
├── lib/                        # Shared Utilities & Backend Services
│   ├── api.ts                  # Client HTTP wrapper with JWT injection & redirect
│   ├── auth.ts                 # JWT signing, verification & bcrypt hashing
│   ├── db.ts                   # PostgreSQL connection pool (pg.Pool)
│   ├── employee-store.ts       # Client-side state manager & offline fallback
│   ├── dashboard-data.ts       # Module metadata & icon configurations
│   └── services/               # Domain Backend Service Controllers
│       ├── cashbook.ts         # Central ledger & balance recalculation
│       ├── cutting.ts          # Cutting lots & roll meter deduction
│       ├── employees.ts        # Worker queries
│       ├── expenses.ts         # Expense logging & cashbook sync
│       ├── income.ts           # Revenue logging & cashbook sync
│       ├── partners.ts         # Partner transaction queries
│       ├── reports.ts          # Filtered query exports
│       ├── rolls.ts            # Roll inventory queries
│       ├── salary.ts           # Salary transactions & cashbook sync
│       ├── seths.ts            # Seth clients & payments
│       └── upad.ts             # Upad issuance & cashbook sync
│
├── middleware.ts               # Edge request interceptor for page route protection
├── package.json                # Node.js dependencies & build scripts
└── PROJECT_SETUP.md            # Reference setup notes
```

---

## 3. Local Development Setup (Step-by-Step)

### Prerequisites
* **Node.js**: `v20.x` or `v22.x`
* **npm**: `v10.x`
* **PostgreSQL**: `v15.x` or `v16.x` installed locally on port `5432`

### Step 1: Clone and Install Dependencies
```bash
cd "d:\Akshay RD jeans"
npm install
```

### Step 2: Configure Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/rd_jeans_factory
SECRET_KEY=e2b6c9b3d7a8e8f4c0a5d2c8e3b1c6d9a4b8e7c1d3f5a2e9b0c7d6e5f4a3b2c1
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Step 3: Initialize Database Schema
1. Open pgAdmin or `psql`:
   ```bash
   psql -U postgres
   ```
2. Create database:
   ```sql
   CREATE DATABASE rd_jeans_factory;
   ```
3. Execute the complete DDL script provided in [docs/06-database-design.md](file:///d:/Akshay%20RD%20jeans/docs/06-database-design.md).

### Step 4: Run the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser. Log in with the default credentials:
* **Username**: `rdjeans123`
* **Password**: `RD@123`

---

## 4. How the Application Works Internally

### 4.1 The Golden Rule: Dual-Write Ledger Synchronization
Whenever you build or modify a feature that moves money (paying an employee, issuing an advance, recording client payments, or buying supplies):
1. **Never write raw standalone queries without Cashbook**.
2. **Always open an explicit database transaction** using `client = await getClient()` and `await client.query('BEGIN')`.
3. **Execute your primary business insert** (e.g. `salaries`, `upad_records`, `expenses`).
4. **Invoke `CashBookService.logTransaction(..., client)`** passing the active `client`.
5. **Commit cleanly** via `await client.query('COMMIT')` inside a `try ... finally { client.release() }` block.

### 4.2 Tracing a Request End-to-End
Let's trace what happens when an accountant issues an Upad:

```
[Browser: app/upad/page.tsx]
       │
       ▼  User submits form: Worker #3, ₹1,500 Cash, Handled by Rajubhai
[Client Store: lib/employee-store.ts]
       │
       ▼  Calls createUpad() -> apiFetch('/api/upad', { method: 'POST', body: ... })
[HTTP Route Handler: app/api/upad/route.ts]
       │
       ▼  Validates payload and calls UpadService.create(body)
[Service Layer: lib/services/upad.ts]
       │
       ├──> 1. client.query('BEGIN')
       ├──> 2. INSERT INTO upad_records (...) RETURNING *
       ├──> 3. CashBookService.logTransaction(..., client)
       │         └──> Reads latest running balance, computes new balance,
       │              and executes INSERT INTO cash_book_ledger (...)
       ├──> 4. client.query('COMMIT')
       └──> 5. client.release()
       │
       ▼  Returns HTTP 201 Created with JSON envelope
[Browser UI Updates]
       └──> Table appends new Upad; Dashboard Cash Card reflects ₹1,500 decrease.
```

---

## 5. How to Add a New Feature Safely

### Example: Adding a New Operational Expense Category
1. **Update Frontend UI**: Open [app/expense/page.tsx](file:///d:/Akshay%20RD%20jeans/app/expense/page.tsx). Add the new category name to the category dropdown selector.
2. **Update TypeScript Interfaces**: In [lib/employee-store.ts](file:///d:/Akshay%20RD%20jeans/lib/employee-store.ts), add the category to `ExpenseRecord['category']`.
3. **Validate Service Layer**: Inspect [lib/services/expenses.ts](file:///d:/Akshay%20RD%20jeans/lib/services/expenses.ts). Notice that `ExpenseService.create()` accepts arbitrary category strings and passes them directly to `cash_book_ledger`. No database schema alteration is needed because `expense_category` is stored as `VARCHAR`.

---

## 6. Troubleshooting Common Issues

### Issue 1: Database Connection Refused
* **Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:5432` in terminal.
* **Diagnosis**: PostgreSQL server is stopped.
* **Fix**: Open Windows Services (`services.msc`), find `postgresql-x64-15` or `16`, and click **Start**.

### Issue 2: Redirect Loop on Login Page
* **Symptom**: Browser continuously reloads on `/login`.
* **Diagnosis**: Stale or corrupted `rd_user` cookie in browser storage.
* **Fix**: Open DevTools (`F12`), go to **Application** $\rightarrow$ **Cookies**, clear `rd_user`, and clear Local Storage.

### Issue 3: Next.js Route Cache Inconsistency
* **Symptom**: Modified page content is not updating in browser.
* **Fix**: Stop dev server, delete `.next` folder (`Remove-Item -Recurse -Force .next`), and run `npm run dev`.
