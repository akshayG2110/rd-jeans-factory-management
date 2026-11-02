# Authentication & Session Security - Formal Test Cases Catalog
**Document ID:** `QA-MOD-AUTH-CASES`  

---

## 1. Test Case Matrix

| Test ID | Method | Scenario | Expected Outcome | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-001** | `hashPassword` | Hash clear-text password with bcrypt | Returns standard bcrypt hash starting with $2a$ or $2b$ | High |
| **TC-AUTH-002** | `verifyPassword` | Verify correct password against hash | Returns true for valid password, false for incorrect password | High |
| **TC-AUTH-003** | `generateToken` | Generate JWT with username and ID payload | Returns valid signed JWT string containing claims | High |
| **TC-AUTH-004** | `verifyToken` | Verify valid and tampered tokens | Returns decoded payload for valid token, null for tampered token | High |
| **TC-AUTH-005** | `getAuthenticatedUser` | Extract user from injected headers or cookie | Returns user identity object with id and username | High |
| **TC-AUTH-006** | `ensureDefaultUser` | Seed default admin if user table empty | Inserts rdjeans123 with bcrypt hash if not present | High |

---

## 2. Detailed Test Specifications
### TC-AUTH-001: Hash clear-text password with bcrypt
- **Target Function**: `hashPassword`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns standard bcrypt hash starting with $2a$ or $2b$.

### TC-AUTH-002: Verify correct password against hash
- **Target Function**: `verifyPassword`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns true for valid password, false for incorrect password.

### TC-AUTH-003: Generate JWT with username and ID payload
- **Target Function**: `generateToken`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns valid signed JWT string containing claims.

### TC-AUTH-004: Verify valid and tampered tokens
- **Target Function**: `verifyToken`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns decoded payload for valid token, null for tampered token.

### TC-AUTH-005: Extract user from injected headers or cookie
- **Target Function**: `getAuthenticatedUser`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Returns user identity object with id and username.

### TC-AUTH-006: Seed default admin if user table empty
- **Target Function**: `ensureDefaultUser`
- **Preconditions**: Mock client configured with matching database records.
- **Execution**: Invoke function with scenario parameters.
- **Expected Result**: Inserts rdjeans123 with bcrypt hash if not present.

