from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import DashboardService
from app.core.security import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard Real-time Aggregations"],
    dependencies=[Depends(get_current_user)]
)

@router.get(
    "",
    response_model=DashboardResponse,
    summary="Get real-time metrics summary for factory dashboard",
    response_description="Returns compiled financial, worker, roll inventory, cutting lot and cash balance KPIs"
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    summary = DashboardService.get_dashboard_summary(db=db)
    return {
        "success": True,
        "message": "Real-time dashboard metrics compiled successfully",
        "data": summary
    }
