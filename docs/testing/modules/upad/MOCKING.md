# Upad (Worker Cash Advances) - Mocking & Isolation Strategy
**Document ID:** `QA-MOD-UPD-MOCK`  

---

## 1. Mocking Scope
Mock `getClient` and `query` in `lib/db.ts`. Mock worker existence check, upad_records table, and CashBookService sync.

## 2. Database Adapter Interaction Patterns
For methods executing database queries:
- Intercept `lib/db.ts` exports (`query`, `getClient`, `pool`).
- Ensure mock returns valid rows matching schema for `upad_records`.

```typescript
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))
```

## 3. Transaction Sequence Verification
Where applicable:
1. `mockClient.query('BEGIN')`
2. Queries for `upad_records`
3. Cross-module queries (e.g. `cash_book_ledger`)
4. `mockClient.query('COMMIT')`
5. `mockClient.release()` in finally block.
