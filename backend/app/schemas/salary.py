from pydantic import BaseModel, Field, model_validator
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from app.schemas.upad import PaymentMethod, HandledBy, ResponseEnvelope
from app.schemas.employee import EmployeeInDB

class SalaryBase(BaseModel):
    employee_id: int = Field(..., description="ID of the employee")
    salary_month: int = Field(..., ge=1, le=12, description="Month of the salary period (1-12)")
    salary_year: int = Field(..., ge=2000, le=2100, description="Year of the salary period (e.g. 2026)")
    salary_amount: Decimal = Field(..., ge=0, decimal_places=2, description="Finalized salary amount for the month")
    paid_amount: Decimal = Field(..., ge=0, decimal_places=2, description="Amount paid out to the employee")
    payment_method: PaymentMethod = Field(..., description="Payment channel used")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")
    handled_by: HandledBy = Field(..., description="Authorized person handing over the payment")
    payment_date: date = Field(..., description="Date of payment transfer")

    @model_validator(mode="after")
    def validate_amounts(self) -> 'SalaryBase':
        if self.paid_amount > self.salary_amount:
            raise ValueError("Paid Amount cannot exceed Salary Amount.")
        return self

class SalaryCreate(SalaryBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "employee_id": 1,
                "salary_month": 6,
                "salary_year": 2026,
                "salary_amount": 18000.00,
                "paid_amount": 15000.00,
                "payment_method": "Cash",
                "notes": "Salary finalized for stitching operations",
                "handled_by": "Rajubhai",
                "payment_date": "2026-06-07"
            }
        }
    }

class SalaryUpdate(BaseModel):
    employee_id: Optional[int] = Field(None, description="ID of the employee")
    salary_month: Optional[int] = Field(None, ge=1, le=12, description="Month of the salary period (1-12)")
    salary_year: Optional[int] = Field(None, ge=2000, le=2100, description="Year of the salary period (e.g. 2026)")
    salary_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Finalized salary amount")
    paid_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Amount paid out")
    payment_method: Optional[PaymentMethod] = Field(None, description="Payment channel used")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")
    handled_by: Optional[HandledBy] = Field(None, description="Authorized person handing over the payment")
    payment_date: Optional[date] = Field(None, description="Date of payment transfer")

    model_config = {
        "json_schema_extra": {
            "example": {
                "paid_amount": 18000.00,
                "notes": "Paid remaining balance of 3000"
            }
        }
    }

class SalaryInDB(SalaryBase):
    id: int
    remaining_amount: Decimal = Field(..., description="Calculated balance (salary_amount - paid_amount)")
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 5,
                "employee_id": 1,
                "salary_month": 6,
                "salary_year": 2026,
                "salary_amount": 18000.00,
                "paid_amount": 15000.00,
                "remaining_amount": 3000.00,
                "payment_method": "Cash",
                "notes": "Salary finalized for stitching operations",
                "handled_by": "Rajubhai",
                "payment_date": "2026-06-07",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

class SalaryWithEmployee(SalaryInDB):
    employee: Optional[EmployeeInDB] = Field(None, description="Associated employee details")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 5,
                "employee_id": 1,
                "salary_month": 6,
                "salary_year": 2026,
                "salary_amount": 18000.00,
                "paid_amount": 15000.00,
                "remaining_amount": 3000.00,
                "payment_method": "Cash",
                "notes": "Salary finalized for stitching operations",
                "handled_by": "Rajubhai",
                "payment_date": "2026-06-07",
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

class EmployeeSalarySummary(BaseModel):
    employee_id: int
    employee_name: str
    last_salary: Optional[SalaryInDB] = Field(None, description="The most recent salary payment record")
    pending_salary: Decimal = Field(..., description="Total outstanding salary (remaining_amount sum)")
    current_month_salary_paid: Decimal = Field(..., description="Total salary paid out in the current month")
    salary_history: List[SalaryInDB] = Field(default_list=[], description="Complete historical salary payment records")

    model_config = {
        "json_schema_extra": {
            "example": {
                "employee_id": 1,
                "employee_name": "Ramesh Kumar",
                "last_salary": {
                    "id": 5,
                    "employee_id": 1,
                    "salary_month": 6,
                    "salary_year": 2026,
                    "salary_amount": 18000.00,
                    "paid_amount": 15000.00,
                    "remaining_amount": 3000.00,
                    "payment_method": "Cash",
                    "notes": "Salary finalized",
                    "handled_by": "Rajubhai",
                    "payment_date": "2026-06-07",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z"
                },
                "pending_salary": 3000.00,
                "current_month_salary_paid": 15000.00,
                "salary_history": []
            }
        }
    }

# Envelopes
class SalarySingleResponse(ResponseEnvelope[SalaryWithEmployee]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Salary record retrieved successfully",
                "data": {
                    "id": 5,
                    "employee_id": 1,
                    "salary_month": 6,
                    "salary_year": 2026,
                    "salary_amount": 18000.00,
                    "paid_amount": 15000.00,
                    "remaining_amount": 3000.00,
                    "payment_method": "Cash",
                    "notes": "Salary finalized for stitching operations",
                    "handled_by": "Rajubhai",
                    "payment_date": "2026-06-07",
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

class SalaryListResponse(ResponseEnvelope[List[SalaryWithEmployee]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Salary records retrieved successfully",
                "data": [
                    {
                        "id": 5,
                        "employee_id": 1,
                        "salary_month": 6,
                        "salary_year": 2026,
                        "salary_amount": 18000.00,
                        "paid_amount": 15000.00,
                        "remaining_amount": 3000.00,
                        "payment_method": "Cash",
                        "notes": "Salary finalized for stitching operations",
                        "handled_by": "Rajubhai",
                        "payment_date": "2026-06-07",
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

class EmployeeSalarySummaryResponse(ResponseEnvelope[EmployeeSalarySummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Employee salary summary retrieved successfully",
                "data": {
                    "employee_id": 1,
                    "employee_name": "Ramesh Kumar",
                    "last_salary": {
                        "id": 5,
                        "employee_id": 1,
                        "salary_month": 6,
                        "salary_year": 2026,
                        "salary_amount": 18000.00,
                        "paid_amount": 15000.00,
                        "remaining_amount": 3000.00,
                        "payment_method": "Cash",
                        "notes": "Salary finalized",
                        "handled_by": "Rajubhai",
                        "payment_date": "2026-06-07",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    },
                    "pending_salary": 3000.00,
                    "current_month_salary_paid": 15000.00,
                    "salary_history": []
                }
            }
        }
    }
