
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.db.dependencies import (
    get_db,
    get_current_club_organizer
)

from backend.app.models.user import User

from backend.app.schemas.registration import (
    RegistrationListResponse
)

from backend.app.services.registration_service import (
    get_event_participants
)


router = APIRouter(
    prefix="/clubs",
    tags=["Event Participants"]
)


@router.get(
    "/{club_id}/events/{event_id}/participants",
    response_model=RegistrationListResponse
)
def list_participants(
    club_id: int,
    event_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_organizer: User = Depends(
        get_current_club_organizer
    ),
    db: Session = Depends(get_db)
):
    return get_event_participants(
        club_id,
        event_id,
        db,
        skip,
        limit
    )
