
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.dependencies import (
    get_db,
    get_current_user
)

from backend.app.models.user import User

from backend.app.schemas.dashboard import (
    OrganizerDashboardResponse
)

from backend.app.services.organizer_dashboard_service import (
    get_organizer_dashboard
)


router = APIRouter(
    prefix="/organizer",
    tags=["Organizer Dashboard"]
)


@router.get(
    "/dashboard",
    response_model=OrganizerDashboardResponse
)
def organizer_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_organizer_dashboard(
        current_user=current_user,
        db=db
    )
