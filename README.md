# RD Jeans Factory Management System

A full-stack Factory Operations & Financial ERP built specifically for garment and denim manufacturing enterprises. The system centralizes factory floor operations—including worker management, salary advances (**Upad**), monthly wage settlements, denim fabric roll inventory, precision cutting lot tracking, client accounts (**Seths**), categorized operational expenditures, and a real-time passbook general ledger (**Cashbook**).

---

## 📚 Complete Project Documentation Package

The repository contains comprehensive architectural, business, and operational documentation under the [`docs/`](file:///d:/Akshay%20RD%20jeans/docs/) directory:

| Document | Description |
| :--- | :--- |
| **[01. Project Overview](file:///d:/Akshay%20RD%20jeans/docs/01-project-overview.md)** | Executive summary, business problem, vision, stakeholders, and scope. |
| **[02. Business Requirements](file:///d:/Akshay%20RD%20jeans/docs/02-business-requirements.md)** | Functional requirements with unique IDs (`REQ-xxx`), NFRs, and acceptance criteria. |
| **[03. System Architecture](file:///d:/Akshay%20RD%20jeans/docs/03-system-architecture.md)** | Multi-layer fullstack architecture, ADRs, sequence flows, and Mermaid diagrams. |
| **[04. Detailed Module Documentation](file:///d:/Akshay%20RD%20jeans/docs/04-module-documentation.md)** | Exhaustive specifications for all 11 core modules, data flows, and business rules. |
| **[05. End-to-End Workflows](file:///d:/Akshay%20RD%20jeans/docs/05-business-workflows.md)** | Complete production, wage, cashbook, and recalculation lifecycles. |
| **[06. Database Design & DDL](file:///d:/Akshay%20RD%20jeans/docs/06-database-design.md)** | PostgreSQL schema, ER diagram, constraints, and complete production SQL script. |
| **[07. API Documentation](file:///d:/Akshay%20RD%20jeans/docs/07-api-documentation.md)** | Complete REST endpoint catalog, payload schemas, query parameters, and error codes. |
| **[08. Authentication & Security](file:///d:/Akshay%20RD%20jeans/docs/08-authentication-and-security.md)** | JWT & cookie session flows, vulnerability audit, and hardening action plan. |
| **[09. Implementation Status](file:///d:/Akshay%20RD%20jeans/docs/09-implementation-status.md)** | Evidence-based feature scorecard verifying the ~64.5% implementation baseline. |
| **[10. Gap Analysis & Improvements](file:///d:/Akshay%20RD%20jeans/docs/10-gap-analysis.md)** | Prioritized technical and business gaps with root causes and solutions. |
| **[11. Testing Strategy](file:///d:/Akshay%20RD%20jeans/docs/11-testing-strategy.md)** | Multi-tier QA plan, test case catalog, edge cases, and automated test roadmap. |
| **[12. Development Roadmap](file:///d:/Akshay%20RD%20jeans/docs/12-development-roadmap.md)** | 5 dependency-ordered milestones to reach 100% production readiness with DoD. |
| **[13. Deployment Runbook](file:///d:/Akshay%20RD%20jeans/docs/13-deployment-and-maintenance.md)** | Vercel and Docker VPS deployment runbooks, Nginx SSL setup, and backup scripts. |
| **[14. Developer Onboarding](file:///d:/Akshay%20RD%20jeans/docs/14-developer-onboarding.md)** | 5-minute setup guide, internal mental model, and code tracing walkthrough. |
| **[15. Glossary & Open Questions](file:///d:/Akshay%20RD%20jeans/docs/15-glossary-and-open-questions.md)** | Textile terminology (Pana, Upad, Seth), requirement index, and strategic questions. |

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons
* **Backend Services & APIs**: Next.js Route Handlers (`app/api/*`), Domain Service Layer (`lib/services/*`)
* **Database & Persistence**: PostgreSQL 15+ via `node-postgres` (`pg` v8.22.0) Connection Pool
* **Security & Tokens**: JWT (`jsonwebtoken` v9), Password Hashing (`bcryptjs` v3), Edge Middleware

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Node.js v20.x or v22.x
* PostgreSQL v15+ running on port `5432`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/akshayG2110/rd-jeans-factory-management.git
cd rd-jeans-factory-management

# Install dependencies
npm install
```

### 3. Environment Setup
Configure `.env.local` in the project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rd_jeans_factory
SECRET_KEY=e2b6c9b3d7a8e8f4c0a5d2c8e3b1c6d9a4b8e7c1d3f5a2e9b0c7d6e5f4a3b2c1
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 4. Database Initialization
Execute the production DDL script located in [docs/06-database-design.md](file:///d:/Akshay%20RD%20jeans/docs/06-database-design.md) in your PostgreSQL console (`psql` or `pgAdmin`).

### 5. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser. Default administrative credentials:
* **Username**: `rdjeans123`
* **Password**: `RD@123`

---

## 📊 Implementation Status Summary

* **Verified Overall Completion**: **64.5%**
* **Active Working Logic**: Worker CRUD, Upad Advances, Monthly Wage Settlements, Roll Inward, Cutting Lot Meter Deductions, Seth Receipts, Operational Expenses, Dual-Write Cashbook Synchronization, CSV Reporting.
* **Remaining Work**: Binary Excel (.xlsx) and PDF (.pdf) generation, API Route Authentication Guard, Database Migration Tooling, and Automated Testing.
