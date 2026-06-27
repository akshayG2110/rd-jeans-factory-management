from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.expense import Expense
from app.models.income import Income
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.services.cashbook import CashBookService
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class ExpenseService:
    @staticmethod
    def create(db: Session, expense_in: ExpenseCreate) -> Expense:
        db_expense = Expense(
            expense_date=expense_in.expense_date,
            expense_category=expense_in.expense_category.value if hasattr(expense_in.expense_category, 'value') else expense_in.expense_category,
            party_name=expense_in.party_name,
            amount=expense_in.amount,
            payment_method=expense_in.payment_method.value if hasattr(expense_in.payment_method, 'value') else expense_in.payment_method,
            handled_by=expense_in.handled_by.value if hasattr(expense_in.handled_by, 'value') else expense_in.handled_by,
            reference_number=expense_in.reference_number,
            notes=expense_in.notes
        )
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)

        # Log into Cash Book
        # Use transaction_type = db_expense.expense_category (e.g. Electricity Bill, Material Expense)
        CashBookService.log_transaction(
            db=db,
            transaction_date=db_expense.expense_date,
            transaction_type=db_expense.expense_category,
            name=db_expense.party_name,
            payment_method=db_expense.payment_method,
            income_amount=Decimal("0.00"),
            out_amount=db_expense.amount,
            handled_by=db_expense.handled_by,
            reference_module="Expense",
            reference_id=db_expense.id,
            notes=db_expense.notes
        )

        return db_expense

    @staticmethod
    def get_by_id(db: Session, expense_id: int) -> Optional[Expense]:
        return db.query(Expense).filter(Expense.id == expense_id).first()

    @staticmethod
    def get_all(
        db: Session,
        expense_category: Optional[str] = None,
        payment_method: Optional[str] = None,
        handled_by: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None
    ) -> List[Expense]:
        query = db.query(Expense)

        # Filters
        if expense_category:
            query = query.filter(Expense.expense_category == expense_category)
        if payment_method:
            query = query.filter(Expense.payment_method == payment_method)
        if handled_by:
            query = query.filter(Expense.handled_by == handled_by)
        if date_from:
            query = query.filter(Expense.expense_date >= date_from)
        if date_to:
            query = query.filter(Expense.expense_date <= date_to)

        # Search support
        if search:
            search_clause = or_(
                Expense.party_name.ilike(f"%{search}%"),
                Expense.reference_number.ilike(f"%{search}%")
            )
            query = query.filter(search_clause)

        return query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()

    @staticmethod
    def update(db: Session, db_expense: Expense, expense_in: ExpenseUpdate) -> Expense:
        update_data = expense_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if hasattr(value, 'value'):
                    setattr(db_expense, field, value.value)
                else:
                    setattr(db_expense, field, value)
        
        db.commit()
        db.refresh(db_expense)

        # Update Cash Book
        CashBookService.update_by_reference(
            db=db,
            reference_module="Expense",
            reference_id=db_expense.id,
            name=db_expense.party_name,
            amount=db_expense.amount,
            payment_method=db_expense.payment_method,
            handled_by=db_expense.handled_by,
            transaction_date=db_expense.expense_date,
            notes=db_expense.notes,
            is_income=False
        )

        return db_expense

    @staticmethod
    def delete(db: Session, db_expense: Expense) -> None:
        expense_id = db_expense.id
        db.delete(db_expense)
        db.commit()

        # Delete corresponding cash book log
        CashBookService.delete_by_reference(
            db=db,
            reference_module="Expense",
            reference_id=expense_id
        )

    @staticmethod
    def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
        """
        Calculates today, monthly, all-time, and cash-in-hand balance.
        """
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        # Today's Expense
        today_expense = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.expense_date == today
        ).scalar()

        # Monthly Expense
        monthly_expense = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.expense_date >= start_of_month
        ).scalar()

        # Total Expense
        total_expense = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar()

        # Cash Balance (Sum of Cash Income - Sum of Cash Expense)
        cash_income = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(
            Income.payment_method == "Cash"
        ).scalar() or 0

        cash_expense = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.payment_method == "Cash"
        ).scalar() or 0

        current_cash_balance = cash_income - cash_expense

        return {
            "today_expense": Decimal(today_expense),
            "monthly_expense": Decimal(monthly_expense),
            "total_expense": Decimal(total_expense),
            "current_cash_balance": Decimal(current_cash_balance)
        }

    @staticmethod
    def generate_cash_book_transaction(db_expense: Expense) -> Dict[str, Any]:
        """
        Helper method to prepare Cash Book Expense Entry details.
        """
        return {
            "transaction_type": "EXPENSE",
            "direction": "Money Out",
            "date": db_expense.expense_date,
            "party_name": db_expense.party_name,
            "amount": db_expense.amount,
            "method": db_expense.payment_method,
            "handled_by": db_expense.handled_by,
            "notes": db_expense.notes
        }
