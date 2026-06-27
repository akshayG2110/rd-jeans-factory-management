from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric
from sqlalchemy.sql import func
from app.database.database import Base

class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    income_date = Column(Date, nullable=False, index=True)
    income_source = Column(String, nullable=False, index=True)  # Seth Payment, Other Income
    source_name = Column(String, nullable=False, index=True)  # e.g., Lalitbhai RD, Scrap Fabric Sale
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
