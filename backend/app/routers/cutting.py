from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.cutting import (
    CuttingCreate,
    CuttingUpdate,
    CuttingSingleResponse,
    CuttingListResponse,
    CuttingDashboardSummaryResponse
)
from app.services.cutting import CuttingService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/cutting",
    tags=["Cutting Operations"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "",
    response_model=CuttingSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new cutting entry",
    response_description="Cutting lot registered successfully and roll inventory updated"
)
def create_cutting_entry(cutting_in: CuttingCreate, db: Session = Depends(get_db)):
    try:
        cutting = CuttingService.create(db=db, cutting_in=cutting_in)
        return {
            "success": True,
            "message": "Cutting entry created successfully. Roll inventory updated.",
            "data": cutting
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": str(e),
                "data": None
            }
        )

@router.get(
    "/dashboard/summary",
    response_model=CuttingDashboardSummaryResponse,
    summary="Get cutting dashboard metrics summary",
    response_description="Compiled cutting production KPIs"
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    summary = CuttingService.get_dashboard_summary(db=db)
    return {
        "success": True,
        "message": "Cutting dashboard metrics compiled successfully",
        "data": summary
    }

@router.get(
    "",
    response_model=CuttingListResponse,
    summary="Get all cutting entries",
    response_description="List of all cutting operations matching query filters"
)
def get_all_cutting_entries(
    lot_number: Optional[str] = Query(None, description="Filter records by exact Lot Number"),
    roll_number: Optional[str] = Query(None, description="Filter records by exact Roll Number"),
    seth_name: Optional[str] = Query(None, description="Filter records by Seth Name (partial match)"),
    size: Optional[str] = Query(None, description="Filter records by Size (e.g. 30, 32, 34)"),
    sort_number: Optional[str] = Query(None, description="Filter records by Sort Code"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Partial matching search query (matches Lot Number, Roll Number, Sort Number)"),
    db: Session = Depends(get_db)
):
    cuttings = CuttingService.get_all(
        db=db,
        lot_number=lot_number,
        roll_number=roll_number,
        seth_name=seth_name,
        size=size,
        sort_number=sort_number,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    return {
        "success": True,
        "message": "Cutting entries list retrieved successfully",
        "data": cuttings
    }

@router.get(
    "/{id}",
    response_model=CuttingSingleResponse,
    summary="Get cutting details by ID",
    response_description="Detailed operations statistics of selected cutting lot"
)
def get_cutting_details(id: int, db: Session = Depends(get_db)):
    cutting = CuttingService.get_by_id(db=db, cutting_id=id)
    if not cutting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Cutting entry with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Cutting details retrieved successfully",
        "data": cutting
    }

@router.put(
    "/{id}",
    response_model=CuttingSingleResponse,
    summary="Update cutting details (verifies roll capacity balances)",
    response_description="The updated cutting details"
)
def update_cutting_entry(id: int, cutting_in: CuttingUpdate, db: Session = Depends(get_db)):
    cutting = CuttingService.get_by_id(db=db, cutting_id=id)
    if not cutting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Cutting entry with ID {id} not found",
                "data": None
            }
        )
    try:
        updated_cutting = CuttingService.update(db=db, db_cutting=cutting, cutting_in=cutting_in)
        return {
            "success": True,
            "message": "Cutting entry updated successfully",
            "data": updated_cutting
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": str(e),
                "data": None
            }
        )

@router.delete(
    "/{id}",
    response_model=CuttingSingleResponse,
    summary="Delete cutting entry and restore roll balance",
    response_description="The deleted cutting details"
)
def delete_cutting_entry(id: int, db: Session = Depends(get_db)):
    cutting = CuttingService.get_by_id(db=db, cutting_id=id)
    if not cutting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Cutting entry with ID {id} not found",
                "data": None
            }
        )
    # Store copy for response
    deleted_data = {
        "id": cutting.id,
        "cutting_date": cutting.cutting_date,
        "lot_number": cutting.lot_number,
        "roll_id": cutting.roll_id,
        "meter_used": cutting.meter_used,
        "layer_information": cutting.layer_information,
        "piece_count": cutting.piece_count,
        "size": cutting.size,
        "pana": cutting.pana,
        "average": cutting.average,
        "sort_number": cutting.sort_number,
        "notes": cutting.notes,
        "created_at": cutting.created_at,
        "updated_at": cutting.updated_at,
        "roll": cutting.roll
    }
    CuttingService.delete(db=db, db_cutting=cutting)
    return {
        "success": True,
        "message": "Cutting entry deleted successfully and roll fabric length restored.",
        "data": deleted_data
    }

