from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.partner import (
    PartnerPassbookListResponse,
    PartnerSummaryResponse
)
from app.schemas.cashbook import CashBookTransactionType
from app.schemas.seth import SethPaymentMethod
from app.services.partner import PartnerService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/partners",
    tags=["Partners Management"],
    dependencies=[Depends(get_current_user)]
)

@router.get(
    "/summary",
    response_model=PartnerSummaryResponse,
    summary="Get overall partners metrics summary",
    response_description="Returns factory balance and individual partner cash inflow/outflow activity summaries"
)
def get_partners_summary(db: Session = Depends(get_db)):
    summary = PartnerService.get_partners_summary(db=db)
    return {
        "success": True,
        "message": "Partners factory summary compiled successfully",
        "data": summary
    }

@router.get(
    "/all",
    response_model=PartnerPassbookListResponse,
    summary="Get complete transaction history (All Transactions View)",
    response_description="Ledger entries listing cash book balances and notes"
)
def get_all_transactions(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    transaction_type: Optional[CashBookTransactionType] = Query(None, description="Filter by Category"),
    payment_method: Optional[SethPaymentMethod] = Query(None, description="Filter by Method"),
    db: Session = Depends(get_db)
):
    type_val = transaction_type.value if transaction_type else None
    method_val = payment_method.value if payment_method else None
    
    transactions = PartnerService.get_partner_transactions(
        db=db,
        handled_by=None,
        date_from=date_from,
        date_to=date_to,
        transaction_type=type_val,
        payment_method=method_val
    )
    return {
        "success": True,
        "message": "Complete transaction history retrieved successfully",
        "data": transactions
    }

@router.get(
    "/rajubhai",
    response_model=PartnerPassbookListResponse,
    summary="Get Rajubhai transaction history",
    response_description="Ledger entries handled by Rajubhai"
)
def get_rajubhai_transactions(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    transaction_type: Optional[CashBookTransactionType] = Query(None, description="Filter by Category"),
    payment_method: Optional[SethPaymentMethod] = Query(None, description="Filter by Method"),
    db: Session = Depends(get_db)
):
    type_val = transaction_type.value if transaction_type else None
    method_val = payment_method.value if payment_method else None
    
    transactions = PartnerService.get_partner_transactions(
        db=db,
        handled_by="Rajubhai",
        date_from=date_from,
        date_to=date_to,
        transaction_type=type_val,
        payment_method=method_val
    )
    return {
        "success": True,
        "message": "Rajubhai transaction history retrieved successfully",
        "data": transactions
    }

@router.get(
    "/dhruveshbhai",
    response_model=PartnerPassbookListResponse,
    summary="Get Dhruveshbhai transaction history",
    response_description="Ledger entries handled by Dhruveshbhai"
)
def get_dhruveshbhai_transactions(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    transaction_type: Optional[CashBookTransactionType] = Query(None, description="Filter by Category"),
    payment_method: Optional[SethPaymentMethod] = Query(None, description="Filter by Method"),
    db: Session = Depends(get_db)
):
    type_val = transaction_type.value if transaction_type else None
    method_val = payment_method.value if payment_method else None
    
    transactions = PartnerService.get_partner_transactions(
        db=db,
        handled_by="Dhruveshbhai",
        date_from=date_from,
        date_to=date_to,
        transaction_type=type_val,
        payment_method=method_val
    )
    return {
        "success": True,
        "message": "Dhruveshbhai transaction history retrieved successfully",
        "data": transactions
    }
