from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate
from app.services.cashbook import CashBookService
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class IncomeService:
    @staticmethod
    def create(db: Session, income_in: IncomeCreate) -> Income:
        db_income = Income(
            income_date=income_in.income_date,
            income_source=income_in.income_source.value if hasattr(income_in.income_source, 'value') else income_in.income_source,
            source_name=income_in.source_name,
            amount=income_in.amount,
            payment_method=income_in.payment_method.value if hasattr(income_in.payment_method, 'value') else income_in.payment_method,
            handled_by=income_in.handled_by.value if hasattr(income_in.handled_by, 'value') else income_in.handled_by,
            reference_number=income_in.reference_number,
            notes=income_in.notes
        )
        db.add(db_income)
        db.commit()
        db.refresh(db_income)

        # Log into Cash Book
        # Note: If it's a Seth Payment, it is already logged by SethService create_payment,
        # but the POST /income API is for manual Income or other sources. Let's make sure
        # the category matches: transaction_type = "Income"
        CashBookService.log_transaction(
            db=db,
            transaction_date=db_income.income_date,
            transaction_type="Income",
            name=db_income.source_name,
            payment_method=db_income.payment_method,
            income_amount=db_income.amount,
            out_amount=Decimal("0.00"),
            handled_by=db_income.handled_by,
            reference_module="Income",
            reference_id=db_income.id,
            notes=db_income.notes
        )

        return db_income

    @staticmethod
    def get_by_id(db: Session, income_id: int) -> Optional[Income]:
        return db.query(Income).filter(Income.id == income_id).first()

    @staticmethod
    def get_all(
        db: Session,
        income_source: Optional[str] = None,
        payment_method: Optional[str] = None,
        handled_by: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None
    ) -> List[Income]:
        query = db.query(Income)

        # Filters
        if income_source:
            query = query.filter(Income.income_source == income_source)
        if payment_method:
            query = query.filter(Income.payment_method == payment_method)
        if handled_by:
            query = query.filter(Income.handled_by == handled_by)
        if date_from:
            query = query.filter(Income.income_date >= date_from)
        if date_to:
            query = query.filter(Income.income_date <= date_to)

        # Search support
        if search:
            search_clause = or_(
                Income.source_name.ilike(f"%{search}%"),
                Income.reference_number.ilike(f"%{search}%")
            )
            query = query.filter(search_clause)

        return query.order_by(Income.income_date.desc(), Income.id.desc()).all()

    @staticmethod
    def update(db: Session, db_income: Income, income_in: IncomeUpdate) -> Income:
        update_data = income_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if hasattr(value, 'value'):
                    setattr(db_income, field, value.value)
                else:
                    setattr(db_income, field, value)
        
        db.commit()
        db.refresh(db_income)

        # Update Cash Book
        CashBookService.update_by_reference(
            db=db,
            reference_module="Income",
            reference_id=db_income.id,
            name=db_income.source_name,
            amount=db_income.amount,
            payment_method=db_income.payment_method,
            handled_by=db_income.handled_by,
            transaction_date=db_income.income_date,
            notes=db_income.notes,
            is_income=True
        )

        return db_income

    @staticmethod
    def delete(db: Session, db_income: Income) -> None:
        income_id = db_income.id
        db.delete(db_income)
        db.commit()

        # Delete corresponding cash book log
        CashBookService.delete_by_reference(
            db=db,
            reference_module="Income",
            reference_id=income_id
        )

    @staticmethod
    def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
        """
        Calculates today, monthly, all-time, and cash-in-hand aggregations.
        """
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        # Today's Income
        today_income = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
            Income.income_date == today
        ).scalar()

        # Monthly Income
        monthly_income = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
            Income.income_date >= start_of_month
        ).scalar()

        # Total Income
        total_income = db.query(func.coalesce(func.sum(Income.amount), 0)).scalar()

        # Current Cash Balance (Sum of payment_method = "Cash")
        # Ready for cash book matching
        current_cash_balance = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
            Income.payment_method == "Cash"
        ).scalar()

        return {
            "today_income": Decimal(today_income),
            "monthly_income": Decimal(monthly_income),
            "total_income": Decimal(total_income),
            "current_cash_balance": Decimal(current_cash_balance)
        }

    @staticmethod
    def generate_cash_book_transaction(db_income: Income) -> Dict[str, Any]:
        """
        Helper method to prepare Cash Book Income Entry details.
        """
        return {
            "transaction_type": "INCOME",
            "direction": "Money In",
            "date": db_income.income_date,
            "source_name": db_income.source_name,
            "amount": db_income.amount,
            "method": db_income.payment_method,
            "handled_by": db_income.handled_by,
            "notes": db_income.notes
        }
