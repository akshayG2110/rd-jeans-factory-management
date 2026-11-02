# RD Jeans Factory Management System - API & Integration Documentation

## 1. Overview & Protocol Standards

The RD Jeans Factory Management System exposes a RESTful JSON API implemented using **Next.js App Router Route Handlers** located under `app/api/*`.

### Global Request & Response Conventions
* **Base URL**: `/api` (or `http://localhost:8000` via client proxy rewrite in `lib/api.ts`)
* **Request Header**: `Content-Type: application/json`
* **Authorization Header**: `Authorization: Bearer <jwt_token>` (Sent by client via `apiFetch()`)
* **Standard Success Envelope**:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
* **Standard Error Envelope**:
  ```json
  {
    "success": false,
    "detail": "Descriptive error message"
  }
  ```

---

## 2. API Endpoints Reference Catalog

### 2.1 Authentication & Health

#### `POST /api/auth/login`
* **Purpose**: Authenticates credentials and returns a signed JWT token and session cookie.
* **Auth**: Public.
* **Request Body**:
  ```json
  {
    "username": "rdjeans123",
    "password": "RD@123"
  }
  ```
* **Responses**:
  * `200 OK`:
    ```json
    {
      "success": true,
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "message": "Login successful",
      "user": { "id": 1, "username": "rdjeans123", "token": "..." }
    }
    ```
  * `400 Bad Request`: Missing username or password.
  * `401 Unauthorized`: Invalid credentials.

#### `GET /api/health`
* **Purpose**: Verifies that the Next.js API server and PostgreSQL connection pool are healthy.
* **Responses**:
  * `200 OK`: `{"status": "healthy", "database": "connected"}`

---

### 2.2 Dashboard

#### `GET /api/dashboard`
* **Purpose**: Returns real-time aggregate KPI metrics for dashboard cards and activity feed.
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "total_employees": 48,
      "total_upad": 62500.0,
      "total_salary": 480000.0,
      "active_rolls": 18,
      "total_pieces_cut": 8750,
      "total_expenses": 615000.0,
      "total_income": 920000.0,
      "cash_summary": {
        "current_cash_balance": 185000.0,
        "today_cash_in": 25000.0,
        "today_cash_out": 12000.0,
        "monthly_cash_in": 420000.0,
        "monthly_cash_out": 235000.0
      },
      "recent_activities": [ ... ]
    }
  }
  ```

---

### 2.3 Employees

#### `GET /api/employees`
* **Query Parameters**:
  * `search` (optional string): Filters by employee name (`ILIKE`).
  * `role` (optional string): Filters by worker role.
  * `status` (optional string): `Active` or `Inactive`.
* **Response `200 OK`**: Returns array of employee objects.

#### `POST /api/employees`
* **Request Body**:
  ```json
  {
    "employee_name": "Ramesh Kumar",
    "role": "Stitching Worker",
    "joining_date": "2026-01-15",
    "status": "Active"
  }
  ```
* **Response `201 Created`**: Returns created employee with ID.

#### `GET /api/employees/[id]`, `PUT /api/employees/[id]`, `DELETE /api/employees/[id]`
* Standard single-resource CRUD operations.

---

### 2.4 Upad (Advances)

#### `GET /api/upad`
* **Query Parameters**: `employee_id`, `date_from`, `date_to`, `payment_method`, `handled_by`.
* **Response `200 OK`**: Array of Upad entries joined with `employee_name`.

#### `POST /api/upad`
* **Request Body**:
  ```json
  {
    "employee_id": 4,
    "date": "2026-06-15",
    "amount": 2000.00,
    "payment_method": "Cash",
    "handled_by": "Rajubhai",
    "notes": "Emergency family expense"
  }
  ```
* **Side Effects**: Automatically logs an outflow transaction in `cash_book_ledger` inside an atomic transaction.
* **Response `201 Created`**: Returns created Upad record and cashbook link.

#### `GET /api/upad/employee/[id]/summary`
* **Query Parameters**: `month` (1-12), `year` (YYYY).
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "employee_id": 4,
    "month": 6,
    "year": 2026,
    "total_upad": 4500.00,
    "records": [ ... ]
  }
  ```

---

### 2.5 Salary

#### `GET /api/salary`
* **Query Parameters**: `employee_id`, `salary_month`, `salary_year`, `payment_method`, `handled_by`, `date_from`, `date_to`.
* **Response `200 OK`**: Array of salary records joined with `employee_name`.

#### `POST /api/salary`
* **Request Body**:
  ```json
  {
    "employee_id": 4,
    "salary_month": 6,
    "salary_year": 2026,
    "salary_amount": 18000.00,
    "paid_amount": 13500.00,
    "payment_method": "Cash",
    "handled_by": "Rajubhai",
    "payment_date": "2026-07-02",
    "notes": "Deducted Rs 4500 June Upad"
  }
  ```
* **Business Logic**: Computes `remaining_amount = salary_amount - paid_amount` ($18,000 - $13,500 = $4,500). If `paid_amount > 0`, writes outflow to `cash_book_ledger`.

---

### 2.6 Denim Rolls

#### `GET /api/rolls`
* **Query Parameters**: `seth_id`, `fabric_type`, `status`, `search`.
* **Response `200 OK`**: Array of rolls joined with `seth_name`.

#### `POST /api/rolls`
* **Request Body**:
  ```json
  {
    "seth_id": 2,
    "entry_date": "2026-06-10",
    "roll_number": "RL-9082",
    "short_number": "SH-401",
    "fabric_type": "Denim 12oz Indigo Stretch",
    "received_meter": 120.50,
    "notes": "Good finish, zero defects"
  }
  ```
* **Response `201 Created`**: Returns roll with `used_meter = 0.00`, `remaining_meter = 120.50`, `status = 'Available'`.

---

### 2.7 Cutting Lots

#### `GET /api/cutting`
* **Query Parameters**: `roll_id`, `size`, `sort_number`, `date_from`, `date_to`, `search`.

#### `POST /api/cutting`
* **Request Body**:
  ```json
  {
    "cutting_date": "2026-06-12",
    "lot_number": "LOT-2026-058",
    "roll_id": 8,
    "meter_used": 60.00,
    "layer_information": "40 layers",
    "piece_count": 45,
    "size": "32",
    "pana": 58.00,
    "average": 1.33,
    "sort_number": "SORT-A1",
    "notes": "Men's slim fit jeans"
  }
  ```
* **Side Effects**: Automatically adds `meter_used` to `rolls.used_meter`, re-computes `remaining_meter`, and transitions roll status.

---

### 2.8 Cashbook

#### `GET /api/cashbook`
* **Query Parameters**: `transaction_type`, `payment_method`, `handled_by`, `date_from`, `date_to`, `search`.
* **Response `200 OK`**: Chronologically sorted passbook rows with `running_balance`.

#### `GET /api/cashbook/summary`
* **Response `200 OK`**: Current cash balance, today cash in/out, monthly cash in/out.

---

### 2.9 Partners

#### `GET /api/partners/summary`
* **Response `200 OK`**: Total income and expenses handled by Rajubhai vs. Dhruveshbhai.

#### `GET /api/partners/all` & `GET /api/partners/[name]`
* Returns ledger entries filtered specifically for a partner.

---

### 2.10 Reporting & Exports

#### `GET /api/reports`
* **Query Parameters**: `category`, `date_from`, `date_to`.
* **Response `200 OK`**: JSON dataset and total record count.

#### `GET /api/reports/export`
* **Query Parameters**: `category`, `date_from`, `date_to`, `format` (`csv` or `json`).
* **Response**: RFC 4180 CSV binary attachment stream when `format=csv`.

#### `GET /api/reports/export/excel`
* **Query Parameters**: `report_type` (or `category`), `date_from`, `date_to`, `employee_id`, `seth_id`, `handled_by`, `expense_category`, `income_source`, `status`, `roll_number`, `lot_number`.
* **Response `200 OK`**: Formatted Microsoft Excel binary stream (`.xlsx`) with custom styled title banner, header row formatting, alternating row colors, auto-fitted column widths, and borders.
* **MIME Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

#### `GET /api/reports/export/pdf`
* **Query Parameters**: `report_type` (or `category`), `date_from`, `date_to`, `employee_id`, `seth_id`, `handled_by`, `expense_category`, `income_source`, `status`, `roll_number`, `lot_number`.
* **Response `200 OK`**: Formatted printable PDF binary stream (`.pdf`) rendered in landscape orientation with navy header banner, metadata badges, styled data grid (`jspdf-autotable`), and page numbering.
* **MIME Type**: `application/pdf`
