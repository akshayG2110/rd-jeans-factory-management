# RD Jeans Factory Management System - Project Setup Guide

Welcome to the comprehensive setup and development guide for the **RD Jeans Factory Management System**. This document provides step-by-step instructions to set up the environment, database, backend, and frontend from scratch.

---

## 1. Project Overview

### Project Name
* **RD Jeans Factory Management System**

### Tech Stack
* **Frontend**: Next.js (React 19, TypeScript, Tailwind CSS, Shadcn/ui)
* **Backend**: FastAPI (Python 3.12+, SQLAlchemy ORM)
* **Database**: PostgreSQL (v15+)
* **Session Security**: Cookie + LocalStorage Session Matching (Simple Flow)

### Core Features
1. **Worker & Payroll Management**: Manage employees, upad (advances), salaries, and payment logs.
2. **Denim Roll Inventory**: Trace fabric rolls, type details, meters received, used, and remaining balance.
3. **Cutting lot operations**: Log fabric cuttings per size/lot, layer counts, piece yields, and auto-deduct meters from inventory fabric rolls.
4. **General Ledger Ledger**: Consolidated income tracking, expense routing, and central cash book ledgers.
5. **Partner Accounts**: Independent balance passbooks for factory owners (Rajubhai & Dhruveshbhai).
6. **Analytical Reports**: Excel and PDF report exports with date ranges and categories.
7. **Login System**: Secured credentials validation page protecting all app route views.

### Architecture Flow
```
[Next.js Client] ──(HTTP JSON/Cookies)──> [FastAPI Backend] ──(SQLAlchemy ORM)──> [PostgreSQL Database]
```

---

## 2. System Requirements

### Frontend
* **Node.js**: `v20.x` or higher (LTS recommended)
* **npm**: `v10.x` or higher

### Backend
* **Python**: `v3.12` or higher
* **pip**: `v24.x` or higher

### Database
* **PostgreSQL**: `v15.x` or `v16.x`
* **pgAdmin**: `v8.x` (Recommended for GUI database administration)

### Recommended IDE Extensions (VS Code)
* `esbenp.prettier-vscode` (Code formatter)
* `ms-python.python` (Python language support)
* `ms-python.vscode-pylance` (Type checking and autocomplete)
* `bradlc.vscode-tailwindcss` (Tailwind CSS IntelliSense)

---

## 3. Required Software Installation

### 1. Node.js
* **Download**: [https://nodejs.org/](https://nodejs.org/)
* **Setup**: Download the LTS installer, run the wizard, and ensure you check the box to "Add to PATH".
* **Verify**: `node -v` and `npm -v`

### 2. Python
* **Download**: [https://www.python.org/downloads/](https://www.python.org/downloads/)
* **Setup**: Run the installer. **CRITICAL**: Check the box **"Add python.exe to PATH"** before clicking Install.
* **Verify**: `python --version` and `pip --version`

### 3. PostgreSQL & pgAdmin
* **Download**: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
* **Setup**: Install PostgreSQL. During setup, set a password for the default `postgres` superuser (e.g., `postgres` or custom) and keep default port `5432`. pgAdmin is automatically bundled; open it to verify connection.

### 4. Git
* **Download**: [https://git-scm.com/](https://git-scm.com/)
* **Setup**: Install Git with default settings.
* **Verify**: `git --version`

### 5. VS Code
* **Download**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
* **Setup**: Install VS Code and search for "Tailwind CSS", "Python", and "Prettier" in the Extensions tab to install them.

---

## 4. Frontend Setup

### 1. Project Initialization
Initialize Next.js project inside the root workspace using:
```bash
npx create-next-app@latest ./ --typescript --tailwind --app --src-dir=false --eslint
```

### 2. Package Installation
Install the required packages in the Next.js root folder:
```bash
npm install
```

### 3. Dependency Descriptions
The following frontend packages are utilized in the application:
* **next** & **react**: The core web app framework and components library.
* **lucide-react**: Lightweight icon components matching modern mobile design guidelines.
* **clsx** & **tailwind-merge**: Utilities to construct class strings and merge conflicting Tailwind styles.
* **tw-animate-css**: Handles beautiful slide-in transitions on custom popup modal dialogs.
* **typescript**: Enables strict type safety on data schemas and page state properties.

---

## 5. Backend Setup

### 1. Virtual Environment Setup
Navigate to the `backend/` directory and create/activate a Python virtual environment:
```bash
cd backend
python -m venv venv

# Activate on Windows (Command Prompt)
venv\Scripts\activate

# Activate on Windows (PowerShell)
.\venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

### 2. Package Installation
Install the backend requirements from the configuration file:
```bash
pip install -r requirements.txt
```

### 3. Dependency Descriptions
The following packages are installed for backend operations:
* **fastapi**: Modern, high-performance web framework for building APIs.
* **uvicorn**: ASGI web server implementation to run FastAPI.
* **sqlalchemy**: Object Relational Mapper (ORM) to interact with PostgreSQL using Python classes.
* **psycopg2-binary**: PostgreSQL database adapter driver.
* **pydantic**: Data validation and parsing using Python type annotations.
* **pydantic-settings**: Environment variable parsing configurations.
* **python-jose**: Library to encode/decode JSON Web Tokens (JWT) for future authentication upgrades.
* **passlib[bcrypt]** & **bcrypt**: Security utility to hash and salt user passwords.
* **alembic**: Database migration manager to track model modifications.
* **python-dotenv**: Loads configuration variables from `.env` files.

---

## 6. PostgreSQL Setup

### Database Details
* **Database Name**: `rd_jeans_factory`
* **Username**: `postgres`
* **Port**: `5432`

### PostgreSQL Setup Commands
Open pgAdmin or run PostgreSQL Shell (`psql`) as superuser and execute:
```sql
-- Create database
CREATE DATABASE rd_jeans_factory;

-- Connect to database
\c rd_jeans_factory;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default user
INSERT INTO users (username, password_hash)
VALUES ('rdjeans123', 'RD@123')
ON CONFLICT (username) DO NOTHING;
```

---

## 7. Environment Variables

### Frontend Environment File: `.env.local`
Create this file in the root Next.js folder:
```env
# URL pointer to FastAPI Backend Server
NEXT_PUBLIC_API_URL=http://localhost:8000
```
* **Explanation**: `NEXT_PUBLIC_API_URL` exposes the backend server's port address to client-side components to route API calls.

### Backend Environment File: `.env`
Create this file in the `backend/` folder:
```env
# Connection String (Replace "YOUR_PASSWORD" with actual PostgreSQL Password)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rd_jeans_factory

# Security Key for Future JWT Signing
SECRET_KEY=e2b6c9b3d7a8e8f4c0a5d2c8e3b1c6d9a4b8e7c1d3f5a2e9b0c7d6e5f4a3b2c1
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```
* **Explanation**: `DATABASE_URL` connects SQLAlchemy to the PostgreSQL instance. `SECRET_KEY` defines the hashing signature key.

---

## 8. Project Folder Structure

### Complete Workspace Layout
```
RD Jeans Workspace/
│
├── app/                        # Next.js Pages (App Router)
│   ├── login/                  # Login Page
│   ├── employees/              # Employee CRUD & Profiles
│   ├── salary/                 # Payroll Payout Tracker
│   ├── upad/                   # Advance Payments Tracker
│   ├── expense/                # Expense Ledger Page
│   ├── cashbook/               # Chronological Passbook
│   ├── rolls/                  # Denim Rolls Inventory Page
│   ├── cutting/                # Piece Cutting Lot Operations Page
│   ├── reports/                # Excel/PDF Exports Center
│   ├── partners/               # Owner Isolated Ledgers
│   ├── globals.css             # Vanilla CSS Custom Theme
│   ├── layout.tsx              # Main Shell Layout
│   └── page.tsx                # Real-time Dashboard Landing Page
│
├── components/                 # Shared UI Components
│   ├── ui/                     # Design Buttons and Form Layouts
│   ├── cash-balance-card.tsx   # Dashboard Cash Flow Display Card
│   ├── dashboard-header.tsx    # Header Banner (including Logout)
│   ├── factory-summary.tsx     # Metrics summary aggregation layout
│   └── recent-activities.tsx   # Chronological activity logs
│
├── lib/                        # Client Side Utilities
│   ├── employee-store.ts       # Shared structures and in-memory stores
│   └── dashboard-data.ts       # Sidebar module configurations
│
├── backend/                    # FastAPI Backend Project
│   ├── app/
│   │   ├── core/               # Pydantic global environment configs
│   │   ├── database/           # Base ORM config & Engine bindings
│   │   ├── models/             # SQLAlchemy Database Schema classes
│   │   ├── schemas/            # Pydantic validation payload classes
│   │   ├── services/           # Backend transaction controller managers
│   │   ├── routers/            # Web API endpoint controllers
│   │   ├── main.py             # App initialization and CORS settings
│   │   └── __init__.py
│   ├── Requirements.txt        # Backend dependencies list
│   └── .env                    # Postgres local password definitions
│
├── middleware.ts               # Routing security cookie interceptor
├── package.json                # Frontend package configurations
└── PROJECT_SETUP.md            # Installation Guide
```

---

## 9. Running The Project

### 1. Database Initialization
Ensure PostgreSQL server service is running locally on port `5432`.

### 2. Run Backend
Activate the virtual environment inside `backend/` and start Uvicorn:
```bash
venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```
* The backend will run on: **`http://localhost:8000`**

### 3. Run Frontend
Open a new command prompt in the root directory and start Next.js dev server:
```bash
npm run dev
```
* The web app will run on: **`http://localhost:3000`**

---

## 10. API Testing & Documentation

### Swagger UI Auto-Docs
Access interactive interactive API tests on the web browser:
* **Docs URL**: `http://localhost:8000/docs`
* **Redoc URL**: `http://localhost:8000/redoc`

### Health Check Endpoint
* **URL**: `GET http://localhost:8000/health`
* **Output**: `{"status": "healthy"}`

### Core Authentications Testing
* **Login Endpoint**: `POST http://localhost:8000/auth/login`
* **Payload**:
```json
{
  "username": "rdjeans123",
  "password": "RD@123"
}
```

---

## 11. Build For Production

### Frontend Compilation
Generate static production output bundles in the root Next.js folder:
```bash
npm run build
```

### Backend Production Server
Run uvicorn without reload flags, binding worker threads in production environments:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 12. Deployment Guide

### Frontend (Vercel)
1. Push your project code to a private GitHub repository.
2. Log into Vercel and import your repository.
3. Add `NEXT_PUBLIC_API_URL` under Environment Variables matching your deployed Backend URL.
4. Click Deploy.

### Backend (VPS / Docker)
1. Set up a Linux VPS (e.g. DigitalOcean, AWS EC2).
2. Install Python, PostgreSQL, and Git.
3. Configure a system service (`systemd`) to run uvicorn in the background.
4. Set up Nginx as a reverse proxy forwarding queries to port `8000` with SSL support via Certbot.

---

## 13. Troubleshooting Common Errors

### 1. PostgreSQL Connection Failed
* **Error**: `psycopg2.OperationalError: connection to server at "localhost", port 5432 failed: Connection refused`
* **Solution**: Verify the PostgreSQL service is active in Windows Services (`services.msc`). Check that the password inside `.env` matches the postgres superuser password.

### 2. CORS Issues
* **Error**: `Access to fetch at 'http://localhost:8000/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy`
* **Solution**: Ensure `allow_origins=["*"]` is correctly set in [main.py](file:///d:/Akshay%20RD%20jeans/backend/app/main.py) middleware settings.

### 3. Next.js Route Compilation Failures
* **Error**: TypeScript compilation exceptions during `npm run build`
* **Solution**: Run `npx tsc --noEmit` locally to locate and correct generic type mismatches or missing properties in interface declarations.

---

## 14. Final Deployment Checklist

* [ ] PostgreSQL Server Running Locally
* [ ] Database `rd_jeans_factory` Created
* [ ] Default User `rdjeans123` Inserted into database
* [ ] Backend `.env` configured with correct PostgreSQL password
* [ ] Backend starts up successfully on `http://localhost:8000`
* [ ] Frontend `.env.local` pointing to backend port URL
* [ ] Middleware routing protection working (non-authenticated routes redirect to `/login`)
* [ ] Login credentials validate successfully against active PostgreSQL users table
