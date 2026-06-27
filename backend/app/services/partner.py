from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.cashbook import CashBook
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class PartnerService:
    @staticmethod
    def get_partner_transactions(
        db: Session,
        handled_by: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        transaction_type: Optional[str] = None,
        payment_method: Optional[str] = None
    ) -> List[CashBook]:
        query = db.query(CashBook)

        # Handle partner filter
        if handled_by:
            query = query.filter(CashBook.handled_by == handled_by)
            
        # Optional filters
        if date_from:
            query = query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            query = query.filter(CashBook.transaction_date <= date_to)
        if transaction_type:
            query = query.filter(CashBook.transaction_type == transaction_type)
        if payment_method:
            query = query.filter(CashBook.payment_method == payment_method)

        return query.order_by(CashBook.transaction_date.desc(), CashBook.id.desc()).all()

    @staticmethod
    def get_partners_summary(db: Session) -> Dict[str, Any]:
        """
        Interrogates the Cash Book ledger to summarize partner-wise statistics.
        """
        # 1. Total Factory Balance (Running balance of the latest Cash Book entry)
        latest_entry = db.query(CashBook).order_by(CashBook.id.desc()).first()
        total_factory_balance = latest_entry.running_balance if latest_entry else Decimal("0.00")

        # 2. Rajubhai Handled Sums
        rajubhai_income = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
            CashBook.handled_by == "Rajubhai"
        ).scalar()
        rajubhai_expense = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
            CashBook.handled_by == "Rajubhai"
        ).scalar()

        # 3. Dhruveshbhai Handled Sums
        dhruveshbhai_income = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
            CashBook.handled_by == "Dhruveshbhai"
        ).scalar()
        dhruveshbhai_expense = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
            CashBook.handled_by == "Dhruveshbhai"
        ).scalar()

        return {
            "total_factory_balance": Decimal(total_factory_balance),
            "rajubhai_total_income_handled": Decimal(rajubhai_income),
            "rajubhai_total_expenses_handled": Decimal(rajubhai_expense),
            "dhruveshbhai_total_income_handled": Decimal(dhruveshbhai_income),
            "dhruveshbhai_total_expenses_handled": Decimal(dhruveshbhai_expense)
        }
