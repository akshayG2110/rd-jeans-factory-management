# Test Case Specification Template
**Template ID:** `QA-TPL-TESTCASE`  

---

### Test Case ID: `TC-[MODULE]-[000]`
**Module:** `[e.g., Salary]`  
**Target Function:** `[e.g., SalaryService.create]`  
**Test Priority:** `[P0 / P1 / P2]`  
**Test Type:** `[Unit / Integration / Edge / Negative]`  

---

#### 1. Description
[Clear description of the feature or behavior being verified.]

#### 2. Preconditions
- [Database state / mock setup]
- [Authenticated user context if applicable]

#### 3. Test Inputs
```json
{
  "field1": "value",
  "field2": 1000
}
```

#### 4. Execution Steps
1. Initialize mock database client with specified return rows.
2. Invoke target function with test inputs.
3. Capture returned value or thrown exception.

#### 5. Expected Results
- Return value satisfies: `[condition]`
- Database query calls match: `[query pattern]`
- Transaction committed: `[true / false]`

#### 6. Traceability
- **Business Requirement:** `[REQ-XXX]`
- **Implemented Code:** `[lib/services/xxx.ts]`
