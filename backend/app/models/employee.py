from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_name = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False, index=True)
    joining_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="Active", index=True)  # Active, Inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    upads = relationship("Upad", back_populates="employee", cascade="all, delete-orphan")
    salaries = relationship("Salary", back_populates="employee", cascade="all, delete-orphan")
