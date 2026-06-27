from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.roll import Roll
from app.models.seth import Seth
from app.schemas.roll import RollCreate, RollUpdate, RollStatus
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class RollService:
    @staticmethod
    def _determine_status(received_meter: Decimal, used_meter: Decimal) -> str:
        remaining = received_meter - used_meter
        if used_meter == 0:
            return RollStatus.AVAILABLE.value
        elif remaining <= 0:
            return RollStatus.COMPLETED.value
        else:
            return RollStatus.PARTIALLY_USED.value

    @classmethod
    def create(cls, db: Session, roll_in: RollCreate) -> Roll:
        # Validate Seth exists
        seth = db.query(Seth).filter(Seth.id == roll_in.seth_id).first()
        if not seth:
            raise ValueError(f"Seth with ID {roll_in.seth_id} does not exist.")

        # Recalculate properties
        remaining_meter = roll_in.received_meter - roll_in.used_meter
        status_val = cls._determine_status(roll_in.received_meter, roll_in.used_meter)

        db_roll = Roll(
            seth_id=roll_in.seth_id,
            entry_date=roll_in.entry_date,
            roll_number=roll_in.roll_number,
            short_number=roll_in.short_number,
            fabric_type=roll_in.fabric_type,
            received_meter=roll_in.received_meter,
            used_meter=roll_in.used_meter,
            remaining_meter=remaining_meter,
            status=status_val,
            notes=roll_in.notes
        )
        db.add(db_roll)
        db.commit()
        db.refresh(db_roll)
        return db_roll

    @staticmethod
    def get_by_id(db: Session, roll_id: int) -> Optional[Roll]:
        return db.query(Roll).filter(Roll.id == roll_id).first()

    @staticmethod
    def get_all(
        db: Session,
        seth_id: Optional[int] = None,
        roll_number: Optional[str] = None,
        short_number: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None
    ) -> List[Roll]:
        query = db.query(Roll)

        # Filters
        if seth_id is not None:
            query = query.filter(Roll.seth_id == seth_id)
        if roll_number:
            query = query.filter(Roll.roll_number == roll_number)
        if short_number:
            query = query.filter(Roll.short_number == short_number)
        if status:
            query = query.filter(Roll.status == status)
        if date_from:
            query = query.filter(Roll.entry_date >= date_from)
        if date_to:
            query = query.filter(Roll.entry_date <= date_to)

        # Partial search support
        if search:
            search_clause = or_(
                Roll.roll_number.ilike(f"%{search}%"),
                Roll.short_number.ilike(f"%{search}%"),
                Roll.fabric_type.ilike(f"%{search}%")
            )
            query = query.filter(search_clause)

        return query.order_by(Roll.entry_date.desc(), Roll.id.desc()).all()

    @classmethod
    def update(cls, db: Session, db_roll: Roll, roll_in: RollUpdate) -> Roll:
        # Verify seth if changed
        if roll_in.seth_id is not None and roll_in.seth_id != db_roll.seth_id:
            seth = db.query(Seth).filter(Seth.id == roll_in.seth_id).first()
            if not seth:
                raise ValueError(f"Seth with ID {roll_in.seth_id} does not exist.")

        update_data = roll_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if hasattr(value, 'value'):
                    setattr(db_roll, field, value.value)
                else:
                    setattr(db_roll, field, value)

        # Recalculate remaining meter and status
        db_roll.remaining_meter = db_roll.received_meter - db_roll.used_meter
        db_roll.status = cls._determine_status(db_roll.received_meter, db_roll.used_meter)

        db.commit()
        db.refresh(db_roll)
        return db_roll

    @staticmethod
    def delete(db: Session, db_roll: Roll) -> None:
        db.delete(db_roll)
        db.commit()

    @staticmethod
    def get_summary_metrics(db: Session) -> Dict[str, Any]:
        """
        Dashboard aggregations across all fabric rolls.
        """
        total_rolls = db.query(func.count(Roll.id)).scalar() or 0
        
        available_rolls = db.query(func.count(Roll.id)).filter(
            Roll.status == RollStatus.AVAILABLE.value
        ).scalar() or 0
        
        partially_used_rolls = db.query(func.count(Roll.id)).filter(
            Roll.status == RollStatus.PARTIALLY_USED.value
        ).scalar() or 0
        
        completed_rolls = db.query(func.count(Roll.id)).filter(
            Roll.status == RollStatus.COMPLETED.value
        ).scalar() or 0
        
        total_remaining_meter = db.query(func.coalesce(func.sum(Roll.remaining_meter), 0)).scalar() or 0

        return {
            "total_rolls": total_rolls,
            "available_rolls": available_rolls,
            "partially_used_rolls": partially_used_rolls,
            "completed_rolls": completed_rolls,
            "total_remaining_meter": Decimal(total_remaining_meter)
        }
