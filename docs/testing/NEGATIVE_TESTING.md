# RD Jeans Negative Testing & Fault Injection Guide
**Document ID:** `QA-DOC-009-NEGATIVE`  
**System:** RD Jeans Factory Management System  

---

## 1. Principles of Negative Testing

Negative testing verifies that the system gracefully rejects invalid inputs, preserves transactional consistency, prevents security breaches, and maintains data integrity when errors occur.

---

## 2. Mandatory Negative Test Scenarios

### 2.1 Constraint Violations & Invalid Inputs
1. **Duplicate Roll Number**: Attempting to register a roll with an already existing `roll_number`. System must reject with a clean 409 Conflict / Unique violation error.
2. **Cutting Meters Exceeding Available Fabric**: Attempting to log a cutting lot with `meter_used = 120` on a roll with only `100` meters remaining. Must throw validation error and reject insertion.
3. **Invalid Foreign Key References**:
   - Creating an Upad record for non-existent `employee_id`.
   - Logging a cutting lot for non-existent `roll_id`.
   - Assigning finished goods to non-existent `cutting_id`.
4. **Altering Settled Financial Records**:
   - Attempting to update or delete an Upad record that has already been marked `Settled` in a salary payout.
   - Deleting a finalized salary record that is linked to active cashbook ledger entries without an audit reversal.

### 2.2 Security & Authentication Failures
1. **Expired or Malformed JWT Token**: Sending an expired token or tampered signature to protected `/api/*` endpoints. Edge middleware must immediately reject with `401 Unauthorized`.
2. **Missing Authorization Header**: Invoking `/api/employees` without headers. Must reject with `401`.
3. **Incorrect Login Password**: Submitting an incorrect password for `rdjeans123`. Must return `401` with no user session created.
4. **SQL Injection Payloads**: Passing strings like `' OR '1'='1` in search parameters (`employee_name`, `seth_name`, `search`). Parameterized SQL queries must treat input purely as literal strings.

### 2.3 Database Fault Injection & Atomicity
1. **Mid-Transaction Failure Simulation**:
   - In `SalaryService.create()`, simulate a database connection error during the second query (inserting into `cash_book_ledger`).
   - Verify that the first query (`INSERT INTO salaries`) is rolled back completely via `ROLLBACK`.
   - Verify that the database client connection is released in the `finally` block.
