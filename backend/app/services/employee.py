from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeStatus
from typing import List, Optional

class EmployeeService:
    @staticmethod
    def create(db: Session, employee_in: EmployeeCreate) -> Employee:
        db_employee = Employee(
            employee_name=employee_in.employee_name,
            role=employee_in.role.value if hasattr(employee_in.role, 'value') else employee_in.role,
            joining_date=employee_in.joining_date,
            status=employee_in.status.value if hasattr(employee_in.status, 'value') else employee_in.status
        )
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee

    @staticmethod
    def get_by_id(db: Session, employee_id: int) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.id == employee_id).first()

    @staticmethod
    def get_all(
        db: Session,
        employee_name: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Employee]:
        query = db.query(Employee)
        
        if employee_name:
            query = query.filter(Employee.employee_name.ilike(f"%{employee_name}%"))
        if role:
            query = query.filter(Employee.role == role)
        if status:
            query = query.filter(Employee.status == status)
            
        return query.order_by(Employee.id.desc()).all()

    @staticmethod
    def update(db: Session, db_employee: Employee, employee_in: EmployeeUpdate) -> Employee:
        update_data = employee_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if hasattr(value, 'value'):
                    setattr(db_employee, field, value.value)
                else:
                    setattr(db_employee, field, value)
        
        db.commit()
        db.refresh(db_employee)
        return db_employee

    @staticmethod
    def soft_delete(db: Session, db_employee: Employee) -> Employee:
        db_employee.status = EmployeeStatus.INACTIVE.value
        db.commit()
        db.refresh(db_employee)
        return db_employee
