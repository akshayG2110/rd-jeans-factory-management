from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.upad import (
    UpadCreate,
    UpadUpdate,
    UpadSingleResponse,
    UpadListResponse,
    EmployeeUpadSummaryResponse,
    PaymentMethod,
    HandledBy
)
from app.services.upad import UpadService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/upad",
    tags=["Upad (Advances)"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "",
    response_model=UpadSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Upad entry",
    response_description="The Upad entry created successfully and Cash Book event is ready"
)
def create_upad_entry(upad_in: UpadCreate, db: Session = Depends(get_db)):
    try:
        upad = UpadService.create(db=db, upad_in=upad_in)
        # Cash Book integration payload preparation demo
        cash_book_transaction = UpadService.generate_cash_book_transaction(upad)
        
        return {
            "success": True,
            "message": f"Upad entry created successfully. Cash Book transaction logged: {cash_book_transaction['direction']} - {cash_book_transaction['amount']} via {cash_book_transaction['method']}",
            "data": upad
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
    "",
    response_model=UpadListResponse,
    summary="Get all Upad records",
    response_description="List of all Upad records matching query filters (Date Wise, Employee Wise, Method Wise)"
)
def get_all_upad_records(
    employee_id: Optional[int] = Query(None, description="Filter records by employee ID"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    payment_method: Optional[PaymentMethod] = Query(None, description="Filter records by payment method"),
    handled_by: Optional[HandledBy] = Query(None, description="Filter records by supervisor handling the payout"),
    db: Session = Depends(get_db)
):
    method_val = payment_method.value if payment_method else None
    handler_val = handled_by.value if handled_by else None
    
    upads = UpadService.get_all(
        db=db,
        employee_id=employee_id,
        date_from=date_from,
        date_to=date_to,
        payment_method=method_val,
        handled_by=handler_val
    )
    return {
        "success": True,
        "message": "Upad records retrieved successfully",
        "data": upads
    }

@router.get(
    "/{id}",
    response_model=UpadSingleResponse,
    summary="Get single Upad record details",
    response_description="Detailed information of the selected Upad transaction"
)
def get_upad_record(id: int, db: Session = Depends(get_db)):
    upad = UpadService.get_by_id(db=db, upad_id=id)
    if not upad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Upad record with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Upad record retrieved successfully",
        "data": upad
    }

@router.put(
    "/{id}",
    response_model=UpadSingleResponse,
    summary="Update an existing Upad record",
    response_description="The updated Upad transaction details"
)
def update_upad_record(id: int, upad_in: UpadUpdate, db: Session = Depends(get_db)):
    upad = UpadService.get_by_id(db=db, upad_id=id)
    if not upad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Upad record with ID {id} not found",
                "data": None
            }
        )
    try:
        updated_upad = UpadService.update(db=db, db_upad=upad, upad_in=upad_in)
        return {
            "success": True,
            "message": "Upad record updated successfully",
            "data": updated_upad
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
    response_model=UpadSingleResponse,
    summary="Delete a Upad record",
    response_description="The deleted Upad record reference"
)
def delete_upad_record(id: int, db: Session = Depends(get_db)):
    upad = UpadService.get_by_id(db=db, upad_id=id)
    if not upad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Upad record with ID {id} not found",
                "data": None
            }
        )
    # Store a copy for response serialization before deletion
    deleted_upad_data = {
        "id": upad.id,
        "employee_id": upad.employee_id,
        "date": upad.date,
        "amount": upad.amount,
        "payment_method": upad.payment_method,
        "notes": upad.notes,
        "handled_by": upad.handled_by,
        "created_at": upad.created_at,
        "updated_at": upad.updated_at,
        "employee": upad.employee
    }
    UpadService.delete(db=db, db_upad=upad)
    return {
        "success": True,
        "message": "Upad record deleted successfully",
        "data": deleted_upad_data
    }

@router.get(
    "/employee/{employee_id}/summary",
    response_model=EmployeeUpadSummaryResponse,
    summary="Get employee Upad profile summary (History, Total, Month Totals)",
    response_description="Summary analytics of Upad totals and history for an employee"
)
def get_employee_upad_summary(employee_id: int, db: Session = Depends(get_db)):
    try:
        summary = UpadService.get_employee_summary(db=db, employee_id=employee_id)
        return {
            "success": True,
            "message": "Employee Upad summary generated successfully",
            "data": summary
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": str(e),
                "data": None
            }
        )
