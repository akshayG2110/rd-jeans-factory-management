from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.cutting import Cutting
from app.models.roll import Roll
from app.models.seth import Seth
from app.schemas.cutting import CuttingCreate, CuttingUpdate
from app.services.roll import RollService
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal

class CuttingService:
    @staticmethod
    def create(db: Session, cutting_in: CuttingCreate) -> Cutting:
        # Validate roll exists
        roll = db.query(Roll).filter(Roll.id == cutting_in.roll_id).first()
        if not roll:
            raise ValueError(f"Fabric roll with ID {cutting_in.roll_id} does not exist.")

        # Validate roll has enough remaining meters
        if roll.remaining_meter < cutting_in.meter_used:
            raise ValueError(f"Insufficient Roll Balance: Requested {cutting_in.meter_used}m, Available {roll.remaining_meter}m")

        db_cutting = Cutting(
            cutting_date=cutting_in.cutting_date,
            lot_number=cutting_in.lot_number,
            roll_id=cutting_in.roll_id,
            meter_used=cutting_in.meter_used,
            layer_information=cutting_in.layer_information,
            piece_count=cutting_in.piece_count,
            size=cutting_in.size,
            pana=cutting_in.pana,
            average=cutting_in.average,
            sort_number=cutting_in.sort_number,
            notes=cutting_in.notes
        )
        db.add(db_cutting)

        # Update consumed meters in Roll
        roll.used_meter += cutting_in.meter_used
        roll.remaining_meter = roll.received_meter - roll.used_meter
        roll.status = RollService._determine_status(roll.received_meter, roll.used_meter)

        db.commit()
        db.refresh(db_cutting)
        return db_cutting

    @staticmethod
    def get_by_id(db: Session, cutting_id: int) -> Optional[Cutting]:
        return db.query(Cutting).filter(Cutting.id == cutting_id).first()

    @staticmethod
    def get_all(
        db: Session,
        lot_number: Optional[str] = None,
        roll_number: Optional[str] = None,
        seth_name: Optional[str] = None,
        size: Optional[str] = None,
        sort_number: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None
    ) -> List[Cutting]:
        query = db.query(Cutting).join(Roll).join(Seth)

        # Filters
        if lot_number:
            query = query.filter(Cutting.lot_number == lot_number)
        if roll_number:
            query = query.filter(Roll.roll_number == roll_number)
        if seth_name:
            query = query.filter(Seth.seth_name.ilike(f"%{seth_name}%"))
        if size:
            query = query.filter(Cutting.size == size)
        if sort_number:
            query = query.filter(Cutting.sort_number == sort_number)
        if date_from:
            query = query.filter(Cutting.cutting_date >= date_from)
        if date_to:
            query = query.filter(Cutting.cutting_date <= date_to)

        # Partial search support
        if search:
            search_clause = or_(
                Cutting.lot_number.ilike(f"%{search}%"),
                Roll.roll_number.ilike(f"%{search}%"),
                Cutting.sort_number.ilike(f"%{search}%")
            )
            query = query.filter(search_clause)

        return query.order_by(Cutting.cutting_date.desc(), Cutting.id.desc()).all()

    @classmethod
    def update(cls, db: Session, db_cutting: Cutting, cutting_in: CuttingUpdate) -> Cutting:
        # Validate roll if changed
        target_roll_id = cutting_in.roll_id if cutting_in.roll_id is not None else db_cutting.roll_id
        roll = db.query(Roll).filter(Roll.id == target_roll_id).first()
        if not roll:
            raise ValueError(f"Fabric roll with ID {target_roll_id} does not exist.")

        new_meter_used = cutting_in.meter_used if cutting_in.meter_used is not None else db_cutting.meter_used

        # Assert validation balances
        if target_roll_id == db_cutting.roll_id:
            # Updating same roll: temp revert old used meters to check availability
            temp_remaining = roll.remaining_meter + db_cutting.meter_used
            if temp_remaining < new_meter_used:
                raise ValueError(f"Insufficient Roll Balance: Requested {new_meter_used}m, Available {temp_remaining}m")
            
            # Commit adjustment
            roll.used_meter = roll.used_meter - db_cutting.meter_used + new_meter_used
            roll.remaining_meter = roll.received_meter - roll.used_meter
            roll.status = RollService._determine_status(roll.received_meter, roll.used_meter)
        else:
            # Swapping rolls: check new roll capacity
            if roll.remaining_meter < new_meter_used:
                raise ValueError(f"Insufficient Roll Balance: Requested {new_meter_used}m, Available {roll.remaining_meter}m")
            
            # Revert old roll
            old_roll = db.query(Roll).filter(Roll.id == db_cutting.roll_id).first()
            if old_roll:
                old_roll.used_meter -= db_cutting.meter_used
                old_roll.remaining_meter = old_roll.received_meter - old_roll.used_meter
                old_roll.status = RollService._determine_status(old_roll.received_meter, old_roll.used_meter)
            
            # Consume from new roll
            roll.used_meter += new_meter_used
            roll.remaining_meter = roll.received_meter - roll.used_meter
            roll.status = RollService._determine_status(roll.received_meter, roll.used_meter)

        # Update remaining values
        update_data = cutting_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_cutting, field, value)

        db.commit()
        db.refresh(db_cutting)
        return db_cutting

    @staticmethod
    def delete(db: Session, db_cutting: Cutting) -> None:
        # Revert roll consumption
        roll = db.query(Roll).filter(Roll.id == db_cutting.roll_id).first()
        if roll:
            roll.used_meter -= db_cutting.meter_used
            roll.remaining_meter = roll.received_meter - roll.used_meter
            roll.status = RollService._determine_status(roll.received_meter, roll.used_meter)

        db.delete(db_cutting)
        db.commit()

    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        """
        Dashboard aggregations across cutting lots and fabric pieces.
        """
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        total_cutting_lots = db.query(func.count(Cutting.id)).scalar() or 0
        total_pieces_generated = db.query(func.coalesce(func.sum(Cutting.piece_count), 0)).scalar() or 0

        today_cutting_lots = db.query(func.count(Cutting.id)).filter(
            Cutting.cutting_date == today
        ).scalar() or 0
        today_pieces_generated = db.query(func.coalesce(func.sum(Cutting.piece_count), 0)).filter(
            Cutting.cutting_date == today
        ).scalar() or 0

        monthly_pieces_generated = db.query(func.coalesce(func.sum(Cutting.piece_count), 0)).filter(
            Cutting.cutting_date >= start_of_month
        ).scalar() or 0

        return {
            "total_cutting_lots": total_cutting_lots,
            "total_pieces_generated": total_pieces_generated,
            "today_cutting_lots": today_cutting_lots,
            "today_pieces_generated": today_pieces_generated,
            "monthly_pieces_generated": monthly_pieces_generated
        }
