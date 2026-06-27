from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from enum import Enum
from app.schemas.employee import ResponseEnvelope
from app.schemas.seth import SethPaymentMethod
from app.schemas.upad import HandledBy

class IncomeSourceType(str, Enum):
    SETH_PAYMENT = "Seth Payment"
    OTHER_INCOME = "Other Income"

class IncomeBase(BaseModel):
    income_date: date = Field(..., description="Date on which the income was realized")
    income_source: IncomeSourceType = Field(..., description="Classification category of the income source")
    source_name: str = Field(..., min_length=1, max_length=100, description="Name detailing the origin (e.g. Lalitbhai RD, Scrap Fabric Sale)")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Monetary sum received")
    payment_method: SethPaymentMethod = Field(..., description="Payment channel utilized")
    handled_by: HandledBy = Field(..., description="Authorized owner handling the inflow")
    reference_number: Optional[str] = Field(None, max_length=50, description="Transaction ID or Cheque reference details")
    notes: Optional[str] = Field(None, max_length=500, description="Additional context or remarks")

class IncomeCreate(IncomeBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "income_date": "2026-06-07",
                "income_source": "Other Income",
                "source_name": "Scrap Fabric Jeans Waste Sale",
                "amount": 4500.00,
                "payment_method": "Cash",
                "handled_by": "Dhruveshbhai",
                "reference_number": "REF-80921",
                "notes": "Sold denim waste scraps to local recycler"
            }
        }
    }

class IncomeUpdate(BaseModel):
    income_date: Optional[date] = Field(None, description="Date on which the income was realized")
    income_source: Optional[IncomeSourceType] = Field(None, description="Classification category")
    source_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Name detailing the origin")
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Monetary sum received")
    payment_method: Optional[SethPaymentMethod] = Field(None, description="Payment channel utilized")
    handled_by: Optional[HandledBy] = Field(None, description="Authorized owner handling the inflow")
    reference_number: Optional[str] = Field(None, max_length=50, description="Transaction ID or Cheque reference details")
    notes: Optional[str] = Field(None, max_length=500, description="Additional context or remarks")

    model_config = {
        "json_schema_extra": {
            "example": {
                "amount": 5000.00,
                "notes": "Revised final scrap sale amount"
            }
        }
    }

class IncomeInDB(IncomeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 201,
                "income_date": "2026-06-07",
                "income_source": "Other Income",
                "source_name": "Scrap Fabric Jeans Waste Sale",
                "amount": 4500.00,
                "payment_method": "Cash",
                "handled_by": "Dhruveshbhai",
                "reference_number": "REF-80921",
                "notes": "Sold denim waste scraps to local recycler",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

class IncomeDashboardSummary(BaseModel):
    today_income: Decimal = Field(..., description="Total income recorded on the current calendar day")
    monthly_income: Decimal = Field(..., description="Total income recorded in the current calendar month")
    total_income: Decimal = Field(..., description="Aggregate sum of all income ever recorded")
    current_cash_balance: Decimal = Field(..., description="Calculated cash balance in hand (Sum of all Cash payments)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "today_income": 54500.00,
                "monthly_income": 340000.00,
                "total_income": 1250000.00,
                "current_cash_balance": 85000.00
            }
        }
    }

# ================= Response Envelopes =================

class IncomeSingleResponse(ResponseEnvelope[IncomeInDB]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Income entry logged successfully",
                "data": {
                    "id": 201,
                    "income_date": "2026-06-07",
                    "income_source": "Other Income",
                    "source_name": "Scrap Fabric Jeans Waste Sale",
                    "amount": 4500.00,
                    "payment_method": "Cash",
                    "handled_by": "Dhruveshbhai",
                    "reference_number": "REF-80921",
                    "notes": "Sold denim waste scraps",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z"
                }
            }
        }
    }

class IncomeListResponse(ResponseEnvelope[List[IncomeInDB]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Income entries list retrieved successfully",
                "data": [
                    {
                        "id": 201,
                        "income_date": "2026-06-07",
                        "income_source": "Other Income",
                        "source_name": "Scrap Fabric Jeans Waste Sale",
                        "amount": 4500.00,
                        "payment_method": "Cash",
                        "handled_by": "Dhruveshbhai",
                        "reference_number": "REF-80921",
                        "notes": "Sold denim waste scraps",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                ]
            }
        }
    }

class IncomeDashboardSummaryResponse(ResponseEnvelope[IncomeDashboardSummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Income dashboard metrics compiled successfully",
                "data": {
                    "today_income": 54500.00,
                    "monthly_income": 340000.00,
                    "total_income": 1250000.00,
                    "current_cash_balance": 85000.00
                }
            }
        }
    }
