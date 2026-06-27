from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.report import (
    EmployeeReportResponse,
    UpadReportResponse,
    SalaryReportResponse,
    SethReportResponse,
    RollReportResponse,
    CuttingReportResponse,
    IncomeReportResponse,
    ExpenseReportResponse,
    CashBookReportResponse,
    PartnerReportResponse
)
from app.schemas.employee import EmployeeStatus
from app.schemas.upad import PaymentMethod, HandledBy
from app.schemas.cashbook import CashBookTransactionType
from app.services.report import ReportService
from typing import Optional
from datetime import date
from app.core.security import get_current_user

router = APIRouter(
    prefix="/reports",
    tags=["Reports Ledger & Analytics"],
    dependencies=[Depends(get_current_user)]
)

@router.get(
    "/employees",
    response_model=EmployeeReportResponse,
    summary="Get employee stats and reports list",
    response_description="Worker metrics count details and pagination lists"
)
def get_employees_report(
    status: Optional[EmployeeStatus] = Query(None, description="Filter workers by status"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=1000, description="Pagination size limit"),
    db: Session = Depends(get_db)
):
    status_val = status.value if status else None
    data = ReportService.get_employees_report(db=db, status=status_val, skip=skip, limit=limit)
    return {
        "success": True,
        "message": "Employees report generated successfully",
        "data": data
    }

@router.get(
    "/upad",
    response_model=UpadReportResponse,
    summary="Get Upad advance reports (Employee Wise, Monthly, Current)",
    response_description="Upad calculations and history logs"
)
def get_upad_report(
    employee_id: Optional[int] = Query(None, description="Filter by specific employee"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_upad_report(db=db, employee_id=employee_id, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Upad report generated successfully",
        "data": data
    }

@router.get(
    "/salary",
    response_model=SalaryReportResponse,
    summary="Get salary finalized, paid and pending report calculations",
    response_description="Outstanding employee salary balances and histories"
)
def get_salary_report(
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_salary_report(db=db, employee_id=employee_id, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Salary report generated successfully",
        "data": data
    }

@router.get(
    "/seths",
    response_model=SethReportResponse,
    summary="Get seth clients payment histories and monthly inflow reports",
    response_description="Client income details and summaries"
)
def get_seth_report(
    seth_id: Optional[int] = Query(None, description="Filter by seth client ID"),
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_seth_report(db=db, seth_id=seth_id, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Seth report generated successfully",
        "data": data
    }

@router.get(
    "/rolls",
    response_model=RollReportResponse,
    summary="Get roll inventory stats, availability and history lists",
    response_description="Roll balances, active fabric count and seth-wise summaries"
)
def get_rolls_report(
    seth_id: Optional[int] = Query(None, description="Filter by supplying seth client"),
    date_from: Optional[date] = Query(None, description="Start entry date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End entry date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_rolls_report(db=db, seth_id=seth_id, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Roll inventory report generated successfully",
        "data": data
    }

@router.get(
    "/cutting",
    response_model=CuttingReportResponse,
    summary="Get cutting operations lots, sizes, and pieces count reports",
    response_description="Production totals, daily output, and lot balances"
)
def get_cutting_report(
    date_from: Optional[date] = Query(None, description="Start cutting date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End cutting date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_cutting_report(db=db, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Cutting production report generated successfully",
        "data": data
    }

@router.get(
    "/income",
    response_model=IncomeReportResponse,
    summary="Get daily, monthly categorywise income records",
    response_description="Ledger details of total income and partner inflows"
)
def get_income_report(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_income_report(db=db, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Income report generated successfully",
        "data": data
    }

@router.get(
    "/expense",
    response_model=ExpenseReportResponse,
    summary="Get daily, monthly categorywise expense records",
    response_description="Ledger details of total expenditures and partner outflows"
)
def get_expense_report(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_expense_report(db=db, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Expense report generated successfully",
        "data": data
    }

@router.get(
    "/cashbook",
    response_model=CashBookReportResponse,
    summary="Get cash flow daily summaries and running balance logs",
    response_description="Complete passbook ledger lists"
)
def get_cashbook_report(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_cashbook_report(db=db, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Cash Book report generated successfully",
        "data": data
    }

@router.get(
    "/partners",
    response_model=PartnerReportResponse,
    summary="Get partner cash flow logs and allocations",
    response_description="Filtered partner passbooks and overall metrics"
)
def get_partners_report(
    date_from: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    data = ReportService.get_partner_report(db=db, date_from=date_from, date_to=date_to)
    return {
        "success": True,
        "message": "Partners activity report generated successfully",
        "data": data
    }

# ================= Export System Routers =================

def get_report_filename(report_type: str, filters: dict, extension: str) -> str:
    # Custom filenames based on user specifications
    # e.g., Salary_Report_2026-06.xlsx or Partner_Ledger_Rajubhai.xlsx
    name_str = report_type.capitalize()
    
    if report_type == "salary" and filters.get("date_from"):
        # e.g., Salary_Report_2026-06
        try:
            # Parse month from date
            d = filters["date_from"]
            name_str = f"Salary_Report_{d.strftime('%Y-%m')}"
        except Exception:
            pass
    elif report_type == "cashbook" and filters.get("date_from"):
        # e.g., Cashbook_January_2026
        try:
            d = filters["date_from"]
            month_name = d.strftime('%B')
            name_str = f"Cashbook_{month_name}_{d.strftime('%Y')}"
        except Exception:
            pass
    elif report_type == "partners" and filters.get("handled_by"):
        # e.g., Partner_Ledger_Rajubhai
        name_str = f"Partner_Ledger_{filters['handled_by']}"
    else:
        suffix = ""
        if filters.get("handled_by"):
            suffix += f"_{filters['handled_by']}"
        elif filters.get("employee_id"):
            suffix += f"_Emp{filters['employee_id']}"
            
        date_str = ""
        if filters.get("date_from"):
            date_str += f"_{filters['date_from']}"
        if filters.get("date_to"):
            date_str += f"_to_{filters['date_to']}"
        name_str = f"{report_type.capitalize()}_Report{suffix}{date_str}"
        
    return f"{name_str}.{extension}"

@router.get(
    "/export/excel",
    summary="Export reports in Excel (.xlsx) file format",
    response_description="Returns compiled sheet binary payload as an attachment download"
)
def export_report_excel(
    report_type: str = Query(..., description="Report category ('employees', 'upad', 'salary', 'cashbook', 'partners', 'seths', 'rolls', 'fabric', 'cutting', 'income', 'expense', 'factory-summary')"),
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    seth_id: Optional[int] = Query(None, description="Filter by seth client"),
    handled_by: Optional[str] = Query(None, description="Filter by partner/owner handling"),
    date_from: Optional[date] = Query(None, description="Start date YYYY-MM-DD"),
    date_to: Optional[date] = Query(None, description="End date YYYY-MM-DD"),
    transaction_type: Optional[str] = Query(None, description="Filter by category type"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    expense_category: Optional[str] = Query(None, description="Filter by expense category"),
    income_source: Optional[str] = Query(None, description="Filter by income source"),
    status: Optional[str] = Query(None, description="Filter by status"),
    roll_number: Optional[str] = Query(None, description="Filter by roll number"),
    lot_number: Optional[str] = Query(None, description="Filter by lot number"),
    db: Session = Depends(get_db)
):
    valid_types = ["employees", "upad", "salary", "cashbook", "partners", "seths", "rolls", "fabric", "cutting", "income", "expense", "factory-summary"]
    if report_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type. Allowed values are: {', '.join(valid_types)}"
        )

    filters = {
        "employee_id": employee_id,
        "seth_id": seth_id,
        "handled_by": handled_by,
        "date_from": date_from,
        "date_to": date_to,
        "transaction_type": transaction_type,
        "payment_method": payment_method,
        "expense_category": expense_category,
        "income_source": income_source,
        "status": status,
        "roll_number": roll_number,
        "lot_number": lot_number
    }
    
    # Check if there is data available for these filters
    headers, rows = ReportService._query_report_data(db, report_type, filters)
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No data available for the selected filters."
        )
        
    excel_stream = ReportService.generate_excel_bytes(db=db, report_type=report_type, filters=filters)
    filename = get_report_filename(report_type, filters, "xlsx")
    
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get(
    "/export/pdf",
    summary="Export reports in PDF (.pdf) file format",
    response_description="Returns compiled document binary payload as an attachment download"
)
def export_report_pdf(
    report_type: str = Query(..., description="Report category ('employees', 'upad', 'salary', 'cashbook', 'partners', 'seths', 'rolls', 'fabric', 'cutting', 'income', 'expense', 'factory-summary')"),
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    seth_id: Optional[int] = Query(None, description="Filter by seth client"),
    handled_by: Optional[str] = Query(None, description="Filter by partner/owner handling"),
    date_from: Optional[date] = Query(None, description="Start date YYYY-MM-DD"),
    date_to: Optional[date] = Query(None, description="End date YYYY-MM-DD"),
    transaction_type: Optional[str] = Query(None, description="Filter by category type"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    expense_category: Optional[str] = Query(None, description="Filter by expense category"),
    income_source: Optional[str] = Query(None, description="Filter by income source"),
    status: Optional[str] = Query(None, description="Filter by status"),
    roll_number: Optional[str] = Query(None, description="Filter by roll number"),
    lot_number: Optional[str] = Query(None, description="Filter by lot number"),
    db: Session = Depends(get_db)
):
    valid_types = ["employees", "upad", "salary", "cashbook", "partners", "seths", "rolls", "fabric", "cutting", "income", "expense", "factory-summary"]
    if report_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type. Allowed values are: {', '.join(valid_types)}"
        )

    filters = {
        "employee_id": employee_id,
        "seth_id": seth_id,
        "handled_by": handled_by,
        "date_from": date_from,
        "date_to": date_to,
        "transaction_type": transaction_type,
        "payment_method": payment_method,
        "expense_category": expense_category,
        "income_source": income_source,
        "status": status,
        "roll_number": roll_number,
        "lot_number": lot_number
    }

    # Check if there is data available for these filters
    headers, rows = ReportService._query_report_data(db, report_type, filters)
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No data available for the selected filters."
        )

    pdf_stream = ReportService.generate_pdf_bytes(db=db, report_type=report_type, filters=filters)
    filename = get_report_filename(report_type, filters, "pdf")
    
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
