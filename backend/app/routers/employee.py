from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeSingleResponse,
    EmployeeListResponse,
    EmployeeStatus,
    EmployeeRole
)
from app.services.employee import EmployeeService
from typing import Optional
from app.core.security import get_current_user

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "",
    response_model=EmployeeSingleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new employee",
    response_description="The employee details created successfully"
)
def create_employee(employee_in: EmployeeCreate, db: Session = Depends(get_db)):
    employee = EmployeeService.create(db=db, employee_in=employee_in)
    return {
        "success": True,
        "message": "Employee created successfully",
        "data": employee
    }

@router.get(
    "",
    response_model=EmployeeListResponse,
    summary="Get all employees",
    response_description="List of all employees matching the search filters"
)
def get_employees(
    employee_name: Optional[str] = Query(None, description="Search employee by name (partial match)"),
    role: Optional[EmployeeRole] = Query(None, description="Filter employee by role"),
    status: Optional[EmployeeStatus] = Query(None, description="Filter employee by status"),
    db: Session = Depends(get_db)
):
    role_val = role.value if role else None
    status_val = status.value if status else None
    employees = EmployeeService.get_all(
        db=db,
        employee_name=employee_name,
        role=role_val,
        status=status_val
    )
    return {
        "success": True,
        "message": "Employees list retrieved successfully",
        "data": employees
    }

@router.get(
    "/{id}",
    response_model=EmployeeSingleResponse,
    summary="Get employee details by ID",
    response_description="Detailed information of the selected employee"
)
def get_employee(id: int, db: Session = Depends(get_db)):
    employee = EmployeeService.get_by_id(db=db, employee_id=id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Employee with ID {id} not found",
                "data": None
            }
        )
    return {
        "success": True,
        "message": "Employee details retrieved successfully",
        "data": employee
    }

@router.put(
    "/{id}",
    response_model=EmployeeSingleResponse,
    summary="Update employee details",
    response_description="The updated employee details"
)
def update_employee(id: int, employee_in: EmployeeUpdate, db: Session = Depends(get_db)):
    employee = EmployeeService.get_by_id(db=db, employee_id=id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Employee with ID {id} not found",
                "data": None
            }
        )
    updated_employee = EmployeeService.update(db=db, db_employee=employee, employee_in=employee_in)
    return {
        "success": True,
        "message": "Employee updated successfully",
        "data": updated_employee
    }

@router.delete(
    "/{id}",
    response_model=EmployeeSingleResponse,
    summary="Soft delete an employee",
    response_description="The employee details set to inactive status"
)
def delete_employee(id: int, db: Session = Depends(get_db)):
    employee = EmployeeService.get_by_id(db=db, employee_id=id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": f"Employee with ID {id} not found",
                "data": None
            }
        )
    deleted_employee = EmployeeService.soft_delete(db=db, db_employee=employee)
    return {
        "success": True,
        "message": "Employee soft deleted successfully",
        "data": deleted_employee
    }
