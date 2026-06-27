from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric
from sqlalchemy.sql import func
from app.database.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expense_date = Column(Date, nullable=False, index=True)
    expense_category = Column(String, nullable=False, index=True)  # Salary, Upad, Rent, etc.
    party_name = Column(String, nullable=False, index=True)  # e.g., Landlord, Electric Company
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String, nullable=False, index=True)  # Cash, GPay, Bank Transfer, Cheque
    handled_by = Column(String, nullable=False, index=True)  # Rajubhai, Dhruveshbhai
    reference_number = Column(String, nullable=True, index=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
