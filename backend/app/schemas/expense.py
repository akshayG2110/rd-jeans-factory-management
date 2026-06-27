from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from enum import Enum
from app.schemas.employee import ResponseEnvelope
from app.schemas.seth import SethPaymentMethod
from app.schemas.upad import HandledBy

class ExpenseCategoryType(str, Enum):
    SALARY = "Salary"
    UPAD = "Upad"
    MATERIAL_EXPENSE = "Material Expense"
    TRANSPORT_EXPENSE = "Transport Expense"
    ELECTRICITY_BILL = "Electricity Bill"
    RENT = "Rent"
    MAINTENANCE = "Maintenance"
    OTHER_EXPENSE = "Other Expense"

class ExpenseBase(BaseModel):
    expense_date: date = Field(..., description="Date on which the expense was incurred")
    expense_category: ExpenseCategoryType = Field(..., description="Category group of the expense")
    party_name: str = Field(..., min_length=1, max_length=100, description="Recipient of the payment (e.g. Landlord, Fabric Vendor)")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Monetary sum spent")
    payment_method: SethPaymentMethod = Field(..., description="Payment channel utilized")
    handled_by: HandledBy = Field(..., description="Authorized owner handling the payout")
    reference_number: Optional[str] = Field(None, max_length=50, description="Reference voucher/bill number or cheque ID")
    notes: Optional[str] = Field(None, max_length=500, description="Additional context or remarks")

class ExpenseCreate(ExpenseBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "expense_date": "2026-06-07",
                "expense_category": "Material Expense",
                "party_name": "Siddharth Threads & Zippers",
                "amount": 12500.00,
                "payment_method": "GPay",
                "handled_by": "Rajubhai",
                "reference_number": "TXN-908129",
                "notes": "Purchased stitching threads and metal zippers for lot lots"
            }
        }
    }

class ExpenseUpdate(BaseModel):
    expense_date: Optional[date] = Field(None, description="Date on which the expense was incurred")
    expense_category: Optional[ExpenseCategoryType] = Field(None, description="Category group")
    party_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Recipient of the payment")
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Monetary sum spent")
    payment_method: Optional[SethPaymentMethod] = Field(None, description="Payment channel utilized")
    handled_by: Optional[HandledBy] = Field(None, description="Authorized owner handling the payout")
    reference_number: Optional[str] = Field(None, max_length=50, description="Reference voucher/bill number")
    notes: Optional[str] = Field(None, max_length=500, description="Additional context or remarks")

    model_config = {
        "json_schema_extra": {
            "example": {
                "amount": 13000.00,
                "notes": "Updated thread count adjustments"
            }
        }
    }

class ExpenseInDB(ExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 301,
                "expense_date": "2026-06-07",
                "expense_category": "Material Expense",
                "party_name": "Siddharth Threads & Zippers",
                "amount": 12500.00,
                "payment_method": "GPay",
                "handled_by": "Rajubhai",
                "reference_number": "TXN-908129",
                "notes": "Purchased stitching threads and metal zippers for lot lots",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

class ExpenseDashboardSummary(BaseModel):
    today_expense: Decimal = Field(..., description="Total expense recorded on the current calendar day")
    monthly_expense: Decimal = Field(..., description="Total expense recorded in the current calendar month")
    total_expense: Decimal = Field(..., description="Aggregate sum of all expenses ever recorded")
    current_cash_balance: Decimal = Field(..., description="Calculated cash balance in hand (Cash Income - Cash Expense)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "today_expense": 15000.00,
                "monthly_expense": 120000.00,
                "total_expense": 450000.00,
                "current_cash_balance": 85000.00
            }
        }
    }

# ================= Response Envelopes =================

class ExpenseSingleResponse(ResponseEnvelope[ExpenseInDB]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Expense entry logged successfully",
                "data": {
                    "id": 301,
                    "expense_date": "2026-06-07",
                    "expense_category": "Material Expense",
                    "party_name": "Siddharth Threads & Zippers",
                    "amount": 12500.00,
                    "payment_method": "GPay",
                    "handled_by": "Rajubhai",
                    "reference_number": "TXN-908129",
                    "notes": "Purchased stitching threads",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z"
                }
            }
        }
    }

class ExpenseListResponse(ResponseEnvelope[List[ExpenseInDB]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Expense entries list retrieved successfully",
                "data": [
                    {
                        "id": 301,
                        "expense_date": "2026-06-07",
                        "expense_category": "Material Expense",
                        "party_name": "Siddharth Threads & Zippers",
                        "amount": 12500.00,
                        "payment_method": "GPay",
                        "handled_by": "Rajubhai",
                        "reference_number": "TXN-908129",
                        "notes": "Purchased stitching threads",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                ]
            }
        }
    }

class ExpenseDashboardSummaryResponse(ResponseEnvelope[ExpenseDashboardSummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Expense dashboard metrics compiled successfully",
                "data": {
                    "today_expense": 15000.00,
                    "monthly_expense": 120000.00,
                    "total_expense": 450000.00,
                    "current_cash_balance": 85000.00
                }
            }
        }
    }
