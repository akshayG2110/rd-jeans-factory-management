from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List, Generic, TypeVar, Any
from enum import Enum

class EmployeeStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"

class EmployeeRole(str, Enum):
    STITCHING_WORKER = "Stitching Worker"
    CUTTING_WORKER = "Cutting Worker"
    HELPER = "Helper"
    INDOOR_STAFF = "Indoor Staff"
    OUTDOOR_STAFF = "Outdoor Staff"
    SUPERVISOR = "Supervisor"

# Reusable Type Variable for the Envelope Pattern
T = TypeVar("T")

class ResponseEnvelope(BaseModel, Generic[T]):
    success: bool = Field(..., description="Indicates if the operation was successful.")
    message: str = Field(..., description="Response message detailing the outcome.")
    data: Optional[T] = Field(None, description="Response payload data.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": None
            }
        }
    }

class EmployeeBase(BaseModel):
    employee_name: str = Field(..., min_length=1, max_length=100, description="Name of the employee")
    role: EmployeeRole = Field(..., description="Role of the employee in the factory")
    joining_date: date = Field(..., description="Date when the employee joined")
    status: EmployeeStatus = Field(EmployeeStatus.ACTIVE, description="Employment status")

class EmployeeCreate(EmployeeBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "employee_name": "Ramesh Kumar",
                "role": "Stitching Worker",
                "joining_date": "2026-06-01",
                "status": "Active"
            }
        }
    }

class EmployeeUpdate(BaseModel):
    employee_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Name of the employee")
    role: Optional[EmployeeRole] = Field(None, description="Role of the employee in the factory")
    joining_date: Optional[date] = Field(None, description="Date when the employee joined")
    status: Optional[EmployeeStatus] = Field(None, description="Employment status")

    model_config = {
        "json_schema_extra": {
            "example": {
                "employee_name": "Ramesh Kumar",
                "role": "Stitching Worker",
                "status": "Active"
            }
        }
    }

class EmployeeInDB(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
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

# Specific envelopes for Swagger UI documentation details
class EmployeeSingleResponse(ResponseEnvelope[EmployeeInDB]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Employee details retrieved successfully",
                "data": {
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

class EmployeeListResponse(ResponseEnvelope[List[EmployeeInDB]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Employees list retrieved successfully",
                "data": [
                    {
                        "id": 1,
                        "employee_name": "Ramesh Kumar",
                        "role": "Stitching Worker",
                        "joining_date": "2026-06-01",
                        "status": "Active",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                ]
            }
        }
    }
