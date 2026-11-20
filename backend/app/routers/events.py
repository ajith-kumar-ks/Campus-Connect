from fastapi import APIRouter, Depends, status, Query, HTTPException
from datetime import datetime
from sqlalchemy.orm import Session

from backend.app.db.dependencies import get_current_club_organizer, get_db

from backend.app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventStatusUpdate,
    EventListResponse
)

from backend.app.services.event_service import (create_event, get_event, update_event, delete_event, update_event_status, list_events)

from backend.app.models.user import User

router = APIRouter(tags=['Events'])


@router.post('/clubs/{club_id}/events', response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_club_event(club_id:int, event_data:EventCreate, current_organizer:User = Depends(get_current_club_organizer), db:Session=Depends(get_db)):
    return create_event(club_id, current_organizer.id, event_data, db)


@router.get('/events/{event_id}', response_model=EventResponse)
def event_details(event_id:int, db:Session=Depends(get_db)):
    event = get_event(event_id, db)
    if event.status != "published":
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return event




@router.patch(
    "/clubs/{club_id}/events/{event_id}",
    response_model=EventResponse
)
def edit_event(
    club_id: int,
    event_id: int,
    event_data: EventUpdate,
    current_organizer: User = Depends(get_current_club_organizer),
    db: Session = Depends(get_db)
):

    return update_event(
        club_id,
        event_id,
        event_data,
        db
    )



@router.delete(
    "/clubs/{club_id}/events/{event_id}"
)
def remove_event(
    club_id: int,
    event_id: int,
    current_organizer: User = Depends(get_current_club_organizer),
    db: Session = Depends(get_db)
):

    return delete_event(
        club_id,
        event_id,
        db
    )




@router.patch(
    "/clubs/{club_id}/events/{event_id}/status",
    response_model=EventResponse
)
def change_event_status(
    club_id: int,
    event_id: int,
    status_data: EventStatusUpdate,
    current_organizer: User = Depends(get_current_club_organizer),
    db: Session = Depends(get_db)
):

    return update_event_status(
        club_id,
        event_id,
        status_data.status,
        db
    )



@router.get('/events', response_model=EventListResponse)
def browse_events(
    search: str | None = None,
    category: str | None = None,
    club_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,

    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),

    db: Session = Depends(get_db)
):
    if start_date and end_date and start_date > end_date:

        raise HTTPException(
            status_code=422,
            detail="Start date cannot be after end date"
        )

    return list_events(
        db=db,
        search=search,
        category=category,
        club_id=club_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )