from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from enum import Enum
from app.schemas.employee import ResponseEnvelope
from app.schemas.upad import HandledBy

class SethStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"

class SethPaymentMethod(str, Enum):
    CASH = "Cash"
    GPAY = "GPay"
    BANK_TRANSFER = "Bank Transfer"
    CHEQUE = "Cheque"

# ================= Seth Schemas =================

class SethBase(BaseModel):
    seth_name: str = Field(..., min_length=1, max_length=100, description="Name of the Seth")
    mobile_number: Optional[str] = Field(None, max_length=15, description="Contact mobile number")
    address: Optional[str] = Field(None, max_length=300, description="Office/factory address")
    notes: Optional[str] = Field(None, max_length=500, description="General notes about the Seth")
    status: SethStatus = Field(SethStatus.ACTIVE, description="Activity status")

class SethCreate(SethBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "seth_name": "Lalitbhai RD",
                "mobile_number": "9876543210",
                "address": "GIDC Naroda, Ahmedabad",
                "notes": "Primary work supplier for denim jackets",
                "status": "Active"
            }
        }
    }

class SethUpdate(BaseModel):
    seth_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Name of the Seth")
    mobile_number: Optional[str] = Field(None, max_length=15, description="Contact mobile number")
    address: Optional[str] = Field(None, max_length=300, description="Office/factory address")
    notes: Optional[str] = Field(None, max_length=500, description="General notes about the Seth")
    status: Optional[SethStatus] = Field(None, description="Activity status")

    model_config = {
        "json_schema_extra": {
            "example": {
                "mobile_number": "9998887776",
                "status": "Active"
            }
        }
    }

class SethInDB(SethBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "seth_name": "Lalitbhai RD",
                "mobile_number": "9876543210",
                "address": "GIDC Naroda, Ahmedabad",
                "notes": "Primary work supplier for denim jackets",
                "status": "Active",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

# ================= Seth Payment Schemas =================

class SethPaymentBase(BaseModel):
    seth_id: int = Field(..., description="ID of the Seth making the payment")
    payment_date: date = Field(..., description="Date of payment release")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Payment amount received")
    payment_method: SethPaymentMethod = Field(..., description="Payment channel used")
    notes: Optional[str] = Field(None, max_length=500, description="Additional payment notes")
    handled_by: HandledBy = Field(..., description="Authorized owner receiving the money")

class SethPaymentCreate(SethPaymentBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "seth_id": 1,
                "payment_date": "2026-06-07",
                "amount": 50000.00,
                "payment_method": "Cheque",
                "notes": "Received payment for Lot #104 jackets",
                "handled_by": "Rajubhai"
            }
        }
    }

class SethPaymentInDB(SethPaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 101,
                "seth_id": 1,
                "payment_date": "2026-06-07",
                "amount": 50000.00,
                "payment_method": "Cheque",
                "notes": "Received payment for Lot #104 jackets",
                "handled_by": "Rajubhai",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

# ================= Nested Relation Schemas =================

class SethPaymentWithSeth(SethPaymentInDB):
    seth: Optional[SethInDB] = Field(None, description="Details of the associated Seth")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 101,
                "seth_id": 1,
                "payment_date": "2026-06-07",
                "amount": 50000.00,
                "payment_method": "Cheque",
                "notes": "Received payment for Lot #104 jackets",
                "handled_by": "Rajubhai",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z",
                "seth": {
                    "id": 1,
                    "seth_name": "Lalitbhai RD",
                    "mobile_number": "9876543210",
                    "address": "GIDC Naroda, Ahmedabad",
                    "notes": "Primary work supplier",
                    "status": "Active",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z"
                }
            }
        }
    }

class SethWithPayments(SethInDB):
    payments: List[SethPaymentInDB] = Field(default_list=[], description="All historical payments received from this Seth")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "seth_name": "Lalitbhai RD",
                "mobile_number": "9876543210",
                "address": "GIDC Naroda, Ahmedabad",
                "notes": "Primary work supplier",
                "status": "Active",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z",
                "payments": [
                    {
                        "id": 101,
                        "seth_id": 1,
                        "payment_date": "2026-06-07",
                        "amount": 50000.00,
                        "payment_method": "Cheque",
                        "notes": "Received payment for Lot #104 jackets",
                        "handled_by": "Rajubhai",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                ]
            }
        }
    }

# ================= Response Envelopes =================

class SethSingleResponse(ResponseEnvelope[SethWithPayments]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Seth details retrieved successfully",
                "data": {
                    "id": 1,
                    "seth_name": "Lalitbhai RD",
                    "mobile_number": "9876543210",
                    "address": "GIDC Naroda, Ahmedabad",
                    "notes": "Primary work supplier",
                    "status": "Active",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z",
                    "payments": []
                }
            }
        }
    }

class SethListResponse(ResponseEnvelope[List[SethInDB]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Seths list retrieved successfully",
                "data": [
                    {
                        "id": 1,
                        "seth_name": "Lalitbhai RD",
                        "mobile_number": "9876543210",
                        "address": "GIDC Naroda, Ahmedabad",
                        "notes": "Primary work supplier",
                        "status": "Active",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                ]
            }
        }
    }

class SethPaymentSingleResponse(ResponseEnvelope[SethPaymentWithSeth]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Seth payment registered successfully",
                "data": {
                    "id": 101,
                    "seth_id": 1,
                    "payment_date": "2026-06-07",
                    "amount": 50000.00,
                    "payment_method": "Cheque",
                    "notes": "Received payment for Lot #104 jackets",
                    "handled_by": "Rajubhai",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z",
                    "seth": {
                        "id": 1,
                        "seth_name": "Lalitbhai RD",
                        "mobile_number": "9876543210",
                        "address": "GIDC Naroda, Ahmedabad",
                        "notes": "Primary work supplier",
                        "status": "Active",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z"
                    }
                }
            }
        }
    }

class SethPaymentListResponse(ResponseEnvelope[List[SethPaymentWithSeth]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Seth payments retrieved successfully",
                "data": [
                    {
                        "id": 101,
                        "seth_id": 1,
                        "payment_date": "2026-06-07",
                        "amount": 50000.00,
                        "payment_method": "Cheque",
                        "notes": "Received payment for Lot #104 jackets",
                        "handled_by": "Rajubhai",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z",
                        "seth": {
                            "id": 1,
                            "seth_name": "Lalitbhai RD",
                            "mobile_number": "9876543210",
                            "address": "GIDC Naroda, Ahmedabad",
                            "notes": "Primary work supplier",
                            "status": "Active",
                            "created_at": "2026-06-07T12:00:00Z",
                            "updated_at": "2026-06-07T12:00:00Z"
                        }
                    }
                ]
            }
        }
    }
