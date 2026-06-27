from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric
from sqlalchemy.sql import func
from app.database.database import Base

class CashBook(Base):
    __tablename__ = "cash_book_ledger"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(String, nullable=False, index=True)  # Income, Salary, Upad, Rent, etc.
    name = Column(String, nullable=False, index=True)  # Name of Seth, Employee, Party, or Source
    payment_method = Column(String, nullable=False, index=True)  # Cash, GPay, Bank Transfer, Cheque
    income_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    out_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    running_balance = Column(Numeric(10, 2), nullable=False)
    handled_by = Column(String, nullable=False, index=True)  # Rajubhai, Dhruveshbhai
    reference_module = Column(String, nullable=False, index=True)  # Income, Expense, Salary, Upad, Seth Payment
    reference_id = Column(Integer, nullable=False, index=True)  # FK to source record id
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
