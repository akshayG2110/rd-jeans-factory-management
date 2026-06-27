from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.roll import (
    RollCreate,
    RollUpdate,
    RollSingleResponse,
    RollListResponse,
    RollDashboardSummaryResponse,
    RollStatus
)
from app.services.roll import RollService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/rolls",
    tags=["Roll Inventory"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "",
    response_model=RollSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new fabric roll record",
    response_description="Fabric roll registered successfully and traceable in system"
)
def create_roll_entry(roll_in: RollCreate, db: Session = Depends(get_db)):
    try:
        roll = RollService.create(db=db, roll_in=roll_in)
        return {
            "success": True,
            "message": "Fabric roll registered successfully",
            "data": roll
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
    response_model=RollDashboardSummaryResponse,
    summary="Get summary metrics across all fabric rolls (Total, Available, Consumed)",
    response_description="Aggregated count details and total remaining fabric meterage"
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    summary = RollService.get_summary_metrics(db=db)
    return {
        "success": True,
        "message": "Roll dashboard metrics compiled successfully",
        "data": summary
    }

@router.get(
    "",
    response_model=RollListResponse,
    summary="Get all fabric rolls",
    response_description="List of all fabric rolls in inventory matching filters and search queries"
)
def get_all_rolls(
    seth_id: Optional[int] = Query(None, description="Filter records by Seth supplier ID"),
    roll_number: Optional[str] = Query(None, description="Filter records by exact Roll Number"),
    short_number: Optional[str] = Query(None, description="Filter records by exact Short Number"),
    status: Optional[RollStatus] = Query(None, description="Filter records by status"),
    date_from: Optional[date] = Query(None, description="Filter records by receipt start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter records by receipt end date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Partial matching search support (matches Roll Number, Short Number, Fabric Type)"),
    db: Session = Depends(get_db)
):
    status_val = status.value if status else None
    rolls = RollService.get_all(
        db=db,
        seth_id=seth_id,
        roll_number=roll_number,
        short_number=short_number,
        status=status_val,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    return {
        "success": True,
        "message": "Fabric rolls list retrieved successfully",
        "data": rolls
    }

@router.get(
    "/{id}",
    response_model=RollSingleResponse,
    summary="Get detailed fabric roll profile by ID",
    response_description="Detailed specifications of the selected roll"
)
def get_roll_details(id: int, db: Session = Depends(get_db)):
    roll = RollService.get_by_id(db=db, roll_id=id)
    if not roll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Fabric roll with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Fabric roll details retrieved successfully",
        "data": roll
    }

@router.put(
    "/{id}",
    response_model=RollSingleResponse,
    summary="Update fabric roll details (recalculates remaining meter & status)",
    response_description="The updated fabric roll details"
)
def update_roll(id: int, roll_in: RollUpdate, db: Session = Depends(get_db)):
    roll = RollService.get_by_id(db=db, roll_id=id)
    if not roll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Fabric roll with ID {id} not found",
                "data": None
            }
        )
    try:
        updated_roll = RollService.update(db=db, db_roll=roll, roll_in=roll_in)
        return {
            "success": True,
            "message": "Fabric roll updated successfully",
            "data": updated_roll
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
    response_model=RollSingleResponse,
    summary="Delete a fabric roll from system",
    response_description="The deleted fabric roll details"
)
def delete_roll(id: int, db: Session = Depends(get_db)):
    roll = RollService.get_by_id(db=db, roll_id=id)
    if not roll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Fabric roll with ID {id} not found",
                "data": None
            }
        )
    # Store copy for response
    deleted_data = {
        "id": roll.id,
        "seth_id": roll.seth_id,
        "entry_date": roll.entry_date,
        "roll_number": roll.roll_number,
        "short_number": roll.short_number,
        "fabric_type": roll.fabric_type,
        "received_meter": roll.received_meter,
        "used_meter": roll.used_meter,
        "remaining_meter": roll.remaining_meter,
        "status": roll.status,
        "notes": roll.notes,
        "created_at": roll.created_at,
        "updated_at": roll.updated_at,
        "seth": roll.seth
    }
    RollService.delete(db=db, db_roll=roll)
    return {
        "success": True,
        "message": "Fabric roll deleted successfully",
        "data": deleted_data
    }
