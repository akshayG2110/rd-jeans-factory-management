from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from app.schemas.employee import ResponseEnvelope
from app.schemas.cashbook import CashBookInDB

class EmployeesSummaryCard(BaseModel):
    total_employees: int
    active_employees: int
    inactive_employees: int

class UpadSummaryCard(BaseModel):
    current_month_upad_total: Decimal
    total_upad_given: Decimal

class SalarySummaryCard(BaseModel):
    current_month_salary_paid: Decimal
    pending_salary: Decimal

class SethSummaryCard(BaseModel):
    total_seths: int
    active_seths: int
    current_month_seth_payments: Decimal

class InventorySummaryCard(BaseModel):
    total_rolls: int
    available_rolls: int
    partially_used_rolls: int
    completed_rolls: int
    total_remaining_meter: Decimal

class CuttingSummaryCard(BaseModel):
    total_cutting_lots: int
    today_cutting: int  # pieces generated today
    monthly_cutting: int  # pieces generated this month
    total_pieces_generated: int

class IncomeSummaryCard(BaseModel):
    today_income: Decimal
    monthly_income: Decimal
    total_income: Decimal

class ExpenseSummaryCard(BaseModel):
    today_expense: Decimal
    monthly_expense: Decimal
    total_expense: Decimal

class CashBookSummaryCard(BaseModel):
    current_cash_balance: Decimal
    today_cash_in: Decimal
    today_cash_out: Decimal
    monthly_cash_in: Decimal
    monthly_cash_out: Decimal

class PartnersSummaryCard(BaseModel):
    rajubhai_transactions_count: int
    dhruveshbhai_transactions_count: int
    rajubhai_total_income_handled: Decimal
    rajubhai_total_expenses_handled: Decimal
    dhruveshbhai_total_income_handled: Decimal
    dhruveshbhai_total_expenses_handled: Decimal

class DashboardData(BaseModel):
    employees: EmployeesSummaryCard
    upad: UpadSummaryCard
    salary: SalarySummaryCard
    seth: SethSummaryCard
    inventory: InventorySummaryCard
    cutting: CuttingSummaryCard
    income: IncomeSummaryCard
    expense: ExpenseSummaryCard
    cashbook: CashBookSummaryCard
    partners: PartnersSummaryCard
    recent_activity: List[CashBookInDB]

class DashboardResponse(ResponseEnvelope[DashboardData]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Real-time dashboard metrics compiled successfully",
                "data": {
                    "employees": {
                        "total_employees": 25,
                        "active_employees": 22,
                        "inactive_employees": 3
                    },
                    "upad": {
                        "current_month_upad_total": 4500.00,
                        "total_upad_given": 24500.00
                    },
                    "salary": {
                        "current_month_salary_paid": 45000.00,
                        "pending_salary": 9000.00
                    },
                    "seth": {
                        "total_seths": 8,
                        "active_seths": 7,
                        "current_month_seth_payments": 120000.00
                    },
                    "inventory": {
                        "total_rolls": 150,
                        "available_rolls": 90,
                        "partially_used_rolls": 40,
                        "completed_rolls": 20,
                        "total_remaining_meter": 10540.30
                    },
                    "cutting": {
                        "total_cutting_lots": 82,
                        "today_cutting": 360,
                        "monthly_cutting": 5200,
                        "total_pieces_generated": 9840
                    },
                    "income": {
                        "today_income": 50000.00,
                        "monthly_income": 340000.00,
                        "total_income": 1250000.00
                    },
                    "expense": {
                        "today_expense": 15000.00,
                        "monthly_expense": 120000.00,
                        "total_expense": 450000.00
                    },
                    "cashbook": {
                        "current_cash_balance": 85000.00,
                        "today_cash_in": 50000.00,
                        "today_cash_out": 15000.00,
                        "monthly_cash_in": 340000.00,
                        "monthly_cash_out": 120000.00
                    },
                    "partners": {
                        "rajubhai_transactions_count": 65,
                        "dhruveshbhai_transactions_count": 58,
                        "rajubhai_total_income_handled": 500000.00,
                        "rajubhai_total_expenses_handled": 320000.00,
                        "dhruveshbhai_total_income_handled": 420000.00,
                        "dhruveshbhai_total_expenses_handled": 280000.00
                    },
                    "recent_activity": []
                }
            }
        }
    }
