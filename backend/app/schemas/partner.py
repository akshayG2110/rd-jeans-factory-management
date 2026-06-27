from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from app.schemas.employee import ResponseEnvelope
from app.schemas.seth import SethPaymentMethod
from app.schemas.upad import HandledBy
from app.schemas.cashbook import CashBookTransactionType

class PartnerPassbookEntry(BaseModel):
    id: int
    transaction_date: date = Field(..., serialization_alias="Date")
    name: str = Field(..., serialization_alias="Name")
    payment_method: SethPaymentMethod = Field(..., serialization_alias="Method")
    income_amount: Decimal = Field(..., serialization_alias="Income")
    out_amount: Decimal = Field(..., serialization_alias="Out")
    running_balance: Decimal = Field(..., serialization_alias="Balance")
    handled_by: HandledBy = Field(..., serialization_alias="Handled By")
    transaction_type: CashBookTransactionType = Field(..., serialization_alias="Category")
    notes: Optional[str] = Field(None, serialization_alias="Notes")

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
                "Category": "Income",
                "Notes": "Lot payment"
            }
        }
    }

class PartnerSummary(BaseModel):
    total_factory_balance: Decimal = Field(..., description="Overall cash balance in the factory account")
    rajubhai_total_income_handled: Decimal = Field(..., description="Total income processed by Rajubhai")
    rajubhai_total_expenses_handled: Decimal = Field(..., description="Total expenditures paid out by Rajubhai")
    dhruveshbhai_total_income_handled: Decimal = Field(..., description="Total income processed by Dhruveshbhai")
    dhruveshbhai_total_expenses_handled: Decimal = Field(..., description="Total expenditures paid out by Dhruveshbhai")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_factory_balance": 85000.00,
                "rajubhai_total_income_handled": 500000.00,
                "rajubhai_total_expenses_handled": 320000.00,
                "dhruveshbhai_total_income_handled": 350000.00,
                "dhruveshbhai_total_expenses_handled": 245000.00
            }
        }
    }

# ================= Response Envelopes =================

class PartnerPassbookListResponse(ResponseEnvelope[List[PartnerPassbookEntry]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Transaction logs retrieved successfully",
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
                        "Category": "Income",
                        "Notes": "Lot payment"
                    }
                ]
            }
        }
    }

class PartnerSummaryResponse(ResponseEnvelope[PartnerSummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Partners factory summary compiled successfully",
                "data": {
                    "total_factory_balance": 85000.00,
                    "rajubhai_total_income_handled": 500000.00,
                    "rajubhai_total_expenses_handled": 320000.00,
                    "dhruveshbhai_total_income_handled": 350000.00,
                    "dhruveshbhai_total_expenses_handled": 245000.00
                }
            }
        }
    }
