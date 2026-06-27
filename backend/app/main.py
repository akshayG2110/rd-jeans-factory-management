from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, employee, upad, salary, seth, roll, cutting, income, expense, cashbook, partner, dashboard, report
from app import models

# Initialize FastAPI App
app = FastAPI(
    title="RD Jeans Factory Management System API",
    description="Backend API for managing RD Jeans factory operations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(employee.router)
app.include_router(upad.router)
app.include_router(salary.router)
app.include_router(seth.seth_router)
app.include_router(seth.payment_router)
app.include_router(roll.router)
app.include_router(cutting.router)
app.include_router(income.router)
app.include_router(expense.router)
app.include_router(cashbook.router)
app.include_router(partner.router)
app.include_router(dashboard.router)
app.include_router(report.router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "RD Jeans API Running"}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
