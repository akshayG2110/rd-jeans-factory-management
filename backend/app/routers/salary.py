from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.salary import (
    SalaryCreate,
    SalaryUpdate,
    SalarySingleResponse,
    SalaryListResponse,
    EmployeeSalarySummaryResponse
)
from app.schemas.upad import PaymentMethod, HandledBy
from app.services.salary import SalaryService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/salary",
    tags=["Salaries"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "",
    response_model=SalarySingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new salary record",
    response_description="Salary entry created successfully and Cash Book event is ready"
)
def create_salary_entry(salary_in: SalaryCreate, db: Session = Depends(get_db)):
    try:
        salary = SalaryService.create(db=db, salary_in=salary_in)
        # Cash Book integration payload preparation demo
        cash_book_transaction = SalaryService.generate_cash_book_transaction(salary)
        
        return {
            "success": True,
            "message": f"Salary record created successfully. Cash Book transaction logged: {cash_book_transaction['direction']} - {cash_book_transaction['amount']} via {cash_book_transaction['method']}",
            "data": salary
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
    response_model=SalaryListResponse,
    summary="Get all salary records",
    response_description="List of all salary records matching filters (Month Wise, Year Wise, Date Range Wise)"
)
def get_all_salary_records(
    employee_id: Optional[int] = Query(None, description="Filter records by employee ID"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter records by salary month"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Filter records by salary year"),
    payment_method: Optional[PaymentMethod] = Query(None, description="Filter records by payment method"),
    handled_by: Optional[HandledBy] = Query(None, description="Filter records by handling owner"),
    date_from: Optional[date] = Query(None, description="Start payment date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End payment date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    method_val = payment_method.value if payment_method else None
    handler_val = handled_by.value if handled_by else None
    
    salaries = SalaryService.get_all(
        db=db,
        employee_id=employee_id,
        month=month,
        year=year,
        payment_method=method_val,
        handled_by=handler_val,
        date_from=date_from,
        date_to=date_to
    )
    return {
        "success": True,
        "message": "Salary records retrieved successfully",
        "data": salaries
    }

@router.get(
    "/{id}",
    response_model=SalarySingleResponse,
    summary="Get salary details by ID",
    response_description="Detailed information of the selected salary transaction"
)
def get_salary_record(id: int, db: Session = Depends(get_db)):
    salary = SalaryService.get_by_id(db=db, salary_id=id)
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Salary record with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Salary record retrieved successfully",
        "data": salary
    }

@router.put(
    "/{id}",
    response_model=SalarySingleResponse,
    summary="Update salary details",
    response_description="The updated salary details with recalculated remaining_amount"
)
def update_salary_record(id: int, salary_in: SalaryUpdate, db: Session = Depends(get_db)):
    salary = SalaryService.get_by_id(db=db, salary_id=id)
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Salary record with ID {id} not found",
                "data": None
            }
        )
    try:
        updated_salary = SalaryService.update(db=db, db_salary=salary, salary_in=salary_in)
        return {
            "success": True,
            "message": "Salary record updated successfully",
            "data": updated_salary
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
    response_model=SalarySingleResponse,
    summary="Delete a salary record",
    response_description="The deleted salary record details"
)
def delete_salary_record(id: int, db: Session = Depends(get_db)):
    salary = SalaryService.get_by_id(db=db, salary_id=id)
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Salary record with ID {id} not found",
                "data": None
            }
        )
    # Store data for response before delete
    deleted_data = {
        "id": salary.id,
        "employee_id": salary.employee_id,
        "salary_month": salary.salary_month,
        "salary_year": salary.salary_year,
        "salary_amount": salary.salary_amount,
        "paid_amount": salary.paid_amount,
        "remaining_amount": salary.remaining_amount,
        "payment_method": salary.payment_method,
        "notes": salary.notes,
        "handled_by": salary.handled_by,
        "payment_date": salary.payment_date,
        "created_at": salary.created_at,
        "updated_at": salary.updated_at,
        "employee": salary.employee
    }
    SalaryService.delete(db=db, db_salary=salary)
    return {
        "success": True,
        "message": "Salary record deleted successfully",
        "data": deleted_data
    }

@router.get(
    "/employee/{employee_id}/summary",
    response_model=EmployeeSalarySummaryResponse,
    summary="Get employee salary profile summary (Last, Pending, Paid, History)",
    response_description="Summary analytics of salary history and balances for an employee"
)
def get_employee_salary_summary(employee_id: int, db: Session = Depends(get_db)):
    try:
        summary = SalaryService.get_employee_summary(db=db, employee_id=employee_id)
        return {
            "success": True,
            "message": "Employee salary summary generated successfully",
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
