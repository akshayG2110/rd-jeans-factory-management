from sqlalchemy.orm import Session
from sqlalchemy import func
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
from typing import Dict, Any
from datetime import date
from decimal import Decimal

class DashboardService:
    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        # 1. Employees Aggregations
        total_employees = db.query(func.count(Employee.id)).scalar() or 0
        active_employees = db.query(func.count(Employee.id)).filter(Employee.status == EmployeeStatus.ACTIVE.value).scalar() or 0
        inactive_employees = db.query(func.count(Employee.id)).filter(Employee.status == EmployeeStatus.INACTIVE.value).scalar() or 0

        # 2. Upad Aggregations
        total_upad = db.query(func.coalesce(func.sum(Upad.amount), 0)).scalar() or 0
        month_upad = db.query(func.coalesce(func.sum(Upad.amount), 0)).filter(Upad.date >= start_of_month).scalar() or 0

        # 3. Salary Aggregations
        month_salary_paid = db.query(func.coalesce(func.sum(Salary.paid_amount), 0)).filter(Salary.payment_date >= start_of_month).scalar() or 0
        pending_salary = db.query(func.coalesce(func.sum(Salary.remaining_amount), 0)).scalar() or 0

        # 4. Seth Aggregations
        total_seths = db.query(func.count(Seth.id)).scalar() or 0
        active_seths = db.query(func.count(Seth.id)).filter(Seth.status == "Active").scalar() or 0
        month_seth_payments = db.query(func.coalesce(func.sum(SethPayment.amount), 0)).filter(SethPayment.payment_date >= start_of_month).scalar() or 0

        # 5. Roll Inventory Aggregations
        total_rolls = db.query(func.count(Roll.id)).scalar() or 0
        available_rolls = db.query(func.count(Roll.id)).filter(Roll.status == RollStatus.AVAILABLE.value).scalar() or 0
        partially_used_rolls = db.query(func.count(Roll.id)).filter(Roll.status == RollStatus.PARTIALLY_USED.value).scalar() or 0
        completed_rolls = db.query(func.count(Roll.id)).filter(Roll.status == RollStatus.COMPLETED.value).scalar() or 0
        total_remaining_meter = db.query(func.coalesce(func.sum(Roll.remaining_meter), 0)).scalar() or 0

        # 6. Cutting Operations Aggregations
        total_cutting_lots = db.query(func.count(Cutting.id)).scalar() or 0
        today_cutting = db.query(func.coalesce(func.sum(Cutting.piece_count), 0)).filter(Cutting.cutting_date == today).scalar() or 0
        monthly_cutting = db.query(func.coalesce(func.sum(Cutting.piece_count), 0)).filter(Cutting.cutting_date >= start_of_month).scalar() or 0
        total_pieces = db.query(func.coalesce(func.sum(Cutting.piece_count), 0)).scalar() or 0

        # 7. Income Aggregations
        today_income = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.income_date == today).scalar() or 0
        monthly_income = db.query(func.coalesce(func.sum(Income.amount), 0)).filter(Income.income_date >= start_of_month).scalar() or 0
        total_income = db.query(func.coalesce(func.sum(Income.amount), 0)).scalar() or 0

        # 8. Expense Aggregations
        today_expense = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.expense_date == today).scalar() or 0
        monthly_expense = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.expense_date >= start_of_month).scalar() or 0
        total_expense = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0

        # 9. Cash Book Aggregations
        latest_entry = db.query(CashBook).order_by(CashBook.id.desc()).first()
        current_cash_balance = latest_entry.running_balance if latest_entry else Decimal("0.00")
        
        today_cash_in = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(CashBook.transaction_date == today).scalar() or 0
        today_cash_out = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(CashBook.transaction_date == today).scalar() or 0
        
        monthly_cash_in = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(CashBook.transaction_date >= start_of_month).scalar() or 0
        monthly_cash_out = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(CashBook.transaction_date >= start_of_month).scalar() or 0

        # 10. Partners Aggregations
        rajubhai_tx = db.query(func.count(CashBook.id)).filter(CashBook.handled_by == "Rajubhai").scalar() or 0
        dhruveshbhai_tx = db.query(func.count(CashBook.id)).filter(CashBook.handled_by == "Dhruveshbhai").scalar() or 0

        rajubhai_income = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
            CashBook.handled_by == "Rajubhai"
        ).scalar() or 0
        rajubhai_expense = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
            CashBook.handled_by == "Rajubhai"
        ).scalar() or 0

        dhruveshbhai_income = db.query(func.coalesce(func.sum(CashBook.income_amount), 0)).filter(
            CashBook.handled_by == "Dhruveshbhai"
        ).scalar() or 0
        dhruveshbhai_expense = db.query(func.coalesce(func.sum(CashBook.out_amount), 0)).filter(
            CashBook.handled_by == "Dhruveshbhai"
        ).scalar() or 0

        # 11. Recent Activity (latest 10 cash book records)
        recent_activity = db.query(CashBook).order_by(CashBook.transaction_date.desc(), CashBook.id.desc()).limit(10).all()

        return {
            "employees": {
                "total_employees": total_employees,
                "active_employees": active_employees,
                "inactive_employees": inactive_employees
            },
            "upad": {
                "current_month_upad_total": Decimal(month_upad),
                "total_upad_given": Decimal(total_upad)
            },
            "salary": {
                "current_month_salary_paid": Decimal(month_salary_paid),
                "pending_salary": Decimal(pending_salary)
            },
            "seth": {
                "total_seths": total_seths,
                "active_seths": active_seths,
                "current_month_seth_payments": Decimal(month_seth_payments)
            },
            "inventory": {
                "total_rolls": total_rolls,
                "available_rolls": available_rolls,
                "partially_used_rolls": partially_used_rolls,
                "completed_rolls": completed_rolls,
                "total_remaining_meter": Decimal(total_remaining_meter)
            },
            "cutting": {
                "total_cutting_lots": total_cutting_lots,
                "today_cutting": today_cutting,
                "monthly_cutting": monthly_cutting,
                "total_pieces_generated": total_pieces
            },
            "income": {
                "today_income": Decimal(today_income),
                "monthly_income": Decimal(monthly_income),
                "total_income": Decimal(total_income)
            },
            "expense": {
                "today_expense": Decimal(today_expense),
                "monthly_expense": Decimal(monthly_expense),
                "total_expense": Decimal(total_expense)
            },
            "cashbook": {
                "current_cash_balance": Decimal(current_cash_balance),
                "today_cash_in": Decimal(today_cash_in),
                "today_cash_out": Decimal(today_cash_out),
                "monthly_cash_in": Decimal(monthly_cash_in),
                "monthly_cash_out": Decimal(monthly_cash_out)
            },
            "partners": {
                "rajubhai_transactions_count": rajubhai_tx,
                "dhruveshbhai_transactions_count": dhruveshbhai_tx,
                "rajubhai_total_income_handled": Decimal(rajubhai_income),
                "rajubhai_total_expenses_handled": Decimal(rajubhai_expense),
                "dhruveshbhai_total_income_handled": Decimal(dhruveshbhai_income),
                "dhruveshbhai_total_expenses_handled": Decimal(dhruveshbhai_expense)
            },
            "recent_activity": recent_activity
        }
