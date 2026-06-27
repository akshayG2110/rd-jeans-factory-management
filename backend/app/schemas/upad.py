from pydantic import BaseModel, Field, field_validator
from datetime import date as datetime_date, datetime
from typing import Optional, List
from enum import Enum
from decimal import Decimal
from app.schemas.employee import ResponseEnvelope, EmployeeInDB

class PaymentMethod(str, Enum):
    CASH = "Cash"
    GPAY = "GPay"
    BANK_TRANSFER = "Bank Transfer"

class HandledBy(str, Enum):
    RAJUBHAI = "Rajubhai"
    DHRUVESHBHAI = "Dhruveshbhai"

class UpadBase(BaseModel):
    employee_id: int = Field(..., description="ID of the employee taking the Upad")
    date: datetime_date = Field(..., description="Date of Upad transaction")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Advance money amount (must be positive)")
    payment_method: PaymentMethod = Field(..., description="Payment channel used")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")
    handled_by: HandledBy = Field(..., description="Authorized person handling the payout")

class UpadCreate(UpadBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "employee_id": 1,
                "date": "2026-06-07",
                "amount": 1500.00,
                "payment_method": "Cash",
                "notes": "Advance for personal expenses",
                "handled_by": "Rajubhai"
            }
        }
    }

class UpadUpdate(BaseModel):
    employee_id: Optional[int] = Field(None, description="ID of the employee taking the Upad")
    date: Optional[datetime_date] = Field(None, description="Date of Upad transaction")
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Advance money amount")
    payment_method: Optional[PaymentMethod] = Field(None, description="Payment channel used")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")
    handled_by: Optional[HandledBy] = Field(None, description="Authorized person handling the payout")

    model_config = {
        "json_schema_extra": {
            "example": {
                "amount": 2000.00,
                "payment_method": "GPay",
                "notes": "Updated amount to 2000"
            }
        }
    }

class UpadInDB(UpadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 12,
                "employee_id": 1,
                "date": "2026-06-07",
                "amount": 1500.00,
                "payment_method": "Cash",
                "notes": "Advance for personal expenses",
                "handled_by": "Rajubhai",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

class UpadWithEmployee(UpadInDB):
    employee: Optional[EmployeeInDB] = Field(None, description="Details of the associated employee")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 12,
                "employee_id": 1,
                "date": "2026-06-07",
                "amount": 1500.00,
                "payment_method": "Cash",
                "notes": "Advance for personal expenses",
                "handled_by": "Rajubhai",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z",
                "employee": {
                    "id": 1,
                    "employee_name": "Ramesh Kumar",
                    "role": "Stitching Worker",
                    "joining_date": "2026-06-01",
                    "status": "Active",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z"
                }
            }
        }
    }

class EmployeeUpadSummary(BaseModel):
    employee_id: int = Field(..., description="Employee ID")
    employee_name: str = Field(..., description="Employee Name")
    total_upad: Decimal = Field(..., description="Total Upad taken ever")
    current_month_upad: Decimal = Field(..., description="Total Upad taken in the current calendar month")
    upad_history: List[UpadInDB] = Field(default_list=[], description="Complete historical Upad records")

    model_config = {
        "json_schema_extra": {
            "example": {
                "employee_id": 1,
                "employee_name": "Ramesh Kumar",
                "total_upad": 3500.00,
                "current_month_upad": 1500.00,
                "upad_history": [
                    {
                        "id": 12,
                        "employee_id": 1,
                        "date": "2026-06-07",
                        "amount": 1500.00,
                        "payment_method": "Cash",
                        "notes": "Advance for personal expenses",
                        "handled_by": "Rajubhai",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                ]
            }
        }
    }

# Specific response envelope models
class UpadSingleResponse(ResponseEnvelope[UpadWithEmployee]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Upad record retrieved successfully",
                "data": {
                    "id": 12,
                    "employee_id": 1,
                    "date": "2026-06-07",
                    "amount": 1500.00,
                    "payment_method": "Cash",
                    "notes": "Advance for personal expenses",
                    "handled_by": "Rajubhai",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z",
                    "employee": {
                        "id": 1,
                        "employee_name": "Ramesh Kumar",
                        "role": "Stitching Worker",
                        "joining_date": "2026-06-01",
                        "status": "Active",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                }
            }
        }
    }

class UpadListResponse(ResponseEnvelope[List[UpadWithEmployee]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Upad records retrieved successfully",
                "data": [
                    {
                        "id": 12,
                        "employee_id": 1,
                        "date": "2026-06-07",
                        "amount": 1500.00,
                        "payment_method": "Cash",
                        "notes": "Advance for personal expenses",
                        "handled_by": "Rajubhai",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z",
                        "employee": {
                            "id": 1,
                            "employee_name": "Ramesh Kumar",
                            "role": "Stitching Worker",
                            "joining_date": "2026-06-01",
                            "status": "Active",
                            "created_at": "2026-06-07T12:00:00Z",
                            "updated_at": "2026-06-07T12:00:00Z"
                        }
                    }
                ]
            }
        }
    }

class EmployeeUpadSummaryResponse(ResponseEnvelope[EmployeeUpadSummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Employee Upad summary retrieved successfully",
                "data": {
                    "employee_id": 1,
                    "employee_name": "Ramesh Kumar",
                    "total_upad": 3500.00,
                    "current_month_upad": 1500.00,
                    "upad_history": [
                        {
                            "id": 12,
                            "employee_id": 1,
                            "date": "2026-06-07",
                            "amount": 1500.00,
                            "payment_method": "Cash",
                            "notes": "Advance for personal expenses",
                            "handled_by": "Rajubhai",
                            "created_at": "2026-06-07T12:00:00Z",
                            "updated_at": "2026-06-07T12:00:00Z"
                        }
                    ]
                }
            }
        }
    }
