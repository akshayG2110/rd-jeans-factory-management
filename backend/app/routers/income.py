from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
    IncomeSingleResponse,
    IncomeListResponse,
    IncomeDashboardSummaryResponse,
    IncomeSourceType
)
from app.schemas.seth import SethPaymentMethod
from app.schemas.upad import HandledBy
from app.services.income import IncomeService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/income",
    tags=["Income Ledger"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "",
    response_model=IncomeSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new income entry",
    response_description="Income registered successfully and Cash Book transaction ready"
)
def create_income_entry(income_in: IncomeCreate, db: Session = Depends(get_db)):
    income = IncomeService.create(db=db, income_in=income_in)
    # Generate Cash Book transaction log demo
    cash_book_transaction = IncomeService.generate_cash_book_transaction(income)
    
    return {
        "success": True,
        "message": f"Income entry created successfully. Cash Book transaction logged: {cash_book_transaction['direction']} - {cash_book_transaction['amount']} via {cash_book_transaction['method']}",
        "data": income
    }

@router.get(
    "/dashboard/summary",
    response_model=IncomeDashboardSummaryResponse,
    summary="Get income dashboard metrics summary",
    response_description="Today's Income, Monthly Income, Total Income, and Cash in Hand"
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    metrics = IncomeService.get_dashboard_metrics(db=db)
    return {
        "success": True,
        "message": "Income dashboard metrics compiled successfully",
        "data": metrics
    }

@router.get(
    "",
    response_model=IncomeListResponse,
    summary="Get all income entries",
    response_description="List of all income entries matching query filters"
)
def get_all_income_entries(
    income_source: Optional[IncomeSourceType] = Query(None, description="Filter by category source"),
    payment_method: Optional[SethPaymentMethod] = Query(None, description="Filter by payment method"),
    handled_by: Optional[HandledBy] = Query(None, description="Filter by authorized owner handling the transaction"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Partial matching search query (matches Source Name, Reference Number)"),
    db: Session = Depends(get_db)
):
    source_val = income_source.value if income_source else None
    method_val = payment_method.value if payment_method else None
    handler_val = handled_by.value if handled_by else None
    
    incomes = IncomeService.get_all(
        db=db,
        income_source=source_val,
        payment_method=method_val,
        handled_by=handler_val,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    return {
        "success": True,
        "message": "Income entries list retrieved successfully",
        "data": incomes
    }

@router.get(
    "/{id}",
    response_model=IncomeSingleResponse,
    summary="Get income details by ID"
)
def get_income_details(id: int, db: Session = Depends(get_db)):
    income = IncomeService.get_by_id(db=db, income_id=id)
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Income entry with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Income details retrieved successfully",
        "data": income
    }

@router.put(
    "/{id}",
    response_model=IncomeSingleResponse,
    summary="Update income details"
)
def update_income_entry(id: int, income_in: IncomeUpdate, db: Session = Depends(get_db)):
    income = IncomeService.get_by_id(db=db, income_id=id)
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Income entry with ID {id} not found",
                "data": None
            }
        )
    updated_income = IncomeService.update(db=db, db_income=income, income_in=income_in)
    return {
        "success": True,
        "message": "Income entry updated successfully",
        "data": updated_income
    }

@router.delete(
    "/{id}",
    response_model=IncomeSingleResponse,
    summary="Delete income entry"
)
def delete_income_entry(id: int, db: Session = Depends(get_db)):
    income = IncomeService.get_by_id(db=db, income_id=id)
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Income entry with ID {id} not found",
                "data": None
            }
        )
    # Store copy for response
    deleted_data = {
        "id": income.id,
        "income_date": income.income_date,
        "income_source": income.income_source,
        "source_name": income.source_name,
        "amount": income.amount,
        "payment_method": income.payment_method,
        "handled_by": income.handled_by,
        "reference_number": income.reference_number,
        "notes": income.notes,
        "created_at": income.created_at,
        "updated_at": income.updated_at
    }
    IncomeService.delete(db=db, db_income=income)
    return {
        "success": True,
        "message": "Income entry deleted successfully",
        "data": deleted_data
    }
