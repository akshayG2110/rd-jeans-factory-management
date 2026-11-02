# Reporting & Document Generation Engine - Mocking & Isolation Strategy
**Document ID:** `QA-MOD-REP-MOCK`  

---

## 1. Mocking Scope
Mock `query` in `lib/db.ts`. Mock or verify Buffer output from ExcelJS and jsPDF.

## 2. Database Adapter Interaction Patterns
For methods executing database queries:
- Intercept `lib/db.ts` exports (`query`, `getClient`, `pool`).
- Ensure mock returns valid rows matching schema for `multiple`.

```typescript
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  getClient: vi.fn()
}))
```

## 3. Transaction Sequence Verification
Where applicable:
1. `mockClient.query('BEGIN')`
2. Queries for `multiple`
3. Cross-module queries (e.g. `cash_book_ledger`)
4. `mockClient.query('COMMIT')`
5. `mockClient.release()` in finally block.
