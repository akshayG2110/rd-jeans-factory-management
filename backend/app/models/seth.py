from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Seth(Base):
    __tablename__ = "seths"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seth_name = Column(String, nullable=False, index=True)
    mobile_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Active", index=True)  # Active, Inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    payments = relationship("SethPayment", back_populates="seth", cascade="all, delete-orphan")
    rolls = relationship("Roll", back_populates="seth", cascade="all, delete-orphan")

class SethPayment(Base):
    __tablename__ = "seth_payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seth_id = Column(Integer, ForeignKey("seths.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String, nullable=False, index=True)  # Cash, GPay, Bank Transfer, Cheque
    notes = Column(String, nullable=True)
    handled_by = Column(String, nullable=False, index=True)  # Rajubhai, Dhruveshbhai
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    seth = relationship("Seth", back_populates="payments")
