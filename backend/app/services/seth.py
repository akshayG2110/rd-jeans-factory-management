from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.seth import Seth, SethPayment
from app.schemas.seth import SethCreate, SethUpdate, SethPaymentCreate, SethStatus
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class SethService:
    # ================= Seth Operations =================
    @staticmethod
    def create_seth(db: Session, seth_in: SethCreate) -> Seth:
        db_seth = Seth(
            seth_name=seth_in.seth_name,
            mobile_number=seth_in.mobile_number,
            address=seth_in.address,
            notes=seth_in.notes,
            status=seth_in.status.value if hasattr(seth_in.status, 'value') else seth_in.status
        )
        db.add(db_seth)
        db.commit()
        db.refresh(db_seth)
        return db_seth

    @staticmethod
    def get_seth_by_id(db: Session, seth_id: int) -> Optional[Seth]:
        return db.query(Seth).filter(Seth.id == seth_id).first()

    @staticmethod
    def get_all_seths(db: Session, status: Optional[str] = None) -> List[Seth]:
        query = db.query(Seth)
        if status:
            query = query.filter(Seth.status == status)
        return query.order_by(Seth.id.desc()).all()

    @staticmethod
    def update_seth(db: Session, db_seth: Seth, seth_in: SethUpdate) -> Seth:
        update_data = seth_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if hasattr(value, 'value'):
                    setattr(db_seth, field, value.value)
                else:
                    setattr(db_seth, field, value)
        
        db.commit()
        db.refresh(db_seth)
        return db_seth

    @staticmethod
    def soft_delete_seth(db: Session, db_seth: Seth) -> Seth:
        db_seth.status = SethStatus.INACTIVE.value
        db.commit()
        db.refresh(db_seth)
        return db_seth

    # ================= Seth Payment Operations =================
    @staticmethod
    def create_payment(db: Session, payment_in: SethPaymentCreate) -> SethPayment:
        # Validate Seth exists
        seth = db.query(Seth).filter(Seth.id == payment_in.seth_id).first()
        if not seth:
            raise ValueError(f"Seth with ID {payment_in.seth_id} does not exist.")

        db_payment = SethPayment(
            seth_id=payment_in.seth_id,
            payment_date=payment_in.payment_date,
            amount=payment_in.amount,
            payment_method=payment_in.payment_method.value if hasattr(payment_in.payment_method, 'value') else payment_in.payment_method,
            notes=payment_in.notes,
            handled_by=payment_in.handled_by.value if hasattr(payment_in.handled_by, 'value') else payment_in.handled_by
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)

        # Log into Cash Book
        from app.services.cashbook import CashBookService
        CashBookService.log_transaction(
            db=db,
            transaction_date=db_payment.payment_date,
            transaction_type="Income",
            name=seth.seth_name,
            payment_method=db_payment.payment_method,
            income_amount=db_payment.amount,
            out_amount=Decimal("0.00"),
            handled_by=db_payment.handled_by,
            reference_module="Seth Payment",
            reference_id=db_payment.id,
            notes=db_payment.notes
        )

        return db_payment

    @staticmethod
    def get_payment_by_id(db: Session, payment_id: int) -> Optional[SethPayment]:
        return db.query(SethPayment).filter(SethPayment.id == payment_id).first()

    @staticmethod
    def get_all_payments(
        db: Session,
        seth_name: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        payment_method: Optional[str] = None,
        handled_by: Optional[str] = None
    ) -> List[SethPayment]:
        query = db.query(SethPayment).join(Seth)

        if seth_name:
            query = query.filter(Seth.seth_name.ilike(f"%{seth_name}%"))
        if date_from:
            query = query.filter(SethPayment.payment_date >= date_from)
        if date_to:
            query = query.filter(SethPayment.payment_date <= date_to)
        if payment_method:
            query = query.filter(SethPayment.payment_method == payment_method)
        if handled_by:
            query = query.filter(SethPayment.handled_by == handled_by)

        return query.order_by(SethPayment.payment_date.desc(), SethPayment.id.desc()).all()

    # ================= Integrations Exporters =================
    @staticmethod
    def generate_cash_book_transaction(db_payment: SethPayment) -> Dict[str, Any]:
        """
        Prepares standard CASH BOOK transaction payload: INCOME, Money In.
        """
        return {
            "transaction_type": "INCOME",
            "direction": "Money In",
            "date": db_payment.payment_date,
            "seth_name": db_payment.seth.seth_name if db_payment.seth else f"Seth #{db_payment.seth_id}",
            "amount": db_payment.amount,
            "method": db_payment.payment_method,
            "handled_by": db_payment.handled_by,
            "notes": db_payment.notes
        }

    @staticmethod
    def generate_partner_allocation(db_payment: SethPayment) -> Dict[str, Any]:
        """
        Provides structure for Partner Management dashboard routing,
        filtering the transaction inside Rajubhai, Dhruveshbhai, or All Partners View.
        """
        return {
            "amount": db_payment.amount,
            "date": db_payment.payment_date,
            "received_from": db_payment.seth.seth_name if db_payment.seth else f"Seth #{db_payment.seth_id}",
            "handled_by": db_payment.handled_by,
            "partner_visibility": {
                "Rajubhai": db_payment.handled_by == "Rajubhai",
                "Dhruveshbhai": db_payment.handled_by == "Dhruveshbhai",
                "All_Partners": True
            }
        }
