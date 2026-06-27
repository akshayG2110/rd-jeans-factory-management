from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.cashbook import (
    CashBookSingleResponse,
    CashBookListResponse,
    CashBookDashboardSummaryResponse,
    CashBookTransactionType
)
from app.schemas.seth import SethPaymentMethod
from app.schemas.upad import HandledBy
from app.services.cashbook import CashBookService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/cashbook",
    tags=["Cash Book Ledger"],
    dependencies=[Depends(get_current_user)]
)

@router.get(
    "/dashboard/summary",
    response_model=CashBookDashboardSummaryResponse,
    summary="Get cash book dashboard metrics summary",
    response_description="Current Cash Balance, Today's Cash In/Out, Monthly Cash In/Out"
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    summary = CashBookService.get_dashboard_summary(db=db)
    return {
        "success": True,
        "message": "Cash Book dashboard metrics compiled successfully",
        "data": summary
    }

@router.get(
    "",
    response_model=CashBookListResponse,
    summary="Get all Cash Book passbook entries",
    response_description="List of all cash flow transactions matching query filters"
)
def get_all_cashbook_entries(
    transaction_type: Optional[CashBookTransactionType] = Query(None, description="Filter by transaction type"),
    payment_method: Optional[SethPaymentMethod] = Query(None, description="Filter by payment method"),
    handled_by: Optional[HandledBy] = Query(None, description="Filter by owner handling the transaction (partner view)"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Partial matching search query (matches Name, Notes)"),
    db: Session = Depends(get_db)
):
    type_val = transaction_type.value if transaction_type else None
    method_val = payment_method.value if payment_method else None
    handler_val = handled_by.value if handled_by else None
    
    entries = CashBookService.get_all(
        db=db,
        transaction_type=type_val,
        payment_method=method_val,
        handled_by=handler_val,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    return {
        "success": True,
        "message": "Cash Book passbook entries list retrieved successfully",
        "data": entries
    }

@router.get(
    "/{id}",
    response_model=CashBookSingleResponse,
    summary="Get cash book entry details by ID"
)
def get_cashbook_entry_details(id: int, db: Session = Depends(get_db)):
    entry = CashBookService.get_by_id(db=db, entry_id=id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Cash Book entry with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Cash Book transaction entry retrieved successfully",
        "data": entry
    }
