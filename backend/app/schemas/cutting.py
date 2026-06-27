from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from app.schemas.employee import ResponseEnvelope
from app.schemas.roll import RollWithSeth

class CuttingBase(BaseModel):
    cutting_date: date = Field(..., description="Date of cutting lot operations")
    lot_number: str = Field(..., min_length=1, max_length=50, description="Unique identifying lot number")
    roll_id: int = Field(..., description="ID of the fabric roll consumed")
    meter_used: Decimal = Field(..., gt=0, decimal_places=2, description="Length of fabric consumed in meters")
    layer_information: Optional[str] = Field(None, max_length=200, description="Details of fabric layers/plies stacked")
    piece_count: int = Field(..., gt=0, description="Number of pieces generated from cutting lot")
    size: str = Field(..., min_length=1, max_length=50, description="Size details of pieces (e.g. 30, 32, 34 or L, XL)")
    pana: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Width of fabric roll (Pana) in inches")
    average: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Average fabric consumption per piece in meters")
    sort_number: Optional[str] = Field(None, max_length=50, description="Lot sort/shade number code")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")

class CuttingCreate(CuttingBase):
    model_config = {
        "json_schema_extra": {
            "example": {
                "cutting_date": "2026-06-07",
                "lot_number": "LOT-2026-102A",
                "roll_id": 1,
                "meter_used": 45.50,
                "layer_information": "48 Layers of Knit Denim",
                "piece_count": 120,
                "size": "32",
                "pana": 58.00,
                "average": 0.38,
                "sort_number": "SN-9081",
                "notes": "Premium quality finish cutting"
            }
        }
    }

class CuttingUpdate(BaseModel):
    cutting_date: Optional[date] = Field(None, description="Date of cutting lot operations")
    lot_number: Optional[str] = Field(None, min_length=1, max_length=50, description="Unique identifying lot number")
    roll_id: Optional[int] = Field(None, description="ID of the fabric roll consumed")
    meter_used: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Length of fabric consumed in meters")
    layer_information: Optional[str] = Field(None, max_length=200, description="Details of fabric layers/plies")
    piece_count: Optional[int] = Field(None, gt=0, description="Number of pieces generated")
    size: Optional[str] = Field(None, min_length=1, max_length=50, description="Size details")
    pana: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Width of fabric roll")
    average: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Average fabric consumption per piece")
    sort_number: Optional[str] = Field(None, max_length=50, description="Lot sort/shade number code")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes/remarks")

    model_config = {
        "json_schema_extra": {
            "example": {
                "piece_count": 122,
                "notes": "Recounted piece adjustments"
            }
        }
    }

class CuttingInDB(CuttingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 15,
                "cutting_date": "2026-06-07",
                "lot_number": "LOT-2026-102A",
                "roll_id": 1,
                "meter_used": 45.50,
                "layer_information": "48 Layers of Knit Denim",
                "piece_count": 120,
                "size": "32",
                "pana": 58.00,
                "average": 0.38,
                "sort_number": "SN-9081",
                "notes": "Premium quality finish cutting",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z"
            }
        }
    }

class CuttingWithDetails(CuttingInDB):
    roll: Optional[RollWithSeth] = Field(None, description="Details of the consumed roll supplier and meter values")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 15,
                "cutting_date": "2026-06-07",
                "lot_number": "LOT-2026-102A",
                "roll_id": 1,
                "meter_used": 45.50,
                "layer_information": "48 Layers of Knit Denim",
                "piece_count": 120,
                "size": "32",
                "pana": 58.00,
                "average": 0.38,
                "sort_number": "SN-9081",
                "notes": "Premium quality finish cutting",
                "created_at": "2026-06-07T12:00:00Z",
                "updated_at": "2026-06-07T12:00:00Z",
                "roll": {
                    "id": 1,
                    "seth_id": 1,
                    "entry_date": "2026-06-07",
                    "roll_number": "R-2026-9081",
                    "short_number": "9081",
                    "fabric_type": "Knit Denim 12oz",
                    "received_meter": 120.50,
                    "used_meter": 45.50,
                    "remaining_meter": 75.00,
                    "status": "Partially Used",
                    "seth": {
                        "id": 1,
                        "seth_name": "Lalitbhai RD"
                    }
                }
            }
        }
    }

class CuttingDashboardSummary(BaseModel):
    total_cutting_lots: int = Field(..., description="Total cutting operations lots run")
    total_pieces_generated: int = Field(..., description="Sum total of generated apparel pieces")
    today_cutting_lots: int = Field(..., description="Lots cut on the calendar day today")
    today_pieces_generated: int = Field(..., description="Apparel pieces generated today")
    monthly_pieces_generated: int = Field(..., description="Apparel pieces generated in the current month")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_cutting_lots": 82,
                "total_pieces_generated": 9840,
                "today_cutting_lots": 3,
                "today_pieces_generated": 360,
                "monthly_pieces_generated": 5200
            }
        }
    }

# ================= Response Envelopes =================

class CuttingSingleResponse(ResponseEnvelope[CuttingWithDetails]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Cutting lot retrieved successfully",
                "data": {
                    "id": 15,
                    "cutting_date": "2026-06-07",
                    "lot_number": "LOT-2026-102A",
                    "roll_id": 1,
                    "meter_used": 45.50,
                    "layer_information": "48 Layers of Knit Denim",
                    "piece_count": 120,
                    "size": "32",
                    "pana": 58.00,
                    "average": 0.38,
                    "sort_number": "SN-9081",
                    "notes": "Premium quality finish cutting",
                    "created_at": "2026-06-07T12:00:00Z",
                    "updated_at": "2026-06-07T12:00:00Z",
                    "roll": {
                        "id": 1,
                        "seth_id": 1,
                        "roll_number": "R-2026-9081",
                        "short_number": "9081",
                        "fabric_type": "Knit Denim 12oz",
                        "seth": {
                            "seth_name": "Lalitbhai RD"
                        }
                    }
                }
            }
        }
    }

class CuttingListResponse(ResponseEnvelope[List[CuttingWithDetails]]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Cutting entries retrieved successfully",
                "data": [
                    {
                        "id": 15,
                        "cutting_date": "2026-06-07",
                        "lot_number": "LOT-2026-102A",
                        "roll_id": 1,
                        "meter_used": 45.50,
                        "layer_information": "48 Layers of Knit Denim",
                        "piece_count": 120,
                        "size": "32",
                        "pana": 58.00,
                        "average": 0.38,
                        "sort_number": "SN-9081",
                        "notes": "Premium quality finish cutting",
                        "created_at": "2026-06-07T12:00:00Z",
                        "updated_at": "2026-06-07T12:00:00Z",
                        "roll": {
                            "id": 1,
                            "seth_id": 1,
                            "roll_number": "R-2026-9081",
                            "short_number": "9081",
                            "fabric_type": "Knit Denim 12oz",
                            "seth": {
                                "seth_name": "Lalitbhai RD"
                            }
                        }
                    }
                ]
            }
        }
    }

class CuttingDashboardSummaryResponse(ResponseEnvelope[CuttingDashboardSummary]):
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Cutting dashboard metrics compiled successfully",
                "data": {
                    "total_cutting_lots": 82,
                    "total_pieces_generated": 9840,
                    "today_cutting_lots": 3,
                    "today_pieces_generated": 360,
                    "monthly_pieces_generated": 5200
                }
            }
        }
    }
