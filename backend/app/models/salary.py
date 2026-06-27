from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Salary(Base):
    __tablename__ = "salaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    salary_month = Column(Integer, nullable=False, index=True)  # 1-12
    salary_year = Column(Integer, nullable=False, index=True)
    salary_amount = Column(Numeric(10, 2), nullable=False)
    paid_amount = Column(Numeric(10, 2), nullable=False)
    remaining_amount = Column(Numeric(10, 2), nullable=False)  # salary_amount - paid_amount
    payment_method = Column(String, nullable=False, index=True)  # Cash, GPay, Bank Transfer
    notes = Column(String, nullable=True)
    handled_by = Column(String, nullable=False, index=True)  # Rajubhai, Dhruveshbhai
    payment_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    employee = relationship("Employee", back_populates="salaries")
