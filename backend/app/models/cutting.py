from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Cutting(Base):
    __tablename__ = "cutting_entries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cutting_date = Column(Date, nullable=False, index=True)
    lot_number = Column(String, unique=True, nullable=False, index=True)
    roll_id = Column(Integer, ForeignKey("rolls.id", ondelete="CASCADE"), nullable=False, index=True)
    meter_used = Column(Numeric(10, 2), nullable=False)
    layer_information = Column(String, nullable=True)
    piece_count = Column(Integer, nullable=False)
    size = Column(String, nullable=False, index=True)
    pana = Column(Numeric(10, 2), nullable=True)
    average = Column(Numeric(10, 2), nullable=True)
    sort_number = Column(String, nullable=True, index=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    roll = relationship("Roll", back_populates="cuttings")
