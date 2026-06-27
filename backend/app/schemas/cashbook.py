from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from enum import Enum
from app.schemas.employee import ResponseEnvelope
from app.schemas.seth import SethPaymentMethod
from app.schemas.upad import HandledBy

class CashBookTransactionType(str, Enum):
    INCOME = "Income"
    SALARY = "Salary"
    UPAD = "Upad"
    MATERIAL_EXPENSE = "Material Expense"
    TRANSPORT_EXPENSE = "Transport Expense"
    ELECTRICITY_BILL = "Electricity Bill"
    RENT = "Rent"
    MAINTENANCE = "Maintenance"
    OTHER_EXPENSE = "Other Expense"

class ReferenceModuleType(str, Enum):
    INCOME = "Income"
    EXPENSE = "Expense"
    SALARY = "Salary"
    UPAD = "Upad"
    SETH_PAYMENT = "Seth Payment"

class CashBookInDB(BaseModel):
    id: int
    transaction_date: date = Field(..., serialization_alias="Date")
    name: str = Field(..., serialization_alias="Name")
    payment_method: SethPaymentMethod = Field(..., serialization_alias="Method")
    income_amount: Decimal = Field(..., serialization_alias="Income")
    out_amount: Decimal = Field(..., serialization_alias="Out")
    running_balance: Decimal = Field(..., serialization_alias="Balance")
    handled_by: HandledBy = Field(..., serialization_alias="Handled By")
    notes: Optional[str] = Field(None, serialization_alias="Notes")
    
    # Audit fields kept optional/internal
    reference_module: ReferenceModuleType = Field(..., description="Origin module")
    reference_id: int = Field(..., description="Origin module record ID")
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": 15,
                "Date": "2026-06-07",
                "Name": "Lalitbhai RD",
                "Method": "Cash",
                "Income": 50000.00,
                "Out": 0.00,
                "Balance": 85000.00,
                "Handled By": "Rajubhai",
                "Notes": "Advance lot payment received",
                "reference_module": "Seth Payment",
                "reference_id": 101,
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

class CashBookDashboardSummary(BaseModel):
    current_cash_balance: Decimal = Field(..., description="Current running cash balance in the factory")
    today_cash_in: Decimal = Field(..., description="Total cash inflow today")
    today_cash_out: Decimal = Field(..., description="Total cash outflow today")
    monthly_cash_in: Decimal = Field(..., description="Total cash inflow this calendar month")
    monthly_cash_out: Decimal = Field(..., description="Total cash outflow this calendar month")

    model_config = {
        "json_schema_extra": {
            "example": {
                "current_cash_balance": 85000.00,
                "today_cash_in": 50000.00,
                "today_cash_out": 15000.00,
                "monthly_cash_in": 340000.00,
                "monthly_cash_out": 120000.00
            }
        }
    }

# ================= Response Envelopes =================

class CashBookSingleResponse(ResponseEnvelope[CashBookInDB]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Cash Book transaction entry retrieved successfully",
                "data": {
                    "id": 15,
                    "Date": "2026-06-07",
                    "Name": "Lalitbhai RD",
                    "Method": "Cash",
                    "Income": 50000.00,
                    "Out": 0.00,
                    "Balance": 85000.00,
                    "Handled By": "Rajubhai",
                    "Notes": "Lot payment",
                    "reference_module": "Seth Payment",
                    "reference_id": 101,
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z"
                }
            }
        }
    }

class CashBookListResponse(ResponseEnvelope[List[CashBookInDB]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Cash Book passbook entries list retrieved successfully",
                "data": [
                    {
                        "id": 15,
                        "Date": "2026-06-07",
                        "Name": "Lalitbhai RD",
                        "Method": "Cash",
                        "Income": 50000.00,
                        "Out": 0.00,
                        "Balance": 85000.00,
                        "Handled By": "Rajubhai",
                        "Notes": "Lot payment",
                        "reference_module": "Seth Payment",
                        "reference_id": 101,
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                ]
            }
        }
    }

class CashBookDashboardSummaryResponse(ResponseEnvelope[CashBookDashboardSummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Cash Book dashboard compiled successfully",
                "data": {
                    "current_cash_balance": 85000.00,
                    "today_cash_in": 50000.00,
                    "today_cash_out": 15000.00,
                    "monthly_cash_in": 340000.00,
                    "monthly_cash_out": 120000.00
                }
            }
        }
    }
