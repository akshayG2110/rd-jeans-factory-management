# Factory Operational Expenses - Mocking & Isolation Strategy
**Document ID:** `QA-MOD-EXP-MOCK`  

---

## 1. Mocking Scope
Mock `getClient` in `lib/db.ts`. Mock expenses table and CashBookService sync.

## 2. Database Adapter Interaction Patterns
For methods executing database queries:
- Intercept `lib/db.ts` exports (`query`, `getClient`, `pool`).
- Ensure mock returns valid rows matching schema for `expenses`.

```typescript
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))
```

## 3. Transaction Sequence Verification
Where applicable:
1. `mockClient.query('BEGIN')`
2. Queries for `expenses`
3. Cross-module queries (e.g. `cash_book_ledger`)
4. `mockClient.query('COMMIT')`
5. `mockClient.release()` in finally block.
