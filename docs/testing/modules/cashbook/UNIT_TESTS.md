# Cashbook Ledger & Central Treasury - Unit Test Specification
**Document ID:** `QA-MOD-CSH-UNIT`  
**Target Unit File:** `tests/unit/services/cashbook.service.test.ts`  

---

## 1. Unit Testing Objectives
The unit test suite for `cashbook` validates pure business logic, calculations, and transactional integrity in isolation from live database connections.

## 2. Methods Under Test
### 2.1 `recalculateBalancesFrom(startId: number, client?: any)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.2 `logTransaction(date, type, name, method, inAmt, outAmt, handledBy, refMod, refId, notes, client, fks)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.3 `updateByReference(refMod, refId, data, client)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.4 `deleteByReference(refMod, refId, client)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.5 `getAll(filters)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.6 `getSummary(dateFrom?, dateTo?, handledBy?)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.

### 2.7 `createManualEntry(data)`
- **Scope**: Verifies algorithmic accuracy, input validation, and expected SQL queries.
- **Mock Dependencies**: `lib/db.ts`
- **Isolation Principle**: Pure unit execution with mocked database client.


## 3. Test Lifecycle & Isolation
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as db from '@/lib/db'

describe('Cashbook Ledger & Central Treasury Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
})
```
