# RD Jeans Test Execution Guide & CLI Commands
**Document ID:** `QA-DOC-011-EXECUTION-GUIDE`  
**System:** RD Jeans Factory Management System  

---

## 1. Quick Start Commands

Once Vitest testing infrastructure is initialized, the following npm scripts execute tests across various modes:

```bash
# Run all unit tests once in terminal
npm run test:unit

# Run all unit tests in interactive watch mode (during development)
npm run test:watch

# Run unit tests and generate code coverage report
npm run test:coverage

# Run specific module test suite (e.g. CashBookService)
npx vitest run tests/unit/services/cashbook.service.test.ts

# Run tests matching a specific test name pattern
npx vitest run -t "recalculateBalancesFrom"

# Run integration tests against database schema
npm run test:integration

# Run legacy integration & E2E audit scripts (requires running Next.js server on port 3000)
npm run test
npm run test:audit
```

---

## 2. Environment Configuration for Test Execution

Unit tests use Node.js test environment with mocked database connections and require no external database credentials.

However, for integration and E2E runs against PostgreSQL:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rd_jeans_factory
TEST_BASE_URL=http://localhost:3000
SECRET_KEY=e2b6c9b3d7a8e8f4c0a5d2c8e3b1c6d9a4b8e7c1d3f5a2e9b0c7d6e5f4a3b2c1
```

---

## 3. Interpreting Output & Exit Codes

- **Exit Code 0**: All test suites executed successfully; coverage gates met.
- **Exit Code 1**: One or more assertions failed, or code coverage fell below required threshold.
- **Coverage Summary**: Displayed directly in terminal as an ASCII table showing % Lines, % Branches, % Functions, and % Statements. Detailed HTML reports are generated at `coverage/index.html`.
