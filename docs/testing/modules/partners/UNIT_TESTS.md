# Partner Equity & Treasury Accounts - Unit Test Specification
**Document ID:** `QA-MOD-PTN-UNIT`  
**Target Unit File:** `tests/unit/services/partners.service.test.ts`  

---

## 1. Unit Testing Objectives
The unit test suite for `partners` validates pure business logic, calculations, and transactional integrity in isolation from live database connections.

## 2. Methods Under Test
### 2.1 `getAll()`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.2 `getByName(name)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.3 `create(data)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.4 `update(id, data)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.5 `addTransaction(data)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.6 `getSummary()`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.


## 3. Test Lifecycle & Isolation
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as db from '@/lib/db'

describe('Partner Equity & Treasury Accounts Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
})
```
