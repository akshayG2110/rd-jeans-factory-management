from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.employee import Employee
from app.models.upad import Upad
from app.models.salary import Salary
from app.models.seth import Seth, SethPayment
from app.models.roll import Roll
from app.models.cutting import Cutting
from app.models.income import Income
from app.models.expense import Expense
from app.models.cashbook import CashBook
from app.schemas.employee import EmployeeStatus
from app.schemas.roll import RollStatus
from typing import List, Optional, Dict, Any
from datetime import date
from decimal import Decimal
from io import BytesIO
import openpyxl
from openpyxl.styles import Font as XFont, Alignment as XAlignment, PatternFill as XFill
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportService:
    # ================= Employees Report =================
    @staticmethod
    def get_employees_report(db: Session, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        total_employees = db.query(func.count(Employee.id)).scalar() or 0
        active_employees = db.query(func.count(Employee.id)).filter(Employee.status == EmployeeStatus.ACTIVE.value).scalar() or 0
        inactive_employees = db.query(func.count(Employee.id)).filter(Employee.status == EmployeeStatus.INACTIVE.value).scalar() or 0

        query = db.query(Employee)
        if status:
            query = query.filter(Employee.status == status)
        employees_list = query.order_by(Employee.id.desc()).offset(skip).limit(limit).all()

        return {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "inactive_employees": inactive_employees,
            "employees_list": employees_list
        }

    # ================= Upad Report =================
    @staticmethod
    def get_upad_report(db: Session, employee_id: Optional[int] = None, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        # 1. Employee-wise Upad
        emp_query = db.query(
            Upad.employee_id,
            Employee.employee_name,
            func.sum(Upad.amount).label("total_amount"),
            func.count(Upad.id).label("transaction_count")
        ).join(Employee, Upad.employee_id == Employee.id)
        if employee_id:
            emp_query = emp_query.filter(Upad.employee_id == employee_id)
        if date_from:
            emp_query = emp_query.filter(Upad.date >= date_from)
        if date_to:
            emp_query = emp_query.filter(Upad.date <= date_to)
        employee_wise = emp_query.group_by(Upad.employee_id, Employee.employee_name).all()

        # 2. Date-wise Upad
        date_query = db.query(
            Upad.date,
            func.sum(Upad.amount).label("total_amount"),
            func.count(Upad.id).label("transaction_count")
        )
        if employee_id:
            date_query = date_query.filter(Upad.employee_id == employee_id)
        if date_from:
            date_query = date_query.filter(Upad.date >= date_from)
        if date_to:
            date_query = date_query.filter(Upad.date <= date_to)
        date_wise = date_query.group_by(Upad.date).order_by(Upad.date.desc()).all()

        # 3. Monthly Upad summary
        month_query = db.query(
            extract('year', Upad.date).label('year'),
            extract('month', Upad.date).label('month'),
            func.sum(Upad.amount).label('total_amount')
        )
        if employee_id:
            month_query = month_query.filter(Upad.employee_id == employee_id)
        if date_from:
            month_query = month_query.filter(Upad.date >= date_from)
        if date_to:
            month_query = month_query.filter(Upad.date <= date_to)
        monthly_summary = month_query.group_by(extract('year', Upad.date), extract('month', Upad.date)).all()

        # 4. Current month Upad
        curr_month_query = db.query(func.coalesce(func.sum(Upad.amount), 0))
        if employee_id:
            curr_month_query = curr_month_query.filter(Upad.employee_id == employee_id)
        current_month_upad = curr_month_query.filter(Upad.date >= start_of_month).scalar() or 0

        return {
            "employee_wise_upad": [
                {"employee_id": r[0], "employee_name": r[1], "total_amount": Decimal(r[2]), "transaction_count": r[3]} for r in employee_wise
            ],
            "date_wise_upad": [
                {"date": r[0], "total_amount": Decimal(r[1]), "transaction_count": r[2]} for r in date_wise
            ],
            "monthly_upad_summary": [
                {"year": int(r[0]), "month": int(r[1]), "total_amount": Decimal(r[2])} for r in monthly_summary
            ],
            "current_month_upad": Decimal(current_month_upad)
        }

    # ================= Salary Report =================
    @staticmethod
    def get_salary_report(db: Session, employee_id: Optional[int] = None, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # Employee wise salary balance summary
        salary_query = db.query(
            Salary.employee_id,
            Employee.employee_name,
            func.sum(Salary.salary_amount).label("total_salary_finalized"),
            func.sum(Salary.paid_amount).label("total_salary_paid"),
            func.sum(Salary.remaining_amount).label("total_salary_pending")
        ).join(Employee, Salary.employee_id == Employee.id)
        if employee_id:
            salary_query = salary_query.filter(Salary.employee_id == employee_id)
        if date_from:
            salary_query = salary_query.filter(Salary.payment_date >= date_from)
        if date_to:
            salary_query = salary_query.filter(Salary.payment_date <= date_to)
        
        employee_wise = salary_query.group_by(Salary.employee_id, Employee.employee_name).all()

        # History list
        hist_query = db.query(Salary)
        if employee_id:
            hist_query = hist_query.filter(Salary.employee_id == employee_id)
        if date_from:
            hist_query = hist_query.filter(Salary.payment_date >= date_from)
        if date_to:
            hist_query = hist_query.filter(Salary.payment_date <= date_to)
        salary_payment_history = hist_query.order_by(Salary.payment_date.desc(), Salary.id.desc()).all()

        # Pending salary sum
        pending_query = db.query(func.coalesce(func.sum(Salary.remaining_amount), 0))
        if employee_id:
            pending_query = pending_query.filter(Salary.employee_id == employee_id)
        pending_salary = pending_query.scalar() or 0

        # Monthly summary
        month_query = db.query(
            extract('year', Salary.payment_date).label('year'),
            extract('month', Salary.payment_date).label('month'),
            func.sum(Salary.paid_amount).label('total_amount')
        )
        if employee_id:
            month_query = month_query.filter(Salary.employee_id == employee_id)
        if date_from:
            month_query = month_query.filter(Salary.payment_date >= date_from)
        if date_to:
            month_query = month_query.filter(Salary.payment_date <= date_to)
        monthly_summary = month_query.group_by(extract('year', Salary.payment_date), extract('month', Salary.payment_date)).all()

        return {
            "employee_wise_salary": [
                {
                    "employee_id": r[0],
                    "employee_name": r[1],
                    "total_salary_finalized": Decimal(r[2]),
                    "total_salary_paid": Decimal(r[3]),
                    "total_salary_pending": Decimal(r[4])
                } for r in employee_wise
            ],
            "salary_payment_history": salary_payment_history,
            "pending_salary": Decimal(pending_salary),
            "monthly_salary_summary": [
                {"year": int(r[0]), "month": int(r[1]), "total_amount": Decimal(r[2])} for r in monthly_summary
            ]
        }

    # ================= Seth Report =================
    @staticmethod
    def get_seth_report(db: Session, seth_id: Optional[int] = None, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # History
        hist_query = db.query(SethPayment)
        if seth_id:
            hist_query = hist_query.filter(SethPayment.seth_id == seth_id)
        if date_from:
            hist_query = hist_query.filter(SethPayment.payment_date >= date_from)
        if date_to:
            hist_query = hist_query.filter(SethPayment.payment_date <= date_to)
        seth_payment_history = hist_query.order_by(SethPayment.payment_date.desc(), SethPayment.id.desc()).all()

        # Seth Wise Income
        seth_wise_query = db.query(
            SethPayment.seth_id,
            Seth.seth_name,
            func.sum(SethPayment.amount).label("total_amount"),
            func.count(SethPayment.id).label("payment_count")
        ).join(Seth, SethPayment.seth_id == Seth.id)
        if seth_id:
            seth_wise_query = seth_wise_query.filter(SethPayment.seth_id == seth_id)
        if date_from:
            seth_wise_query = seth_wise_query.filter(SethPayment.payment_date >= date_from)
        if date_to:
            seth_wise_query = seth_wise_query.filter(SethPayment.payment_date <= date_to)
        seth_wise = seth_wise_query.group_by(SethPayment.seth_id, Seth.seth_name).all()

        # Monthly summary
        month_query = db.query(
            extract('year', SethPayment.payment_date).label('year'),
            extract('month', SethPayment.payment_date).label('month'),
            func.sum(SethPayment.amount).label('total_amount')
        )
        if seth_id:
            month_query = month_query.filter(SethPayment.seth_id == seth_id)
        if date_from:
            month_query = month_query.filter(SethPayment.payment_date >= date_from)
        if date_to:
            month_query = month_query.filter(SethPayment.payment_date <= date_to)
        monthly_summary = month_query.group_by(extract('year', SethPayment.payment_date), extract('month', SethPayment.payment_date)).all()

        return {
            "seth_payment_history": seth_payment_history,
            "seth_wise_income": [
                {"seth_id": r[0], "seth_name": r[1], "total_amount_received": Decimal(r[2]), "payment_count": r[3]} for r in seth_wise
            ],
            "monthly_seth_payments": [
                {"year": int(r[0]), "month": int(r[1]), "total_amount": Decimal(r[2])} for r in monthly_summary
            ]
        }

    # ================= Roll Inventory Report =================
    @staticmethod
    def get_rolls_report(db: Session, seth_id: Optional[int] = None, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # Available rolls list
        avail_query = db.query(Roll).filter(Roll.status == RollStatus.AVAILABLE.value)
        if seth_id:
            avail_query = avail_query.filter(Roll.seth_id == seth_id)
        if date_from:
            avail_query = avail_query.filter(Roll.entry_date >= date_from)
        if date_to:
            avail_query = avail_query.filter(Roll.entry_date <= date_to)
        available_rolls = avail_query.all()

        # Consumed rolls list
        consumed_query = db.query(Roll).filter(Roll.status == RollStatus.COMPLETED.value)
        if seth_id:
            consumed_query = consumed_query.filter(Roll.seth_id == seth_id)
        if date_from:
            consumed_query = consumed_query.filter(Roll.entry_date >= date_from)
        if date_to:
            consumed_query = consumed_query.filter(Roll.entry_date <= date_to)
        consumed_rolls = consumed_query.all()

        # Balance summaries
        balance_query = db.query(
            func.count(Roll.id).label("total_rolls"),
            func.coalesce(func.sum(Roll.received_meter), 0).label("total_received"),
            func.coalesce(func.sum(Roll.used_meter), 0).label("total_used"),
            func.coalesce(func.sum(Roll.remaining_meter), 0).label("total_remaining")
        )
        if seth_id:
            balance_query = balance_query.filter(Roll.seth_id == seth_id)
        if date_from:
            balance_query = balance_query.filter(Roll.entry_date >= date_from)
        if date_to:
            balance_query = balance_query.filter(Roll.entry_date <= date_to)
        balance = balance_query.first()

        # Seth Wise Rolls Summary
        seth_wise_query = db.query(
            Roll.seth_id,
            Seth.seth_name,
            func.count(Roll.id).label("rolls_count"),
            func.coalesce(func.sum(Roll.received_meter), 0).label("received"),
            func.coalesce(func.sum(Roll.used_meter), 0).label("used"),
            func.coalesce(func.sum(Roll.remaining_meter), 0).label("remaining")
        ).join(Seth, Roll.seth_id == Seth.id)
        if seth_id:
            seth_wise_query = seth_wise_query.filter(Roll.seth_id == seth_id)
        if date_from:
            seth_wise_query = seth_wise_query.filter(Roll.entry_date >= date_from)
        if date_to:
            seth_wise_query = seth_wise_query.filter(Roll.entry_date <= date_to)
        seth_wise = seth_wise_query.group_by(Roll.seth_id, Seth.seth_name).all()

        # Roll history
        hist_query = db.query(Roll)
        if seth_id:
            hist_query = hist_query.filter(Roll.seth_id == seth_id)
        if date_from:
            hist_query = hist_query.filter(Roll.entry_date >= date_from)
        if date_to:
            hist_query = hist_query.filter(Roll.entry_date <= date_to)
        roll_history = hist_query.order_by(Roll.entry_date.desc(), Roll.id.desc()).all()

        return {
            "available_rolls": available_rolls,
            "consumed_rolls": consumed_rolls,
            "roll_balance": {
                "total_rolls": balance[0],
                "total_received_meters": Decimal(balance[1]),
                "total_used_meters": Decimal(balance[2]),
                "total_remaining_meters": Decimal(balance[3])
            },
            "seth_wise_rolls": [
                {
                    "seth_id": r[0],
                    "seth_name": r[1],
                    "total_rolls": r[2],
                    "total_received_meters": Decimal(r[3]),
                    "total_used_meters": Decimal(r[4]),
                    "total_remaining_meters": Decimal(r[5])
                } for r in seth_wise
            ],
            "roll_history": roll_history
        }

    # ================= Cutting Report =================
    @staticmethod
    def get_cutting_report(db: Session, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # Daily cutting summary
        daily_query = db.query(
            Cutting.cutting_date,
            func.count(Cutting.id).label("total_lots"),
            func.sum(Cutting.piece_count).label("pieces"),
            func.sum(Cutting.meter_used).label("meters")
        )
        if date_from:
            daily_query = daily_query.filter(Cutting.cutting_date >= date_from)
        if date_to:
            daily_query = daily_query.filter(Cutting.cutting_date <= date_to)
        daily = daily_query.group_by(Cutting.cutting_date).order_by(Cutting.cutting_date.desc()).all()

        # Monthly summary
        month_query = db.query(
            extract('year', Cutting.cutting_date).label('year'),
            extract('month', Cutting.cutting_date).label('month'),
            func.sum(Cutting.piece_count).label('pieces')
        )
        if date_from:
            month_query = month_query.filter(Cutting.cutting_date >= date_from)
        if date_to:
            month_query = month_query.filter(Cutting.cutting_date <= date_to)
        monthly = month_query.group_by(extract('year', Cutting.cutting_date), extract('month', Cutting.cutting_date)).all()

        # Lot-wise Production
        lot_query = db.query(
            Cutting.lot_number,
            Cutting.cutting_date,
            Roll.fabric_type,
            Cutting.piece_count,
            Cutting.size,
            Cutting.sort_number
        ).join(Roll, Cutting.roll_id == Roll.id)
        if date_from:
            lot_query = lot_query.filter(Cutting.cutting_date >= date_from)
        if date_to:
            lot_query = lot_query.filter(Cutting.cutting_date <= date_to)
        lots = lot_query.order_by(Cutting.cutting_date.desc(), Cutting.id.desc()).all()

        # Roll Consumption
        roll_query = db.query(
            Roll.roll_number,
            Roll.fabric_type,
            func.count(Cutting.id).label("lots_count"),
            func.sum(Cutting.meter_used).label("meters")
        ).join(Roll, Cutting.roll_id == Roll.id)
        if date_from:
            roll_query = roll_query.filter(Cutting.cutting_date >= date_from)
        if date_to:
            roll_query = roll_query.filter(Cutting.cutting_date <= date_to)
        rolls = roll_query.group_by(Roll.id, Roll.roll_number, Roll.fabric_type).all()

        # Pieces count
        pieces_sum_query = db.query(func.coalesce(func.sum(Cutting.piece_count), 0))
        if date_from:
            pieces_sum_query = pieces_sum_query.filter(Cutting.cutting_date >= date_from)
        if date_to:
            pieces_sum_query = pieces_sum_query.filter(Cutting.cutting_date <= date_to)
        total_pieces = pieces_sum_query.scalar() or 0

        return {
            "daily_cutting": [
                {"date": r[0], "total_lots": r[1], "total_pieces_generated": r[2], "total_meters_used": Decimal(r[3])} for r in daily
            ],
            "monthly_cutting": [
                {"year": int(r[0]), "month": int(r[1]), "total_amount": Decimal(r[2])} for r in monthly
            ],
            "lot_wise_production": [
                {
                    "lot_number": r[0],
                    "cutting_date": r[1],
                    "fabric_type": r[2],
                    "piece_count": r[3],
                    "size": r[4],
                    "sort_number": r[5]
                } for r in lots
            ],
            "roll_consumption": [
                {
                    "roll_number": r[0],
                    "fabric_type": r[1],
                    "total_lots_cut": r[2],
                    "total_meters_consumed": Decimal(r[3])
                } for r in rolls
            ],
            "total_pieces_generated": total_pieces
        }

    # ================= Income Report =================
    @staticmethod
    def get_income_report(db: Session, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # Daily
        daily_query = db.query(
            Income.income_date,
            func.sum(Income.amount).label("total_amount")
        )
        if date_from:
            daily_query = daily_query.filter(Income.income_date >= date_from)
        if date_to:
            daily_query = daily_query.filter(Income.income_date <= date_to)
        daily = daily_query.group_by(Income.income_date).order_by(Income.income_date.desc()).all()

        # Monthly
        month_query = db.query(
            extract('year', Income.income_date).label('year'),
            extract('month', Income.income_date).label('month'),
            func.sum(Income.amount).label('total_amount')
        )
        if date_from:
            month_query = month_query.filter(Income.income_date >= date_from)
        if date_to:
            month_query = month_query.filter(Income.income_date <= date_to)
        monthly = month_query.group_by(extract('year', Income.income_date), extract('month', Income.income_date)).all()

        # Total amount for percentages calculation
        total_sum_query = db.query(func.coalesce(func.sum(Income.amount), 0))
        if date_from:
            total_sum_query = total_sum_query.filter(Income.income_date >= date_from)
        if date_to:
            total_sum_query = total_sum_query.filter(Income.income_date <= date_to)
        total_sum = total_sum_query.scalar() or Decimal("1.00")

        # Category Wise
        source_query = db.query(
            Income.income_source,
            func.sum(Income.amount).label("total_amount")
        )
        if date_from:
            source_query = source_query.filter(Income.income_date >= date_from)
        if date_to:
            source_query = source_query.filter(Income.income_date <= date_to)
        sources = source_query.group_by(Income.income_source).all()

        # Handled By Partner Wise
        partner_query = db.query(
            Income.handled_by,
            func.sum(Income.amount).label("total_amount")
        )
        if date_from:
            partner_query = partner_query.filter(Income.income_date >= date_from)
        if date_to:
            partner_query = partner_query.filter(Income.income_date <= date_to)
        partners = partner_query.group_by(Income.handled_by).all()

        return {
            "daily_income": [{"date": r[0], "total_amount": Decimal(r[1])} for r in daily],
            "monthly_income": [{"year": int(r[0]), "month": int(r[1]), "total_amount": Decimal(r[2])} for r in monthly],
            "income_source_summary": [
                {
                    "category": r[0],
                    "total_amount": Decimal(r[1]),
                    "percentage": Decimal(round((r[1] / total_sum) * 100, 2))
                } for r in sources
            ],
            "partner_wise_income": [{"partner_name": r[0], "total_income_handled": Decimal(r[1])} for r in partners]
        }

    # ================= Expense Report =================
    @staticmethod
    def get_expense_report(db: Session, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # Daily
        daily_query = db.query(
            Expense.expense_date,
            func.sum(Expense.amount).label("total_amount")
        )
        if date_from:
            daily_query = daily_query.filter(Expense.expense_date >= date_from)
        if date_to:
            daily_query = daily_query.filter(Expense.expense_date <= date_to)
        daily = daily_query.group_by(Expense.expense_date).order_by(Expense.expense_date.desc()).all()

        # Monthly
        month_query = db.query(
            extract('year', Expense.expense_date).label('year'),
            extract('month', Expense.expense_date).label('month'),
            func.sum(Expense.amount).label('total_amount')
        )
        if date_from:
            month_query = month_query.filter(Expense.expense_date >= date_from)
        if date_to:
            month_query = month_query.filter(Expense.expense_date <= date_to)
        monthly = month_query.group_by(extract('year', Expense.expense_date), extract('month', Expense.expense_date)).all()

        # Total amount for percentages calculation
        total_sum_query = db.query(func.coalesce(func.sum(Expense.amount), 0))
        if date_from:
            total_sum_query = total_sum_query.filter(Expense.expense_date >= date_from)
        if date_to:
            total_sum_query = total_sum_query.filter(Expense.expense_date <= date_to)
        total_sum = total_sum_query.scalar() or Decimal("1.00")

        # Category Wise
        cat_query = db.query(
            Expense.expense_category,
            func.sum(Expense.amount).label("total_amount")
        )
        if date_from:
            cat_query = cat_query.filter(Expense.expense_date >= date_from)
        if date_to:
            cat_query = cat_query.filter(Expense.expense_date <= date_to)
        categories = cat_query.group_by(Expense.expense_category).all()

        # Handled By Partner Wise
        partner_query = db.query(
            Expense.handled_by,
            func.sum(Expense.amount).label("total_amount")
        )
        if date_from:
            partner_query = partner_query.filter(Expense.expense_date >= date_from)
        if date_to:
            partner_query = partner_query.filter(Expense.expense_date <= date_to)
        partners = partner_query.group_by(Expense.handled_by).all()

        return {
            "daily_expense": [{"date": r[0], "total_amount": Decimal(r[1])} for r in daily],
            "monthly_expense": [{"year": int(r[0]), "month": int(r[1]), "total_amount": Decimal(r[2])} for r in monthly],
            "expense_category_summary": [
                {
                    "category": r[0],
                    "total_amount": Decimal(r[1]),
                    "percentage": Decimal(round((r[1] / total_sum) * 100, 2))
                } for r in categories
            ],
            "partner_wise_expense": [{"partner_name": r[0], "total_expense_handled": Decimal(r[1])} for r in partners]
        }

    # ================= Cash Book Report =================
    @staticmethod
    def get_cashbook_report(db: Session, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # Cash Flow Entries
        flow_query = db.query(
            CashBook.transaction_date,
            func.sum(CashBook.income_amount).label("income"),
            func.sum(CashBook.out_amount).label("out")
        )
        if date_from:
            flow_query = flow_query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            flow_query = flow_query.filter(CashBook.transaction_date <= date_to)
        flows = flow_query.group_by(CashBook.transaction_date).order_by(CashBook.transaction_date.desc()).all()

        # Daily
        daily_query = db.query(
            CashBook.transaction_date,
            func.sum(CashBook.income_amount + CashBook.out_amount).label("total")
        )
        if date_from:
            daily_query = daily_query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            daily_query = daily_query.filter(CashBook.transaction_date <= date_to)
        daily = daily_query.group_by(CashBook.transaction_date).order_by(CashBook.transaction_date.desc()).all()

        # Monthly
        month_query = db.query(
            extract('year', CashBook.transaction_date).label('year'),
            extract('month', CashBook.transaction_date).label('month'),
            func.sum(CashBook.income_amount - CashBook.out_amount).label('total')
        )
        if date_from:
            month_query = month_query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            month_query = month_query.filter(CashBook.transaction_date <= date_to)
        monthly = month_query.group_by(extract('year', CashBook.transaction_date), extract('month', CashBook.transaction_date)).all()

        # Running balance list
        bal_query = db.query(CashBook)
        if date_from:
            bal_query = bal_query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            bal_query = bal_query.filter(CashBook.transaction_date <= date_to)
        running_history = bal_query.order_by(CashBook.transaction_date.desc(), CashBook.id.desc()).all()

        return {
            "cash_flow_report": [
                {
                    "date": r[0],
                    "income_sum": Decimal(r[1]),
                    "out_sum": Decimal(r[2]),
                    "net_flow": Decimal(r[1] - r[2])
                } for r in flows
            ],
            "daily_cash_summary": [{"date": r[0], "total_amount": Decimal(r[1])} for r in daily],
            "monthly_cash_summary": [{"year": int(r[0]), "month": int(r[1]), "total_amount": Decimal(r[2])} for r in monthly],
            "running_balance_history": running_history
        }

    # ================= Partner Report =================
    @staticmethod
    def get_partner_report(db: Session, date_from: Optional[date] = None, date_to: Optional[date] = None) -> Dict[str, Any]:
        # All transactions
        all_tx_query = db.query(CashBook)
        if date_from:
            all_tx_query = all_tx_query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            all_tx_query = all_tx_query.filter(CashBook.transaction_date <= date_to)
        all_transactions = all_tx_query.order_by(CashBook.transaction_date.desc(), CashBook.id.desc()).all()

        # Rajubhai transactions
        raj_tx_query = db.query(CashBook).filter(CashBook.handled_by == "Rajubhai")
        if date_from:
            raj_tx_query = raj_tx_query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            raj_tx_query = raj_tx_query.filter(CashBook.transaction_date <= date_to)
        rajubhai_transactions = raj_tx_query.order_by(CashBook.transaction_date.desc(), CashBook.id.desc()).all()

        # Dhruveshbhai transactions
        dhr_tx_query = db.query(CashBook).filter(CashBook.handled_by == "Dhruveshbhai")
        if date_from:
            dhr_tx_query = dhr_tx_query.filter(CashBook.transaction_date >= date_from)
        if date_to:
            dhr_tx_query = dhr_tx_query.filter(CashBook.transaction_date <= date_to)
        dhruveshbhai_transactions = dhr_tx_query.order_by(CashBook.transaction_date.desc(), CashBook.id.desc()).all()

        # Partner-wise summary stats lists (Using Income and Expense services aggregations)
        partners = ["Rajubhai", "Dhruveshbhai"]
        partner_summaries = []
        for partner in partners:
            income_sum = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
                CashBook.handled_by == partner
            ).scalar()
            expense_sum = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
                CashBook.handled_by == partner
            ).scalar()
            tx_count = db.query(func.count(CashBook.id)).filter(
                CashBook.handled_by == partner
            ).scalar()
            
            partner_summaries.append({
                "partner_name": partner,
                "total_income_handled": Decimal(income_sum),
                "total_expense_handled": Decimal(expense_sum),
                "transaction_count": tx_count
            })

        # Format items to fit schemas
        income_handled = [{"partner_name": p["partner_name"], "total_income_handled": p["total_income_handled"]} for p in partner_summaries]
        expense_handled = [{"partner_name": p["partner_name"], "total_expense_handled": p["total_expense_handled"]} for p in partner_summaries]

        return {
            "all_transactions": all_transactions,
            "rajubhai_transactions": rajubhai_transactions,
            "dhruveshbhai_transactions": dhruveshbhai_transactions,
            "income_handled": income_handled,
            "expense_handled": expense_handled,
            "partner_summary": partner_summaries
        }

    @staticmethod
    def _query_report_data(db: Session, report_type: str, filters: Dict[str, Any]) -> tuple:
        """
        Helper method to query database and return headers and rows for report types.
        """
        headers = []
        rows = []
        
        if report_type == "employees":
            query = db.query(Employee)
            if filters.get("status"):
                query = query.filter(Employee.status == filters["status"])
            data = query.order_by(Employee.id.asc()).all()
            headers = ["ID", "Name", "Role", "Joining Date", "Status", "Created At"]
            rows = [[e.id, e.employee_name, e.role, str(e.joining_date), e.status, e.created_at.strftime("%Y-%m-%d %H:%M")] for e in data]
            
        elif report_type == "upad":
            query = db.query(Upad).join(Employee)
            if filters.get("employee_id"):
                query = query.filter(Upad.employee_id == filters["employee_id"])
            if filters.get("date_from"):
                query = query.filter(Upad.date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Upad.date <= filters["date_to"])
            if filters.get("payment_method"):
                query = query.filter(Upad.payment_method == filters["payment_method"])
            if filters.get("handled_by"):
                query = query.filter(Upad.handled_by == filters["handled_by"])
            data = query.order_by(Upad.date.asc(), Upad.id.asc()).all()
            headers = ["ID", "Employee Name", "Date", "Amount (Rs.)", "Payment Method", "Handled By", "Notes"]
            rows = [[u.id, u.employee.employee_name, str(u.date), float(u.amount), u.payment_method, u.handled_by, u.notes or ""] for u in data]
            
        elif report_type == "salary":
            query = db.query(Salary).join(Employee)
            if filters.get("employee_id"):
                query = query.filter(Salary.employee_id == filters["employee_id"])
            if filters.get("date_from"):
                query = query.filter(Salary.payment_date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Salary.payment_date <= filters["date_to"])
            if filters.get("payment_method"):
                query = query.filter(Salary.payment_method == filters["payment_method"])
            if filters.get("handled_by"):
                query = query.filter(Salary.handled_by == filters["handled_by"])
            data = query.order_by(Salary.payment_date.asc(), Salary.id.asc()).all()
            headers = ["ID", "Employee Name", "Salary Period", "Salary (Rs.)", "Paid (Rs.)", "Pending (Rs.)", "Method", "Handled By", "Payment Date"]
            rows = [[s.id, s.employee.employee_name, f"{s.salary_month}/{s.salary_year}", float(s.salary_amount), float(s.paid_amount), float(s.remaining_amount), s.payment_method, s.handled_by, str(s.payment_date)] for s in data]
            
        elif report_type == "expense":
            query = db.query(Expense)
            if filters.get("expense_category"):
                query = query.filter(Expense.expense_category == filters["expense_category"])
            if filters.get("date_from"):
                query = query.filter(Expense.expense_date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Expense.expense_date <= filters["date_to"])
            if filters.get("payment_method"):
                query = query.filter(Expense.payment_method == filters["payment_method"])
            if filters.get("handled_by"):
                query = query.filter(Expense.handled_by == filters["handled_by"])
            data = query.order_by(Expense.expense_date.asc(), Expense.id.asc()).all()
            headers = ["ID", "Date", "Category", "Party Name", "Amount (Rs.)", "Payment Method", "Handled By", "Ref No", "Notes"]
            rows = [[exp.id, str(exp.expense_date), exp.expense_category, exp.party_name, float(exp.amount), exp.payment_method, exp.handled_by, exp.reference_number or "", exp.notes or ""] for exp in data]

        elif report_type == "income":
            query = db.query(Income)
            if filters.get("income_source"):
                query = query.filter(Income.income_source == filters["income_source"])
            if filters.get("date_from"):
                query = query.filter(Income.income_date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Income.income_date <= filters["date_to"])
            if filters.get("payment_method"):
                query = query.filter(Income.payment_method == filters["payment_method"])
            if filters.get("handled_by"):
                query = query.filter(Income.handled_by == filters["handled_by"])
            data = query.order_by(Income.income_date.asc(), Income.id.asc()).all()
            headers = ["ID", "Date", "Source", "Source Name", "Amount (Rs.)", "Payment Method", "Handled By", "Ref No", "Notes"]
            rows = [[inc.id, str(inc.income_date), inc.income_source, inc.source_name, float(inc.amount), inc.payment_method, inc.handled_by, inc.reference_number or "", inc.notes or ""] for inc in data]

        elif report_type == "cashbook":
            # Calculate opening balance
            opening_balance = Decimal("0.00")
            date_from = filters.get("date_from")
            
            if date_from:
                inflow_before = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(CashBook.transaction_date < date_from).scalar()
                outflow_before = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(CashBook.transaction_date < date_from).scalar()
                opening_balance = Decimal(inflow_before) - Decimal(outflow_before)
                
            query = db.query(CashBook)
            if date_from:
                query = query.filter(CashBook.transaction_date >= date_from)
            if filters.get("date_to"):
                query = query.filter(CashBook.transaction_date <= filters["date_to"])
            if filters.get("transaction_type"):
                query = query.filter(CashBook.transaction_type == filters["transaction_type"])
            if filters.get("payment_method"):
                query = query.filter(CashBook.payment_method == filters["payment_method"])
            if filters.get("handled_by"):
                query = query.filter(CashBook.handled_by == filters["handled_by"])
                
            data = query.order_by(CashBook.transaction_date.asc(), CashBook.id.asc()).all()
            headers = ["Date", "Voucher No.", "Reference", "Particular Name", "Category", "Method", "Debit (Out) (Rs.)", "Credit (In) (Rs.)", "Running Balance (Rs.)", "Handled By", "Notes"]
            
            curr_balance = opening_balance
            if date_from:
                rows.append([str(date_from), "OB-000", "Opening", "Opening Balance", "Initial", "N/A", 0.0, 0.0, float(curr_balance), "System", "Opening balance of report period"])
                
            for c in data:
                curr_balance = curr_balance + c.income_amount - c.out_amount
                voucher_no = f"CB-{c.id:04d}"
                ref = f"{c.reference_module or 'Manual'}/#{c.reference_id or c.id}"
                rows.append([
                    str(c.transaction_date),
                    voucher_no,
                    ref,
                    c.name,
                    c.transaction_type,
                    c.payment_method,
                    float(c.out_amount),
                    float(c.income_amount),
                    float(curr_balance),
                    c.handled_by,
                    c.notes or ""
                ])
                
        elif report_type == "partners":
            handled_by = filters.get("handled_by")
            date_from = filters.get("date_from")
            
            opening_balance = Decimal("0.00")
            if date_from and handled_by:
                inflow_before = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
                    CashBook.handled_by == handled_by,
                    CashBook.transaction_date < date_from
                ).scalar()
                outflow_before = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
                    CashBook.handled_by == handled_by,
                    CashBook.transaction_date < date_from
                ).scalar()
                opening_balance = Decimal(inflow_before) - Decimal(outflow_before)
                
            query = db.query(CashBook).filter(CashBook.handled_by.in_(["Rajubhai", "Dhruveshbhai"]))
            if handled_by:
                query = query.filter(CashBook.handled_by == handled_by)
            if date_from:
                query = query.filter(CashBook.transaction_date >= date_from)
            if filters.get("date_to"):
                query = query.filter(CashBook.transaction_date <= filters["date_to"])
                
            data = query.order_by(CashBook.transaction_date.asc(), CashBook.id.asc()).all()
            headers = ["Date", "Voucher No.", "Particulars", "Method", "Income Handled (Rs.)", "Expense Handled (Rs.)", "Running Balance (Rs.)", "Partner Name", "Notes"]
            
            curr_balance = opening_balance
            if date_from and handled_by:
                rows.append([str(date_from), "POB-000", "Opening Balance", "N/A", 0.0, 0.0, float(curr_balance), handled_by, "Opening balance of report period"])
                
            for c in data:
                curr_balance = curr_balance + c.income_amount - c.out_amount
                voucher_no = f"PL-{c.id:04d}"
                rows.append([
                    str(c.transaction_date),
                    voucher_no,
                    c.name,
                    c.payment_method,
                    float(c.income_amount),
                    float(c.out_amount),
                    float(curr_balance),
                    c.handled_by,
                    c.notes or ""
                ])
                
        elif report_type == "seths":
            query = db.query(Seth)
            if filters.get("seth_id"):
                query = query.filter(Seth.id == filters["seth_id"])
            if filters.get("status"):
                query = query.filter(Seth.status == filters["status"])
            data = query.order_by(Seth.id.asc()).all()
            headers = ["ID", "Client Name", "Mobile Number", "Address", "Status", "Notes"]
            rows = [[s.id, s.seth_name, s.mobile_number or "", s.address or "", s.status, s.notes or ""] for s in data]

        elif report_type == "rolls":
            query = db.query(Roll).join(Seth)
            if filters.get("seth_id"):
                query = query.filter(Roll.seth_id == filters["seth_id"])
            if filters.get("status"):
                query = query.filter(Roll.status == filters["status"])
            if filters.get("date_from"):
                query = query.filter(Roll.entry_date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Roll.entry_date <= filters["date_to"])
            if filters.get("roll_number"):
                query = query.filter(Roll.roll_number == filters["roll_number"])
                
            data = query.order_by(Roll.entry_date.asc(), Roll.id.asc()).all()
            headers = ["ID", "Seth Name", "Entry Date", "Roll Number", "Short Number", "Fabric Type", "Received (m)", "Used (m)", "Remaining (m)", "Status", "Notes"]
            rows = [[r.id, r.seth.seth_name, str(r.entry_date), r.roll_number, r.short_number, r.fabric_type, float(r.received_meter), float(r.used_meter), float(r.remaining_meter), r.status, r.notes or ""] for r in data]

        elif report_type == "fabric":
            query = db.query(Roll).join(Seth).filter(Roll.remaining_meter > 0)
            if filters.get("seth_id"):
                query = query.filter(Roll.seth_id == filters["seth_id"])
            if filters.get("date_from"):
                query = query.filter(Roll.entry_date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Roll.entry_date <= filters["date_to"])
                
            data = query.order_by(Roll.entry_date.asc(), Roll.id.asc()).all()
            headers = ["ID", "Roll Number", "Short Number", "Fabric Type", "Seth Name", "Received (m)", "Remaining Stock (m)", "Status"]
            rows = [[r.id, r.roll_number, r.short_number, r.fabric_type, r.seth.seth_name, float(r.received_meter), float(r.remaining_meter), r.status] for r in data]

        elif report_type == "cutting":
            query = db.query(Cutting).join(Roll).join(Seth)
            if filters.get("date_from"):
                query = query.filter(Cutting.cutting_date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Cutting.cutting_date <= filters["date_to"])
            if filters.get("lot_number"):
                query = query.filter(Cutting.lot_number == filters["lot_number"])
            if filters.get("roll_number"):
                query = query.filter(Roll.roll_number == filters["roll_number"])
                
            data = query.order_by(Cutting.cutting_date.asc(), Cutting.id.asc()).all()
            headers = ["ID", "Cutting Date", "Lot Number", "Roll Number", "Seth Name", "Meter Used (m)", "Piece Count", "Size", "Pana", "Average", "Sort Number"]
            rows = [[c.id, str(c.cutting_date), c.lot_number, c.roll.roll_number, c.roll.seth.seth_name, float(c.meter_used), c.piece_count, c.size, c.pana, float(c.average), c.sort_number] for c in data]

        elif report_type == "factory-summary":
            emps_count = db.query(func.count(Employee.id)).scalar()
            total_salary = db.query(func.coalesce(func.sum(Salary.salary_amount), 0)).scalar()
            total_upad = db.query(func.coalesce(func.sum(Upad.amount), 0)).scalar()
            total_fabric = db.query(func.coalesce(func.sum(Roll.received_meter), 0)).scalar()
            total_cuttings = db.query(func.coalesce(func.sum(Cutting.piece_count), 0)).scalar()
            
            inflow = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).scalar()
            outflow = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).scalar()
            cash_reserves = Decimal(inflow) - Decimal(outflow)
            
            headers = ["ERP Indicator Name", "Value / Metric Details"]
            rows = [
                ["Total Registered Employees", f"{emps_count} Workers"],
                ["Total Wages Billed", f"Rs. {float(total_salary):,.2f}"],
                ["Outstanding Advances (Upad)", f"Rs. {float(total_upad):,.2f}"],
                ["Total Denim Fabric Received", f"{float(total_fabric):,.2f} Meters"],
                ["Total Pieces Produced (Cutting)", f"{total_cuttings:,} Pieces"],
                ["Current Net Cash Balance", f"Rs. {float(cash_reserves):,.2f}"]
            ]

        return headers, rows

    @staticmethod
    def generate_excel_bytes(db: Session, report_type: str, filters: Dict[str, Any]) -> BytesIO:
        """
        Generates standard binary payload representing spreadsheet file stream.
        """
        headers, rows = ReportService._query_report_data(db, report_type, filters)
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"{report_type.capitalize()} Report"
        
        # Ensure gridlines are visible
        ws.views.sheetView[0].showGridLines = True
        
        # Define styles
        font_family = "Segoe UI"
        title_font = XFont(name=font_family, size=16, bold=True, color="FFFFFF")
        subtitle_font = XFont(name=font_family, size=11, bold=True, color="E0E0E0")
        meta_font = XFont(name=font_family, size=9, italic=True, color="CCCCCC")
        header_font = XFont(name=font_family, size=11, bold=True, color="FFFFFF")
        data_font = XFont(name=font_family, size=10)
        total_font = XFont(name=font_family, size=10, bold=True)
        
        title_fill = XFill(start_color="1F385C", end_color="1F385C", fill_type="solid")
        header_fill = XFill(start_color="2F4F4F", end_color="2F4F4F", fill_type="solid")
        zebra_fill = XFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")
        total_fill = XFill(start_color="ECEFF1", end_color="ECEFF1", fill_type="solid")
        
        thin_border_side = openpyxl.styles.Side(border_style="thin", color="D0D0D0")
        thick_border_side = openpyxl.styles.Side(border_style="medium", color="606060")
        double_border_side = openpyxl.styles.Side(border_style="double", color="606060")
        
        border_all = openpyxl.styles.Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
        border_total = openpyxl.styles.Border(left=thin_border_side, right=thin_border_side, top=thick_border_side, bottom=double_border_side)
        
        # 1. Title Banner
        col_count = max(len(headers), 6)
        col_letter_max = openpyxl.utils.get_column_letter(col_count)
        
        ws.merge_cells(f"A1:{col_letter_max}1")
        ws["A1"] = "RD JEANS FACTORY"
        ws["A1"].font = title_font
        ws["A1"].alignment = XAlignment(horizontal="center", vertical="center")
        ws["A1"].fill = title_fill
        ws.row_dimensions[1].height = 30
        
        ws.merge_cells(f"A2:{col_letter_max}2")
        ws["A2"] = f"{report_type.replace('-', ' ').upper()} REPORT"
        ws["A2"].font = subtitle_font
        ws["A2"].alignment = XAlignment(horizontal="center", vertical="center")
        ws["A2"].fill = title_fill
        ws.row_dimensions[2].height = 20
        
        # Period string
        period_str = "Period: Full History"
        if filters.get("date_from") or filters.get("date_to"):
            df = filters.get("date_from") or "Start"
            dt = filters.get("date_to") or "Today"
            period_str = f"Period: {df} to {dt}"
            
        ws.merge_cells(f"A3:{col_letter_max}3")
        ws["A3"] = f"{period_str} | Generated: {date.today().strftime('%Y-%m-%d')}"
        ws["A3"].font = meta_font
        ws["A3"].alignment = XAlignment(horizontal="center", vertical="center")
        ws["A3"].fill = title_fill
        ws.row_dimensions[3].height = 18
        
        # Row 4 is blank
        ws.row_dimensions[4].height = 15
        
        # 2. Table Headers (Row 5)
        ws.row_dimensions[5].height = 25
        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=5, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = XAlignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = border_all
            
        # Freeze Panes below headers (at A6)
        ws.freeze_panes = "A6"
        
        # 3. Add Rows (Row 6 onwards)
        start_row = 6
        last_row = start_row + len(rows) - 1
        
        # Determine numeric columns for SUM / format
        num_cols = []
        sum_cols = []
        bal_col = None # Column index of running balance
        
        if report_type == "upad":
            num_cols = [4]
            sum_cols = [4]
        elif report_type == "salary":
            num_cols = [4, 5, 6]
            sum_cols = [4, 5, 6]
        elif report_type == "expense":
            num_cols = [5]
            sum_cols = [5]
        elif report_type == "income":
            num_cols = [5]
            sum_cols = [5]
        elif report_type == "cashbook":
            num_cols = [7, 8, 9]
            sum_cols = [7, 8]
            bal_col = 9
        elif report_type == "partners":
            num_cols = [5, 6, 7]
            sum_cols = [5, 6]
            bal_col = 7
        elif report_type == "rolls":
            num_cols = [7, 8, 9]
            sum_cols = [7, 8, 9]
        elif report_type == "fabric":
            num_cols = [6, 7]
            sum_cols = [6, 7]
        elif report_type == "cutting":
            num_cols = [6, 7, 10]
            sum_cols = [6, 7]
            
        for row_idx, row_data in enumerate(rows, start_row):
            ws.row_dimensions[row_idx].height = 20
            is_zebra = (row_idx % 2 == 0)
            
            for col_idx, val in enumerate(row_data, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.font = data_font
                cell.border = border_all
                if is_zebra:
                    cell.fill = zebra_fill
                    
                # Format alignment and values
                if col_idx in num_cols:
                    cell.number_format = '#,##0.00'
                    cell.alignment = XAlignment(horizontal="right", vertical="center")
                elif "ID" in headers[col_idx-1] or col_idx == 1:
                    cell.alignment = XAlignment(horizontal="center", vertical="center")
                else:
                    cell.alignment = XAlignment(horizontal="left", vertical="center")
                    
        # 4. Totals / Summary Row
        totals_row = last_row + 1
        ws.row_dimensions[totals_row].height = 24
        
        # Write "Total" in column 1
        total_label_cell = ws.cell(row=totals_row, column=1, value="GRAND TOTALS / SUMMARY")
        total_label_cell.font = total_font
        total_label_cell.fill = total_fill
        total_label_cell.border = border_total
        total_label_cell.alignment = XAlignment(horizontal="left", vertical="center")
        
        # Make the rest of columns formatted for Totals row
        for col_idx in range(2, len(headers) + 1):
            cell = ws.cell(row=totals_row, column=col_idx)
            cell.font = total_font
            cell.fill = total_fill
            cell.border = border_total
            
            col_letter = openpyxl.utils.get_column_letter(col_idx)
            if col_idx in sum_cols:
                # Add Excel SUM formula
                cell.value = f"=SUM({col_letter}{start_row}:{col_letter}{last_row})"
                cell.number_format = '#,##0.00'
                cell.alignment = XAlignment(horizontal="right", vertical="center")
            elif col_idx == bal_col:
                # Point to the last balance cell in the column (Closing Balance)
                cell.value = f"={col_letter}{last_row}"
                cell.number_format = '#,##0.00'
                cell.alignment = XAlignment(horizontal="right", vertical="center")
                
        # Auto Filter
        ws.auto_filter.ref = f"A5:{openpyxl.utils.get_column_letter(len(headers))}5"
        
        # 5. Auto-adjust column widths
        for col in ws.columns:
            max_len = 0
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            # Avoid measuring headers or title cells
            for cell in col[4:]:
                # If formula, estimate width
                val = str(cell.value or '')
                if val.startswith("="):
                    val = "123,456.00"
                if len(val) > max_len:
                    max_len = len(val)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
            
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    @staticmethod
    def generate_pdf_bytes(db: Session, report_type: str, filters: Dict[str, Any]) -> BytesIO:
        """
        Generates standard binary payload representing document file stream.
        """
        headers, rows = ReportService._query_report_data(db, report_type, filters)
        
        output = BytesIO()
        
        # Decide orientation based on columns count
        col_count = len(headers)
        if col_count >= 8:
            pagesize = (792, 612) # Landscape
            doc_width, doc_height = 792, 612
        else:
            pagesize = letter # Portrait
            doc_width, doc_height = 612, 792
            
        doc = SimpleDocTemplate(
            output,
            pagesize=pagesize,
            rightMargin=36,
            leftMargin=36,
            topMargin=54,
            bottomMargin=54
        )
        
        # Custom Canvas to draw running header & dynamic Page X of Y footer
        class NumberedCanvas(canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super(NumberedCanvas, self).__init__(*args, **kwargs)
                self._saved_page_states = []
            def showPage(self):
                self._saved_page_states.append(dict(self.__dict__))
                self._startPage()
            def save(self):
                num_pages = len(self._saved_page_states)
                for state in self._saved_page_states:
                    self.__dict__.update(state)
                    self.draw_page_decorations(num_pages)
                    super(NumberedCanvas, self).showPage()
                super(NumberedCanvas, self).save()
            def draw_page_decorations(self, page_count):
                self.saveState()
                # Draw Header
                self.setFont("Helvetica-Bold", 8)
                self.setFillColor(colors.HexColor("#1F385C"))
                self.drawString(36, doc_height - 30, "RD JEANS FACTORY")
                self.setFont("Helvetica", 8)
                self.setFillColor(colors.HexColor("#555555"))
                self.drawRightString(doc_width - 36, doc_height - 30, "ERP FACTORY MANAGEMENT SYSTEM")
                self.setStrokeColor(colors.HexColor("#D0D0D0"))
                self.setLineWidth(0.5)
                self.line(36, doc_height - 34, doc_width - 36, doc_height - 34)
                
                # Draw Footer
                self.line(36, 42, doc_width - 36, 42)
                self.drawString(36, 28, "Confidential - For Business Accounting Ledger Review Only")
                self.drawRightString(doc_width - 36, 28, f"Page {self._pageNumber} of {page_count}")
                self.restoreState()
                
        styles = getSampleStyleSheet()
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            textColor=colors.HexColor("#1F385C"),
            spaceAfter=6,
            alignment=0 # Left
        )
        meta_style = ParagraphStyle(
            name="MetaStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            textColor=colors.HexColor("#555555"),
            spaceAfter=15,
            alignment=0 # Left
        )
        cell_header_style = ParagraphStyle(
            name="HeaderCell",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=colors.white,
            alignment=1 # Center
        )
        cell_data_style = ParagraphStyle(
            name="DataCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            textColor=colors.HexColor("#222222")
        )
        cell_data_bold = ParagraphStyle(
            name="DataCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            textColor=colors.HexColor("#111111")
        )
        
        story = []
        
        # Add Title & Subtitle block
        story.append(Paragraph(f"RD JEANS - {report_type.replace('-', ' ').upper()} REPORT", title_style))
        
        period_str = "Period: Full History"
        if filters.get("date_from") or filters.get("date_to"):
            df = filters.get("date_from") or "Start"
            dt = filters.get("date_to") or "Today"
            period_str = f"Period: {df} to {dt}"
            
        story.append(Paragraph(f"{period_str} | Generated: {date.today().strftime('%Y-%m-%d')}", meta_style))
        story.append(Spacer(1, 10))
        
        # Define sum/bal columns for table grand total row
        sum_cols = []
        bal_col = None
        if report_type == "upad":
            sum_cols = [3] # Amount (zero-indexed)
        elif report_type == "salary":
            sum_cols = [3, 4, 5] # Salary, Paid, Pending
        elif report_type == "expense":
            sum_cols = [4]
        elif report_type == "income":
            sum_cols = [4]
        elif report_type == "cashbook":
            sum_cols = [6, 7] # Debit, Credit
            bal_col = 8 # Running Balance
        elif report_type == "partners":
            sum_cols = [4, 5]
            bal_col = 6
        elif report_type == "rolls":
            sum_cols = [6, 7, 8]
        elif report_type == "fabric":
            sum_cols = [5, 6]
        elif report_type == "cutting":
            sum_cols = [5, 6]
            
        # Prepare table content
        table_data = []
        table_data.append([Paragraph(h, cell_header_style) for h in headers])
        
        totals = [0.0] * len(headers)
        for row in rows:
            formatted_row = []
            for col_idx, cell_val in enumerate(row):
                if isinstance(cell_val, (int, float)):
                    formatted_val = f"{cell_val:,.2f}"
                    if col_idx in sum_cols:
                        totals[col_idx] += cell_val
                else:
                    formatted_val = str(cell_val)
                formatted_row.append(Paragraph(formatted_val, cell_data_style))
            table_data.append(formatted_row)
            
        # Add Grand Totals Row
        if len(rows) > 0 and len(sum_cols) > 0:
            totals_row = []
            totals_row.append(Paragraph("<b>GRAND TOTALS</b>", cell_data_bold))
            for col_idx in range(1, len(headers)):
                if col_idx in sum_cols:
                    val_str = f"<b>{totals[col_idx]:,.2f}</b>"
                elif col_idx == bal_col:
                    last_val = rows[-1][col_idx]
                    val_str = f"<b>{last_val:,.2f}</b>"
                else:
                    val_str = ""
                totals_row.append(Paragraph(val_str, cell_data_bold))
            table_data.append(totals_row)
            
        # Proportional Columns Width
        usable_width = doc_width - 72 # total width minus margins (36 left, 36 right)
        col_width = usable_width / col_count
        
        t = Table(table_data, colWidths=[col_width] * col_count, repeatRows=1)
        
        t_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2F4F4F")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#999999")),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
            ('TOPPADDING', (0, 0), (-1, 0), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
            ('TOPPADDING', (0, 1), (-1, -1), 3),
        ])
        
        # Alternating row backgrounds
        limit_row = len(table_data) - 1 if len(sum_cols) > 0 else len(table_data)
        for idx in range(1, limit_row):
            if idx % 2 == 0:
                t_style.add('BACKGROUND', (0, idx), (-1, idx), colors.HexColor("#F9F9F9"))
                
        # Grand Totals Row Styling
        if len(rows) > 0 and len(sum_cols) > 0:
            t_style.add('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#ECEFF1"))
            t_style.add('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor("#606060"))
            t_style.add('LINEBELOW', (0, -1), (-1, -1), 1.5, colors.HexColor("#606060"))
            
        t.setStyle(t_style)
        story.append(t)
        
        # 5. Add Signature Block
        story.append(Spacer(1, 30))
        sig_data = [
            [Paragraph("<b>Prepared By:</b>", cell_data_bold), Paragraph("<b>Approved By:</b>", cell_data_bold)],
            ["", ""],
            [Paragraph("_______________________<br/>Accounts Executive", cell_data_style), Paragraph("_______________________<br/>Factory Owner / Partner", cell_data_style)]
        ]
        sig_table = Table(sig_data, colWidths=[usable_width/2]*2)
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ]))
        story.append(sig_table)
        
        doc.build(story, canvasmaker=NumberedCanvas)
        output.seek(0)
        return output
