from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from enum import Enum
from app.schemas.employee import ResponseEnvelope
from app.schemas.seth import SethInDB

class RollStatus(str, Enum):
    AVAILABLE = "Available"
    PARTIALLY_USED = "Partially Used"
    COMPLETED = "Completed"

class RollBase(BaseModel):
    seth_id: int = Field(..., description="ID of the Seth client who provided the fabric roll")
    entry_date: date = Field(..., description="Date of roll receipt")
    roll_number: str = Field(..., min_length=1, max_length=50, description="Unique identifying roll number")
    short_number: str = Field(..., min_length=1, max_length=50, description="Short code/number marked on roll")
    fabric_type: str = Field(..., min_length=1, max_length=100, description="Type of fabric (e.g. Cotton Denim, Stretch Denim)")
    received_meter: Decimal = Field(..., gt=0, decimal_places=2, description="Total roll length received in meters")
    used_meter: Decimal = Field(Decimal("0.00"), ge=0, decimal_places=2, description="Roll length used in production in meters")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")

class RollCreate(RollBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "seth_id": 1,
                "entry_date": "2026-06-07",
                "roll_number": "R-2026-9081",
                "short_number": "9081",
                "fabric_type": "Knit Denim 12oz",
                "received_meter": 120.50,
                "used_meter": 0.00,
                "notes": "Premium quality indigo roll"
            }
        }
    }

class RollUpdate(BaseModel):
    seth_id: Optional[int] = Field(None, description="ID of the Seth client")
    entry_date: Optional[date] = Field(None, description="Date of roll receipt")
    roll_number: Optional[str] = Field(None, min_length=1, max_length=50, description="Unique identifying roll number")
    short_number: Optional[str] = Field(None, min_length=1, max_length=50, description="Short code/number")
    fabric_type: Optional[str] = Field(None, min_length=1, max_length=100, description="Type of fabric")
    received_meter: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Total roll length received")
    used_meter: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Roll length used")
    status: Optional[RollStatus] = Field(None, description="Current roll availability status")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")

    model_config = {
        "json_schema_extra": {
            "example": {
                "used_meter": 45.20,
                "notes": "Updated used meters after cutting Lot #203"
            }
        }
    }

class RollInDB(RollBase):
    id: int
    remaining_meter: Decimal = Field(..., description="Unused length (received_meter - used_meter)")
    status: RollStatus = Field(..., description="Availability status (automatically assigned or updated)")
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 41,
                "seth_id": 1,
                "entry_date": "2026-06-07",
                "roll_number": "R-2026-9081",
                "short_number": "9081",
                "fabric_type": "Knit Denim 12oz",
                "received_meter": 120.50,
                "used_meter": 45.20,
                "remaining_meter": 75.30,
                "status": "Partially Used",
                "notes": "Premium quality indigo roll",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

class RollWithSeth(RollInDB):
    seth: Optional[SethInDB] = Field(None, description="Details of the supplying Seth client")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 41,
                "seth_id": 1,
                "entry_date": "2026-06-07",
                "roll_number": "R-2026-9081",
                "short_number": "9081",
                "fabric_type": "Knit Denim 12oz",
                "received_meter": 120.50,
                "used_meter": 45.20,
                "remaining_meter": 75.30,
                "status": "Partially Used",
                "notes": "Premium quality indigo roll",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z",
                "seth": {
                    "id": 1,
                    "seth_name": "Lalitbhai RD",
                    "mobile_number": "9876543210",
                    "address": "GIDC Naroda",
                    "status": "Active",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z"
                }
            }
        }
    }

class RollDashboardSummary(BaseModel):
    total_rolls: int = Field(..., description="Total rolls registered")
    available_rolls: int = Field(..., description="Total available (unused) rolls")
    partially_used_rolls: int = Field(..., description="Total partially consumed rolls")
    completed_rolls: int = Field(..., description="Total fully consumed rolls")
    total_remaining_meter: Decimal = Field(..., description="Sum total of remaining fabric meters in warehouse")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_rolls": 150,
                "available_rolls": 90,
                "partially_used_rolls": 40,
                "completed_rolls": 20,
                "total_remaining_meter": 10540.30
            }
        }
    }

# ================= Response Envelopes =================

class RollSingleResponse(ResponseEnvelope[RollWithSeth]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Roll details retrieved successfully",
                "data": {
                    "id": 41,
                    "seth_id": 1,
                    "entry_date": "2026-06-07",
                    "roll_number": "R-2026-9081",
                    "short_number": "9081",
                    "fabric_type": "Knit Denim 12oz",
                    "received_meter": 120.50,
                    "used_meter": 45.20,
                    "remaining_meter": 75.30,
                    "status": "Partially Used",
                    "notes": "Indigo roll",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z",
                    "seth": {
                        "id": 1,
                        "seth_name": "Lalitbhai RD"
                    }
                }
            }
        }
    }

class RollListResponse(ResponseEnvelope[List[RollWithSeth]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Rolls list retrieved successfully",
                "data": [
                    {
                        "id": 41,
                        "seth_id": 1,
                        "entry_date": "2026-06-07",
                        "roll_number": "R-2026-9081",
                        "short_number": "9081",
                        "fabric_type": "Knit Denim 12oz",
                        "received_meter": 120.50,
                        "used_meter": 45.20,
                        "remaining_meter": 75.30,
                        "status": "Partially Used",
                        "notes": "Indigo roll",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z",
                        "seth": {
                            "id": 1,
                            "seth_name": "Lalitbhai RD"
                        }
                    }
                ]
            }
        }
    }

class RollDashboardSummaryResponse(ResponseEnvelope[RollDashboardSummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Roll dashboard metrics compiled successfully",
                "data": {
                    "total_rolls": 150,
                    "available_rolls": 90,
                    "partially_used_rolls": 40,
                    "completed_rolls": 20,
                    "total_remaining_meter": 10540.30
                }
            }
        }
    }
