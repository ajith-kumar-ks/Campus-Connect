from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.dependencies import get_db, get_current_user
from backend.app.models.user import User
from backend.app.schemas.dashboard import StudentDashboardResponse
from backend.app.services.dashboard_service import get_student_dashboard


router = APIRouter(
    prefix='/users',
    tags=['Student Dashboard']
)


@router.get('/me/dashboard', response_model=StudentDashboardResponse)
def student_dashboard(current_user:User=Depends(get_current_user), db:Session=Depends(get_db)):
    return get_student_dashboard(
        current_user=current_user,
        db=db
    )

