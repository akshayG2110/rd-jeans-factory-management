from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.salary import Salary
from app.models.employee import Employee
from app.schemas.salary import SalaryCreate, SalaryUpdate
from app.services.cashbook import CashBookService
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class SalaryService:
    @staticmethod
    def create(db: Session, salary_in: SalaryCreate) -> Salary:
        # Validate employee exists
        employee = db.query(Employee).filter(Employee.id == salary_in.employee_id).first()
        if not employee:
            raise ValueError(f"Employee with ID {salary_in.employee_id} does not exist.")

        # Calculate remaining amount
        remaining_amount = salary_in.salary_amount - salary_in.paid_amount

        db_salary = Salary(
            employee_id=salary_in.employee_id,
            salary_month=salary_in.salary_month,
            salary_year=salary_in.salary_year,
            salary_amount=salary_in.salary_amount,
            paid_amount=salary_in.paid_amount,
            remaining_amount=remaining_amount,
            payment_method=salary_in.payment_method.value if hasattr(salary_in.payment_method, 'value') else salary_in.payment_method,
            notes=salary_in.notes,
            handled_by=salary_in.handled_by.value if hasattr(salary_in.handled_by, 'value') else salary_in.handled_by,
            payment_date=salary_in.payment_date
        )
        db.add(db_salary)
        db.commit()
        db.refresh(db_salary)

        # Log into Cash Book
        CashBookService.log_transaction(
            db=db,
            transaction_date=db_salary.payment_date,
            transaction_type="Salary",
            name=employee.employee_name,
            payment_method=db_salary.payment_method,
            income_amount=Decimal("0.00"),
            out_amount=db_salary.paid_amount,
            handled_by=db_salary.handled_by,
            reference_module="Salary",
            reference_id=db_salary.id,
            notes=db_salary.notes
        )

        return db_salary

    @staticmethod
    def get_by_id(db: Session, salary_id: int) -> Optional[Salary]:
        return db.query(Salary).filter(Salary.id == salary_id).first()

    @staticmethod
    def get_all(
        db: Session,
        employee_id: Optional[int] = None,
        month: Optional[int] = None,
        year: Optional[int] = None,
        payment_method: Optional[str] = None,
        handled_by: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> List[Salary]:
        query = db.query(Salary)

        if employee_id is not None:
            query = query.filter(Salary.employee_id == employee_id)
        if month is not None:
            query = query.filter(Salary.salary_month == month)
        if year is not None:
            query = query.filter(Salary.salary_year == year)
        if payment_method:
            query = query.filter(Salary.payment_method == payment_method)
        if handled_by:
            query = query.filter(Salary.handled_by == handled_by)
        if date_from:
            query = query.filter(Salary.payment_date >= date_from)
        if date_to:
            query = query.filter(Salary.payment_date <= date_to)

        return query.order_by(Salary.payment_date.desc(), Salary.id.desc()).all()

    @staticmethod
    def update(db: Session, db_salary: Salary, salary_in: SalaryUpdate) -> Salary:
        # Verify employee exists if employee_id is changed
        if salary_in.employee_id is not None and salary_in.employee_id != db_salary.employee_id:
            employee = db.query(Employee).filter(Employee.id == salary_in.employee_id).first()
            if not employee:
                raise ValueError(f"Employee with ID {salary_in.employee_id} does not exist.")
        else:
            employee = db_salary.employee

        update_data = salary_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if hasattr(value, 'value'):
                    setattr(db_salary, field, value.value)
                else:
                    setattr(db_salary, field, value)

        # Recalculate remaining amount if salaries are updated
        db_salary.remaining_amount = db_salary.salary_amount - db_salary.paid_amount

        db.commit()
        db.refresh(db_salary)

        # Update Cash Book log
        CashBookService.update_by_reference(
            db=db,
            reference_module="Salary",
            reference_id=db_salary.id,
            name=employee.employee_name if employee else None,
            amount=db_salary.paid_amount,
            payment_method=db_salary.payment_method,
            handled_by=db_salary.handled_by,
            transaction_date=db_salary.payment_date,
            notes=db_salary.notes,
            is_income=False
        )

        return db_salary

    @staticmethod
    def delete(db: Session, db_salary: Salary) -> None:
        salary_id = db_salary.id
        db.delete(db_salary)
        db.commit()

        # Delete corresponding cash book log
        CashBookService.delete_by_reference(
            db=db,
            reference_module="Salary",
            reference_id=salary_id
        )

    @staticmethod
    def get_employee_summary(db: Session, employee_id: int) -> Dict[str, Any]:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise ValueError(f"Employee with ID {employee_id} does not exist.")

        # Get historical records
        salary_history = db.query(Salary).filter(Salary.employee_id == employee_id).order_by(Salary.payment_date.desc(), Salary.id.desc()).all()

        # Calculate Last Salary
        last_salary = salary_history[0] if salary_history else None

        # Calculate Pending Salary
        pending_salary = db.query(func.coalesce(func.sum(Salary.remaining_amount), 0)).filter(
            Salary.employee_id == employee_id
        ).scalar()

        # Calculate current month salary paid
        today = date.today()
        start_of_month = date(today.year, today.month, 1)
        current_month_salary_paid = db.query(func.coalesce(func.sum(Salary.paid_amount), 0)).filter(
            Salary.employee_id == employee_id,
            Salary.payment_date >= start_of_month
        ).scalar()

        return {
            "employee_id": employee.id,
            "employee_name": employee.employee_name,
            "last_salary": last_salary,
            "pending_salary": Decimal(pending_salary),
            "current_month_salary_paid": Decimal(current_month_salary_paid),
            "salary_history": salary_history
        }

    @staticmethod
    def generate_cash_book_transaction(db_salary: Salary) -> Dict[str, Any]:
        """
        Helper method to prepare Cash Book Money Out transaction representation.
        """
        return {
            "transaction_type": "SALARY",
            "direction": "Money Out",
            "date": db_salary.payment_date,
            "employee_name": db_salary.employee.employee_name if db_salary.employee else f"Employee #{db_salary.employee_id}",
            "amount": db_salary.paid_amount,
            "method": db_salary.payment_method,
            "handled_by": db_salary.handled_by,
            "notes": db_salary.notes
        }
