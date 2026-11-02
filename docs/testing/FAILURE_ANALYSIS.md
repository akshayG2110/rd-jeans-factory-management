# RD Jeans Failure Analysis & Root Cause Triage Protocol
**Document ID:** `QA-DOC-012-FAILURE-ANALYSIS`  
**System:** RD Jeans Factory Management System  

---

## 1. Triage Workflow

When an automated test fails during development or in a CI pipeline, follow this 4-step triage procedure:

```mermaid
graph TD
    Fail[Test Failure Detected] --> Step1[1. Classify Failure Type]
    Step1 --> |Assertion Diff| Logic[Legitimate Code Defect / Regression]
    Step1 --> |Mock Mismatch| MockErr[Outdated Mock / Query Signature Drift]
    Step1 --> |Timeout / Unhandled| Crash[Unhandled Promise / Connection Leak]
    
    Logic --> Step2[2. Replicate Locally with Isolated Vitest Run]
    MockErr --> Step2
    Crash --> Step2
    
    Step2 --> Step3[3. Root Cause Investigation in Domain Service]
    Step3 --> Step4[4. Remediation & Verification against Full Suite]
```

---

## 2. Common Failure Archetypes & Fixes

### Archetype 1: Floating Point Comparison Failure
- **Symptom**: `expected 12000.000000000002 to be 12000`.
- **Root Cause**: Binary floating-point arithmetic on currency calculations.
- **Fix**: Parse values with `Number(val.toFixed(2))` or use `expect(val).toBeCloseTo(12000, 2)`.

### Archetype 2: Unreleased Database Client Connection
- **Symptom**: Vitest hangs or outputs `Jest did not exit one second after the test run has completed`.
- **Root Cause**: `client.release()` omitted in the `finally` block of a transactional service method.
- **Fix**: Ensure all `getClient()` calls wrap execution in `try ... finally { client.release() }`.

### Archetype 3: Outdated SQL Query Mock Signature
- **Symptom**: `Expected mock to have been called with SQL query X, but was called with Y`.
- **Root Cause**: A schema migration or query column update changed query syntax without updating the test expectation.
- **Fix**: Update the mock expectation to match the canonical SQL query.
