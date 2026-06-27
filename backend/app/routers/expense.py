from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseSingleResponse,
    ExpenseListResponse,
    ExpenseDashboardSummaryResponse,
    ExpenseCategoryType
)
from app.schemas.seth import SethPaymentMethod
from app.schemas.upad import HandledBy
from app.services.expense import ExpenseService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/expenses",
    tags=["Expense Ledger"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "",
    response_model=ExpenseSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense entry",
    response_description="Expense registered successfully and Cash Book transaction ready"
)
def create_expense_entry(expense_in: ExpenseCreate, db: Session = Depends(get_db)):
    expense = ExpenseService.create(db=db, expense_in=expense_in)
    # Generate Cash Book transaction log demo
    cash_book_transaction = ExpenseService.generate_cash_book_transaction(expense)
    
    return {
        "success": True,
        "message": f"Expense entry created successfully. Cash Book transaction logged: {cash_book_transaction['direction']} - {cash_book_transaction['amount']} via {cash_book_transaction['method']}",
        "data": expense
    }

@router.get(
    "/dashboard/summary",
    response_model=ExpenseDashboardSummaryResponse,
    summary="Get expense dashboard metrics summary",
    response_description="Today's Expense, Monthly Expense, Total Expense, and Cash Balance"
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    metrics = ExpenseService.get_dashboard_metrics(db=db)
    return {
        "success": True,
        "message": "Expense dashboard metrics compiled successfully",
        "data": metrics
    }

@router.get(
    "",
    response_model=ExpenseListResponse,
    summary="Get all expense entries",
    response_description="List of all expense entries matching query filters"
)
def get_all_expense_entries(
    expense_category: Optional[ExpenseCategoryType] = Query(None, description="Filter by expense category"),
    payment_method: Optional[SethPaymentMethod] = Query(None, description="Filter by payment method"),
    handled_by: Optional[HandledBy] = Query(None, description="Filter by owner handling the payout"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Partial matching search query (matches Party Name, Reference Number)"),
    db: Session = Depends(get_db)
):
    category_val = expense_category.value if expense_category else None
    method_val = payment_method.value if payment_method else None
    handler_val = handled_by.value if handled_by else None
    
    expenses = ExpenseService.get_all(
        db=db,
        expense_category=category_val,
        payment_method=method_val,
        handled_by=handler_val,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    return {
        "success": True,
        "message": "Expense entries list retrieved successfully",
        "data": expenses
    }

@router.get(
    "/{id}",
    response_model=ExpenseSingleResponse,
    summary="Get expense details by ID"
)
def get_expense_details(id: int, db: Session = Depends(get_db)):
    expense = ExpenseService.get_by_id(db=db, expense_id=id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Expense entry with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Expense details retrieved successfully",
        "data": expense
    }

@router.put(
    "/{id}",
    response_model=ExpenseSingleResponse,
    summary="Update expense details"
)
def update_expense_entry(id: int, expense_in: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = ExpenseService.get_by_id(db=db, expense_id=id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Expense entry with ID {id} not found",
                "data": None
            }
        )
    updated_expense = ExpenseService.update(db=db, db_expense=expense, expense_in=expense_in)
    return {
        "success": True,
        "message": "Expense entry updated successfully",
        "data": updated_expense
    }

@router.delete(
    "/{id}",
    response_model=ExpenseSingleResponse,
    summary="Delete expense entry"
)
def delete_expense_entry(id: int, db: Session = Depends(get_db)):
    expense = ExpenseService.get_by_id(db=db, expense_id=id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Expense entry with ID {id} not found",
                "data": None
            }
        )
    # Store copy for response
    deleted_data = {
        "id": expense.id,
        "expense_date": expense.expense_date,
        "expense_category": expense.expense_category,
        "party_name": expense.party_name,
        "amount": expense.amount,
        "payment_method": expense.payment_method,
        "handled_by": expense.handled_by,
        "reference_number": expense.reference_number,
        "notes": expense.notes,
        "created_at": expense.created_at,
        "updated_at": expense.updated_at
    }
    ExpenseService.delete(db=db, db_expense=expense)
    return {
        "success": True,
        "message": "Expense entry deleted successfully",
        "data": deleted_data
    }
