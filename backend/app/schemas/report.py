from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional, Dict, Any
from decimal import Decimal
from app.schemas.employee import ResponseEnvelope, EmployeeInDB
from app.schemas.upad import UpadInDB
from app.schemas.salary import SalaryInDB
from app.schemas.seth import SethInDB, SethPaymentInDB
from app.schemas.roll import RollInDB
from app.schemas.cutting import CuttingInDB
from app.schemas.income import IncomeInDB
from app.schemas.expense import ExpenseInDB
from app.schemas.cashbook import CashBookInDB

# ================= Employees Report =================
class EmployeeReportData(BaseModel):
    total_employees: int
    active_employees: int
    inactive_employees: int
    employees_list: List[EmployeeInDB]

class EmployeeReportResponse(ResponseEnvelope[EmployeeReportData]):
    pass

# ================= Upad Report =================
class EmployeeWiseUpad(BaseModel):
    employee_id: int
    employee_name: str
    total_amount: Decimal
    transaction_count: int

class DateWiseUpad(BaseModel):
    date: date
    total_amount: Decimal
    transaction_count: int

class MonthlyUpadSummary(BaseModel):
    year: int
    month: int
    total_amount: Decimal

class UpadReportData(BaseModel):
    employee_wise_upad: List[EmployeeWiseUpad]
    date_wise_upad: List[DateWiseUpad]
    monthly_upad_summary: List[MonthlyUpadSummary]
    current_month_upad: Decimal

class UpadReportResponse(ResponseEnvelope[UpadReportData]):
    pass

# ================= Salary Report =================
class EmployeeWiseSalary(BaseModel):
    employee_id: int
    employee_name: str
    total_salary_finalized: Decimal
    total_salary_paid: Decimal
    total_salary_pending: Decimal

class SalaryReportData(BaseModel):
    employee_wise_salary: List[EmployeeWiseSalary]
    salary_payment_history: List[SalaryInDB]
    pending_salary: Decimal
    monthly_salary_summary: List[MonthlyUpadSummary]  # Reusing structure

class SalaryReportResponse(ResponseEnvelope[SalaryReportData]):
    pass

# ================= Seth Report =================
class SethWiseIncome(BaseModel):
    seth_id: int
    seth_name: str
    total_amount_received: Decimal
    payment_count: int

class SethReportData(BaseModel):
    seth_payment_history: List[SethPaymentInDB]
    seth_wise_income: List[SethWiseIncome]
    monthly_seth_payments: List[MonthlyUpadSummary]  # Reusing structure

class SethReportResponse(ResponseEnvelope[SethReportData]):
    pass

# ================= Roll Inventory Report =================
class SethWiseRollsSummary(BaseModel):
    seth_id: int
    seth_name: str
    total_rolls: int
    total_received_meters: Decimal
    total_used_meters: Decimal
    total_remaining_meters: Decimal

class RollReportData(BaseModel):
    available_rolls: List[RollInDB]
    consumed_rolls: List[RollInDB]
    roll_balance: Dict[str, Any]  # Total counts & meter summaries
    seth_wise_rolls: List[SethWiseRollsSummary]
    roll_history: List[RollInDB]

class RollReportResponse(ResponseEnvelope[RollReportData]):
    pass

# ================= Cutting Report =================
class DailyCuttingSummary(BaseModel):
    date: date
    total_lots: int
    total_pieces_generated: int
    total_meters_used: Decimal

class LotWiseProduction(BaseModel):
    lot_number: str
    cutting_date: date
    fabric_type: str
    piece_count: int
    size: str
    sort_number: Optional[str]

class RollConsumptionSummary(BaseModel):
    roll_number: str
    fabric_type: str
    total_lots_cut: int
    total_meters_consumed: Decimal

class CuttingReportData(BaseModel):
    daily_cutting: List[DailyCuttingSummary]
    monthly_cutting: List[MonthlyUpadSummary]  # Reusing monthly summary year/month/total pieces
    lot_wise_production: List[LotWiseProduction]
    roll_consumption: List[RollConsumptionSummary]
    total_pieces_generated: int

class CuttingReportResponse(ResponseEnvelope[CuttingReportData]):
    pass

# ================= Income Report =================
class DailyIncomeSummary(BaseModel):
    date: date
    total_amount: Decimal

class IncomeSourceSummary(BaseModel):
    category: str
    total_amount: Decimal
    percentage: Decimal

class PartnerWiseIncome(BaseModel):
    partner_name: str
    total_income_handled: Decimal

class IncomeReportData(BaseModel):
    daily_income: List[DailyIncomeSummary]
    monthly_income: List[MonthlyUpadSummary]
    income_source_summary: List[IncomeSourceSummary]
    partner_wise_income: List[PartnerWiseIncome]

class IncomeReportResponse(ResponseEnvelope[IncomeReportData]):
    pass

# ================= Expense Report =================
class ExpenseCategorySummary(BaseModel):
    category: str
    total_amount: Decimal
    percentage: Decimal

class PartnerWiseExpense(BaseModel):
    partner_name: str
    total_expense_handled: Decimal

class ExpenseReportData(BaseModel):
    daily_expense: List[DailyIncomeSummary]
    monthly_expense: List[MonthlyUpadSummary]
    expense_category_summary: List[ExpenseCategorySummary]
    partner_wise_expense: List[PartnerWiseExpense]

class ExpenseReportResponse(ResponseEnvelope[ExpenseReportData]):
    pass

# ================= Cash Book Report =================
class CashFlowReportEntry(BaseModel):
    date: date
    income_sum: Decimal
    out_sum: Decimal
    net_flow: Decimal

class CashBookReportData(BaseModel):
    cash_flow_report: List[CashFlowReportEntry]
    daily_cash_summary: List[DailyIncomeSummary]
    monthly_cash_summary: List[MonthlyUpadSummary]
    running_balance_history: List[CashBookInDB]

class CashBookReportResponse(ResponseEnvelope[CashBookReportData]):
    pass

# ================= Partner Report =================
class PartnerSummaryStats(BaseModel):
    partner_name: str
    total_income_handled: Decimal
    total_expense_handled: Decimal
    transaction_count: int

class PartnerReportData(BaseModel):
    all_transactions: List[CashBookInDB]
    rajubhai_transactions: List[CashBookInDB]
    dhruveshbhai_transactions: List[CashBookInDB]
    income_handled: List[PartnerWiseIncome]
    expense_handled: List[PartnerWiseExpense]
    partner_summary: List[PartnerSummaryStats]

class PartnerReportResponse(ResponseEnvelope[PartnerReportData]):
    pass
