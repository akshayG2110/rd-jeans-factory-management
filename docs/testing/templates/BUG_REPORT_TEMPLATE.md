# Bug / Defect Report Template
**Template ID:** `QA-TPL-BUG`  

---

### Defect ID: `BUG-[MODULE]-[000]`
**Title:** `[Concise summary of bug, e.g., Historical Cashbook edit fails to recalculate downstream balances]`  
**Severity:** `[Blocker / Critical / Major / Minor]`  
**Priority:** `[P0 / P1 / P2]`  
**Module Affected:** `[e.g., CashBookService]`  
**Reporter:** `[Senior QA Engineer]`  
**Date Logged:** `[YYYY-MM-DD]`  
**Status:** `[Open / In Progress / Verified / Closed]`  

---

#### 1. Description
[Detailed description of observed defect versus expected behavior.]

#### 2. Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

#### 3. Expected vs Actual Behavior
- **Expected:** [What the business logic dictates]
- **Actual:** [What actually happened / error message]

#### 4. Automated Reproduction Test
```typescript
// Link or snippet of failing unit test reproducing this bug
it('should reproduce BUG-[MOD]-[000]', async () => { ... })
```

#### 5. Remediation & Fix Verification
- **Root Cause:** [Technical explanation of the flaw]
- **Fixed In:** [Commit hash / PR link]
- **Regression Test Added:** [Test suite path]
