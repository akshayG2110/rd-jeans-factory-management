# RD Jeans Security Testing & Vulnerability Verification
**Document ID:** `QA-DOC-015-SECURITY`  
**System:** RD Jeans Factory Management System  

---

## 1. Scope of Security Testing

The RD Jeans application processes proprietary financial records, employee wages, and partner profit-sharing ratios. Security tests must continuously evaluate:
1. **Authentication Rigor**: Password hashing standards, salt rounds, brute-force mitigation.
2. **Authorization Guards**: Middleware interception, token expiration, tampering rejection.
3. **Injection Resistance**: Parameterized queries across all database drivers.
4. **Session Leakage**: Secure cookie attributes and header sanitation.

---

## 2. Test Specifications & Assertions

### 2.1 Password Hashing & Salts
- **Mandate**: Passwords must never be stored in plaintext. Passwords must be hashed using `bcrypt` with a minimum salt round of 10.
- **Test Assertion**:
  ```typescript
  it('should hash passwords with bcrypt and never return plaintext', async () => {
    const raw = 'RD@123'
    const hash = await hashPassword(raw)
    expect(hash).not.toBe(raw)
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true)
    expect(await verifyPassword(raw, hash)).toBe(true)
    expect(await verifyPassword('WrongPassword', hash)).toBe(false)
  })
  ```

### 2.2 JWT Verification & Expiration
- **Mandate**: Tokens signed with an invalid key or past their expiration time (30 minutes) must fail verification and return `null`.
- **Test Assertion**: Tampered tokens with altered payloads or forged signatures must be rejected by `verifyToken()`.

### 2.3 SQL Injection Resistance
- **Mandate**: No SQL queries may use raw string concatenation with untrusted user inputs.
- **Test Assertion**: In `EmployeeService.getAll(search)` or `RollService.getAll(search)`, passing `'; DROP TABLE users; --` must be passed strictly as a parameter `$1` to `query(sql, params)`, never concatenated.
