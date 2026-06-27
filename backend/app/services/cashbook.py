from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.cashbook import CashBook
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class CashBookService:
    @staticmethod
    def _recalculate_balances_from(db: Session, start_id: int) -> None:
        """
        Recalculates running balances for all entries with ID >= start_id.
        """
        # Fetch entries starting from the modified one, ordered by ID ascending
        entries = db.query(CashBook).filter(CashBook.id >= start_id).order_by(CashBook.id.asc()).all()
        if not entries:
            return

        for entry in entries:
            # Find the running balance of the previous entry
            prev_entry = db.query(CashBook).filter(CashBook.id < entry.id).order_by(CashBook.id.desc()).first()
            prev_balance = prev_entry.running_balance if prev_entry else Decimal("0.00")
            
            entry.running_balance = prev_balance + entry.income_amount - entry.out_amount
        
        db.commit()

    @classmethod
    def log_transaction(
        cls,
        db: Session,
        transaction_date: date,
        transaction_type: str,
        name: str,
        payment_method: str,
        income_amount: Decimal,
        out_amount: Decimal,
        handled_by: str,
        reference_module: str,
        reference_id: int,
        notes: Optional[str] = None
    ) -> CashBook:
        # Fetch latest entry to get previous balance
        latest_entry = db.query(CashBook).order_by(CashBook.id.desc()).first()
        prev_balance = latest_entry.running_balance if latest_entry else Decimal("0.00")

        running_balance = prev_balance + income_amount - out_amount

        db_entry = CashBook(
            transaction_date=transaction_date,
            transaction_type=transaction_type,
            name=name,
            payment_method=payment_method,
            income_amount=income_amount,
            out_amount=out_amount,
            running_balance=running_balance,
            handled_by=handled_by,
            reference_module=reference_module,
            reference_id=reference_id,
            notes=notes
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

    @classmethod
    def update_by_reference(
        cls,
        db: Session,
        reference_module: str,
        reference_id: int,
        name: Optional[str] = None,
        amount: Optional[Decimal] = None,
        payment_method: Optional[str] = None,
        handled_by: Optional[str] = None,
        transaction_date: Optional[date] = None,
        notes: Optional[str] = None,
        is_income: bool = True
    ) -> Optional[CashBook]:
        entry = db.query(CashBook).filter(
            CashBook.reference_module == reference_module,
            CashBook.reference_id == reference_id
        ).first()

        if not entry:
            return None

        # Apply edits
        if name is not None:
            entry.name = name
        if payment_method is not None:
            entry.payment_method = payment_method
        if handled_by is not None:
            entry.handled_by = handled_by
        if transaction_date is not None:
            entry.transaction_date = transaction_date
        if notes is not None:
            entry.notes = notes

        if amount is not None:
            if is_income:
                entry.income_amount = amount
                entry.out_amount = Decimal("0.00")
            else:
                entry.income_amount = Decimal("0.00")
                entry.out_amount = amount

        db.commit()

        # Recalculate subsequent balances starting from this entry
        cls._recalculate_balances_from(db, entry.id)
        db.refresh(entry)
        return entry

    @classmethod
    def delete_by_reference(cls, db: Session, reference_module: str, reference_id: int) -> None:
        entry = db.query(CashBook).filter(
            CashBook.reference_module == reference_module,
            CashBook.reference_id == reference_id
        ).first()

        if not entry:
            return

        entry_id = entry.id
        db.delete(entry)
        db.commit()

        # Recalculate starting from the deleted record ID to adjust all subsequent records
        cls._recalculate_balances_from(db, entry_id)

    @staticmethod
    def get_by_id(db: Session, entry_id: int) -> Optional[CashBook]:
        return db.query(CashBook).filter(CashBook.id == entry_id).first()

    @staticmethod
    def get_all(
        db: Session,
        transaction_type: Optional[str] = None,
        payment_method: Optional[str] = None,
        handled_by: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None
    ) -> List[CashBook]:
        query = db.query(CashBook)

        if transaction_type:
            query = query.filter(CashBook.transaction_type == transaction_type)
        if payment_method:
            query = query.filter(CashBook.payment_method == payment_method)
        if handled_by:
            query = query.filter(CashBook.handled_by == handled_by)
        if date_from:
            query = query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            query = query.filter(CashBook.transaction_date <= date_to)

        if search:
            search_clause = or_(
                CashBook.name.ilike(f"%{search}%"),
                CashBook.notes.ilike(f"%{search}%")
            )
            query = query.filter(search_clause)

        return query.order_by(CashBook.transaction_date.desc(), CashBook.id.desc()).all()

    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        # Current Cash Balance (latest running_balance in database)
        latest_entry = db.query(CashBook).order_by(CashBook.id.desc()).first()
        current_cash_balance = latest_entry.running_balance if latest_entry else Decimal("0.00")

        # Today's Cash In
        today_cash_in = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
            CashBook.transaction_date == today
        ).scalar()

        # Today's Cash Out
        today_cash_out = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
            CashBook.transaction_date == today
        ).scalar()

        # Monthly Cash In
        monthly_cash_in = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
            CashBook.transaction_date >= start_of_month
        ).scalar()

        # Monthly Cash Out
        monthly_cash_out = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
            CashBook.transaction_date >= start_of_month
        ).scalar()

        return {
            "current_cash_balance": Decimal(current_cash_balance),
            "today_cash_in": Decimal(today_cash_in),
            "today_cash_out": Decimal(today_cash_out),
            "monthly_cash_in": Decimal(monthly_cash_in),
            "monthly_cash_out": Decimal(monthly_cash_out)
        }
