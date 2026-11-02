# RD Jeans Testing Architecture & Harness Specification
**Document ID:** `QA-DOC-003-ARCHITECTURE`  
**System:** RD Jeans Factory Management System  

---

## 1. Architectural Overview

The testing infrastructure is built on **Vitest**, a next-generation test runner architected natively for ESM and TypeScript. It operates directly against TypeScript files without intermediate bundling overhead or Babel transpilation.

```mermaid
graph TD
    Runner[Vitest Test Runner CLI] --> Config[vitest.config.ts]
    Config --> Env[Node.js Test Environment]
    Config --> Setup[tests/setup.ts: Global Mocks & Lifecycle]
    
    Setup --> MockDB[Database Mock Harness: Mock Pool & Mock Client]
    
    Runner --> ServiceSuites[Unit Tests: tests/unit/services/*.test.ts]
    Runner --> AuthSuites[Unit Tests: tests/unit/auth/*.test.ts]
    Runner --> RouteSuites[Integration Tests: tests/integration/*.test.ts]
    
    ServiceSuites --> SUT1[lib/services/*: Domain Logic Controllers]
    AuthSuites --> SUT2[lib/auth.ts: Security & Tokens]
    RouteSuites --> SUT3[app/api/*: API Route Handlers]
    
    SUT1 --> MockDB
    SUT2 --> MockDB
    
    Runner --> Coverage[@vitest/coverage-v8: Code Coverage Engine]
    Coverage --> HTMLRep[coverage/index.html: Visual Line/Branch Coverage]
    Coverage --> LCOV[coverage/lcov.info: CI Ingestion]
```

---

## 2. Directory Layout for Test Files

To ensure clarity and avoid polluting production application folders, all test files and testing harnesses reside under `tests/`:

```
tests/
├── setup.ts                             # Global test lifecycle, reset hooks, env fixtures
├── mocks/                               # Reusable domain mocks
│   ├── db.mock.ts                       # Mock pg Pool, Client, and QueryResult factory
│   ├── auth.mock.ts                     # Mock JWT token fixtures and user sessions
│   └── fixtures/                        # Static seed data for workers, rolls, seths
│       ├── employees.fixture.ts
│       ├── rolls.fixture.ts
│       └── cashbook.fixture.ts
├── unit/                                # Pure isolated unit tests
│   ├── auth/                            # Auth token and bcrypt hashing tests
│   │   ├── auth.test.ts
│   │   └── middleware.test.ts
│   └── services/                        # Service layer unit tests (13 test suites)
│       ├── cashbook.service.test.ts
│       ├── cutting.service.test.ts
│       ├── dashboard.service.test.ts
│       ├── employees.service.test.ts
│       ├── expenses.service.test.ts
│       ├── finished-goods.service.test.ts
│       ├── income.service.test.ts
│       ├── partners.service.test.ts
│       ├── reports.service.test.ts
│       ├── rolls.service.test.ts
│       ├── salary.service.test.ts
│       ├── seths.service.test.ts
│       └── upad.service.test.ts
└── integration/                         # Route handler and API integration tests
    ├── api-auth.test.ts
    ├── api-cashbook.test.ts
    └── api-salary.test.ts
```

---

## 3. Database Mocking Architecture

The PostgreSQL connection layer in `lib/db.ts` exports three entities:
1. `pool`: Instance of `pg.Pool`.
2. `query<T>(text: string, params?: any[])`: Top-level query helper.
3. `getClient()`: Connects to pool and returns an individual client with `.query()`, `.release()`.

In our test architecture, `lib/db.ts` is intercepted via `vi.mock('../../lib/db')` or `vi.spyOn`. The mock returns a chainable Query Result Factory that records executed queries and returns simulated rows, enabling verification of:
- Exact SQL query text and parameterized values.
- Transaction handling (`BEGIN`, `COMMIT`, `ROLLBACK`).
- Error propagation and constraint violation simulation.
