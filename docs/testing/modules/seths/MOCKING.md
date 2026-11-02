# Client ("Seth") & Job-Work Management - Mocking & Isolation Strategy
**Document ID:** `QA-MOD-STH-MOCK`  

---

## 1. Mocking Scope
Mock `query` and `getClient` in `lib/db.ts` for seths and seth_payments.

## 2. Database Adapter Interaction Patterns
For methods executing database queries:
- Intercept `lib/db.ts` exports (`query`, `getClient`, `pool`).
- Ensure mock returns valid rows matching schema for `seths`.

```typescript
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))
```

## 3. Transaction Sequence Verification
Where applicable:
1. `mockClient.query('BEGIN')`
2. Queries for `seths`
3. Cross-module queries (e.g. `cash_book_ledger`)
4. `mockClient.query('COMMIT')`
5. `mockClient.release()` in finally block.
