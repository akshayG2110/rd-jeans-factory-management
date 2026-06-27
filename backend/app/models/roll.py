from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Roll(Base):
    __tablename__ = "rolls"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seth_id = Column(Integer, ForeignKey("seths.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    roll_number = Column(String, unique=True, nullable=False, index=True)
    short_number = Column(String, unique=True, nullable=False, index=True)
    fabric_type = Column(String, nullable=False, index=True)
    received_meter = Column(Numeric(10, 2), nullable=False)
    used_meter = Column(Numeric(10, 2), nullable=False, default=0.00)
    remaining_meter = Column(Numeric(10, 2), nullable=False)  # received_meter - used_meter
    status = Column(String, nullable=False, default="Available", index=True)  # Available, Partially Used, Completed
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    seth = relationship("Seth", back_populates="rolls")
    cuttings = relationship("Cutting", back_populates="roll", cascade="all, delete-orphan")
