from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.upad import Upad
from app.models.employee import Employee
from app.schemas.upad import UpadCreate, UpadUpdate
from app.services.cashbook import CashBookService
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal

class UpadService:
    @staticmethod
    def create(db: Session, upad_in: UpadCreate) -> Upad:
        # Validate employee exists
        employee = db.query(Employee).filter(Employee.id == upad_in.employee_id).first()
        if not employee:
            raise ValueError(f"Employee with ID {upad_in.employee_id} does not exist.")

        db_upad = Upad(
            employee_id=upad_in.employee_id,
            date=upad_in.date,
            amount=upad_in.amount,
            payment_method=upad_in.payment_method.value if hasattr(upad_in.payment_method, 'value') else upad_in.payment_method,
            notes=upad_in.notes,
            handled_by=upad_in.handled_by.value if hasattr(upad_in.handled_by, 'value') else upad_in.handled_by
        )
        db.add(db_upad)
        db.commit()
        db.refresh(db_upad)

        # Log into Cash Book
        CashBookService.log_transaction(
            db=db,
            transaction_date=db_upad.date,
            transaction_type="Upad",
            name=employee.employee_name,
            payment_method=db_upad.payment_method,
            income_amount=Decimal("0.00"),
            out_amount=db_upad.amount,
            handled_by=db_upad.handled_by,
            reference_module="Upad",
            reference_id=db_upad.id,
            notes=db_upad.notes
        )

        return db_upad

    @staticmethod
    def get_by_id(db: Session, upad_id: int) -> Optional[Upad]:
        return db.query(Upad).filter(Upad.id == upad_id).first()

    @staticmethod
    def get_all(
        db: Session,
        employee_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        payment_method: Optional[str] = None,
        handled_by: Optional[str] = None
    ) -> List[Upad]:
        query = db.query(Upad)

        if employee_id is not None:
            query = query.filter(Upad.employee_id == employee_id)
        if date_from:
            query = query.filter(Upad.date >= date_from)
        if date_to:
            query = query.filter(Upad.date <= date_to)
        if payment_method:
            query = query.filter(Upad.payment_method == payment_method)
        if handled_by:
            query = query.filter(Upad.handled_by == handled_by)

        return query.order_by(Upad.date.desc(), Upad.id.desc()).all()

    @staticmethod
    def update(db: Session, db_upad: Upad, upad_in: UpadUpdate) -> Upad:
        # If employee_id is changing, validate it exists
        if upad_in.employee_id is not None and upad_in.employee_id != db_upad.employee_id:
            employee = db.query(Employee).filter(Employee.id == upad_in.employee_id).first()
            if not employee:
                raise ValueError(f"Employee with ID {upad_in.employee_id} does not exist.")
        else:
            employee = db_upad.employee

        update_data = upad_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if hasattr(value, 'value'):
                    setattr(db_upad, field, value.value)
                else:
                    setattr(db_upad, field, value)

        db.commit()
        db.refresh(db_upad)

        # Update Cash Book log
        CashBookService.update_by_reference(
            db=db,
            reference_module="Upad",
            reference_id=db_upad.id,
            name=employee.employee_name if employee else None,
            amount=db_upad.amount,
            payment_method=db_upad.payment_method,
            handled_by=db_upad.handled_by,
            transaction_date=db_upad.date,
            notes=db_upad.notes,
            is_income=False
        )

        return db_upad

    @staticmethod
    def delete(db: Session, db_upad: Upad) -> None:
        upad_id = db_upad.id
        db.delete(db_upad)
        db.commit()

        # Delete corresponding cash book log
        CashBookService.delete_by_reference(
            db=db,
            reference_module="Upad",
            reference_id=upad_id
        )

    @staticmethod
    def get_employee_summary(db: Session, employee_id: int) -> Dict[str, Any]:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise ValueError(f"Employee with ID {employee_id} does not exist.")

        # Calculate total upad
        total_upad = db.query(func.coalesce(func.sum(Upad.amount), 0)).filter(
            Upad.employee_id == employee_id
        ).scalar()

        # Calculate current month upad
        today = date.today()
        start_of_month = date(today.year, today.month, 1)
        current_month_upad = db.query(func.coalesce(func.sum(Upad.amount), 0)).filter(
            Upad.employee_id == employee_id,
            Upad.date >= start_of_month
        ).scalar()

        # Get historical records
        upad_history = db.query(Upad).filter(Upad.employee_id == employee_id).order_by(Upad.date.desc()).all()

        return {
            "employee_id": employee.id,
            "employee_name": employee.employee_name,
            "total_upad": Decimal(total_upad),
            "current_month_upad": Decimal(current_month_upad),
            "upad_history": upad_history
        }

    @staticmethod
    def generate_cash_book_transaction(db_upad: Upad) -> Dict[str, Any]:
        """
        Helper method to prepare Cash Book Money Out transaction representation.
        Whenever Upad is created, it calls this to prepare details to insert into Cash Book.
        """
        return {
            "transaction_type": "UPAD",
            "direction": "Money Out",
            "date": db_upad.date,
            "employee_name": db_upad.employee.employee_name if db_upad.employee else f"Employee #{db_upad.employee_id}",
            "amount": db_upad.amount,
            "method": db_upad.payment_method,
            "handled_by": db_upad.handled_by,
            "notes": db_upad.notes
        }
