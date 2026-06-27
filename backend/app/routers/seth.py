from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.seth import (
    SethCreate,
    SethUpdate,
    SethSingleResponse,
    SethListResponse,
    SethPaymentCreate,
    SethPaymentSingleResponse,
    SethPaymentListResponse,
    SethStatus,
    SethPaymentMethod
)
from app.schemas.upad import HandledBy
from app.services.seth import SethService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

seth_router = APIRouter(
    prefix="/seths",
    tags=["Seths (Clients)"],
    dependencies=[Depends(get_current_user)]
)
payment_router = APIRouter(
    prefix="/seth-payments",
    tags=["Seth Payments (Inflow)"],
    dependencies=[Depends(get_current_user)]
)

# ================= Seth Endpoints =================

@seth_router.post(
    "",
    response_model=SethSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Seth client profile"
)
def create_seth_client(seth_in: SethCreate, db: Session = Depends(get_db)):
    seth = SethService.create_seth(db=db, seth_in=seth_in)
    return {
        "success": True,
        "message": "Seth profile created successfully",
        "data": seth
    }

@seth_router.get(
    "",
    response_model=SethListResponse,
    summary="Get all Seth profiles"
)
def get_all_seth_profiles(
    status: Optional[SethStatus] = Query(None, description="Filter seths by status"),
    db: Session = Depends(get_db)
):
    status_val = status.value if status else None
    seths = SethService.get_all_seths(db=db, status=status_val)
    return {
        "success": True,
        "message": "Seths retrieved successfully",
        "data": seths
    }

@seth_router.get(
    "/{id}",
    response_model=SethSingleResponse,
    summary="Get Seth details by ID (including payment history)"
)
def get_seth_details(id: int, db: Session = Depends(get_db)):
    seth = SethService.get_seth_by_id(db=db, seth_id=id)
    if not seth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Seth with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Seth details retrieved successfully",
        "data": seth
    }

@seth_router.put(
    "/{id}",
    response_model=SethSingleResponse,
    summary="Update Seth profile details"
)
def update_seth_profile(id: int, seth_in: SethUpdate, db: Session = Depends(get_db)):
    seth = SethService.get_seth_by_id(db=db, seth_id=id)
    if not seth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Seth with ID {id} not found",
                "data": None
            }
        )
    updated_seth = SethService.update_seth(db=db, db_seth=seth, seth_in=seth_in)
    return {
        "success": True,
        "message": "Seth profile updated successfully",
        "data": updated_seth
    }

@seth_router.delete(
    "/{id}",
    response_model=SethSingleResponse,
    summary="Soft delete a Seth profile (set status to Inactive)"
)
def delete_seth_profile(id: int, db: Session = Depends(get_db)):
    seth = SethService.get_seth_by_id(db=db, seth_id=id)
    if not seth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Seth with ID {id} not found",
                "data": None
            }
        )
    deleted_seth = SethService.soft_delete_seth(db=db, db_seth=seth)
    return {
        "success": True,
        "message": "Seth profile soft deleted successfully (status changed to Inactive)",
        "data": deleted_seth
    }


# ================= Seth Payment Endpoints =================

@payment_router.post(
    "",
    response_model=SethPaymentSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new Seth payment transaction",
    response_description="Returns payment details with Cash Book and Partner allocations generated"
)
def create_seth_payment(payment_in: SethPaymentCreate, db: Session = Depends(get_db)):
    try:
        payment = SethService.create_payment(db=db, payment_in=payment_in)
        # Cash Book integration payload preparation demo
        cash_book_transaction = SethService.generate_cash_book_transaction(payment)
        # Partner view routing demo
        partner_allocation = SethService.generate_partner_allocation(payment)
        
        return {
            "success": True,
            "message": f"Seth payment added successfully. Total Income increased. Logged in Cash Book as {cash_book_transaction['transaction_type']} ({cash_book_transaction['direction']}). Routed to {partner_allocation['handled_by']} Partner View.",
            "data": payment
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

@payment_router.get(
    "",
    response_model=SethPaymentListResponse,
    summary="Get all seth payment records",
    response_description="List of all payment transactions matching search filters"
)
def get_all_seth_payments(
    seth_name: Optional[str] = Query(None, description="Search payments by Seth Name (partial match)"),
    date_from: Optional[date] = Query(None, description="Payment release start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Payment release end date (YYYY-MM-DD)"),
    payment_method: Optional[SethPaymentMethod] = Query(None, description="Filter by payment method"),
    handled_by: Optional[HandledBy] = Query(None, description="Filter by handling owner (partner log view)"),
    db: Session = Depends(get_db)
):
    method_val = payment_method.value if payment_method else None
    handler_val = handled_by.value if handled_by else None
    
    payments = SethService.get_all_payments(
        db=db,
        seth_name=seth_name,
        date_from=date_from,
        date_to=date_to,
        payment_method=method_val,
        handled_by=handler_val
    )
    return {
        "success": True,
        "message": "Seth payments retrieved successfully",
        "data": payments
    }

@payment_router.get(
    "/{id}",
    response_model=SethPaymentSingleResponse,
    summary="Get seth payment details by ID"
)
def get_seth_payment_details(id: int, db: Session = Depends(get_db)):
    payment = SethService.get_payment_by_id(db=db, payment_id=id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Seth payment record with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Seth payment retrieved successfully",
        "data": payment
    }
