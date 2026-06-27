# RD Jeans Factory Management System - Backend API

This is the production-ready backend foundation for the RD Jeans Factory Management System, built with FastAPI, SQLAlchemy, and PostgreSQL.

## Technologies Used

- **FastAPI**: Modern, fast (high-performance) web framework for building APIs.
- **PostgreSQL & SQLAlchemy**: Relational database with object-relational mapping.
- **Alembic**: Database migrations management.
- **Pydantic**: Data validation and Settings management.
- **Uvicorn**: ASGI web server implementation.

## Project Structure

```
backend/
├── app/
│   ├── core/           # App configuration and security settings
│   ├── database/       # SQLAlchemy models, sessions, and engine setup
│   ├── models/         # Database models (empty placeholder)
│   ├── routers/        # API route handlers (empty placeholder)
│   ├── schemas/        # Pydantic schemas (empty placeholder)
│   ├── services/       # Business logic services (empty placeholder)
│   ├── utils/          # Shared helper functions (empty placeholder)
│   └── main.py         # Application entrypoint
├── .env.example        # Reference environment variables config
├── README.md           # Instructions and documentation
└── requirements.txt    # Python dependencies list
```

## Setup Instructions

### 1. Prerequisites
Make sure you have Python 3.10+ installed.

### 2. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Update the settings in `.env` to match your local setup, especially `DATABASE_URL`.

### 3. Installation
Create a virtual environment and install the required dependencies:
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Running the Server
Start the development server with hot-reload enabled:
```bash
uvicorn app.main:app --reload
```
The server will start at `http://127.0.0.1:8000`.

### 5. API Documentation
Once the server is running, you can access the automatically generated interactive docs:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`
