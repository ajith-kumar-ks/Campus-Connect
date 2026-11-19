from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.event import Event
from backend.app.models.club import Club
from backend.app.schemas.event import EventCreate, EventUpdate



def create_event(
    club_id: int,
    creator_id: int,
    event_data: EventCreate,
    db: Session
):

    # Verify that the club exists
    club = db.get(Club, club_id)

    if not club or not club.is_active:
        raise HTTPException(
            status_code=404,
            detail="Club not found or inactive"
        )

    # Convert Pydantic data into a dictionary
    event_dict = event_data.model_dump()    #Pydantic validates the request and model_dump() converts it into a Python dictionary.

    # Create SQLAlchemy object. The ** operator unpacks the dictionary into keyword arguments.
    new_event = Event(
        **event_dict,   
        club_id=club_id,
        created_by_id=creator_id
    )

    db.add(new_event)

    db.commit()

    db.refresh(new_event)

    return new_event




def get_event(
    event_id: int,
    db: Session
):

    event = db.get(Event, event_id)

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return event


    
def update_event(
    club_id: int,
    event_id: int,
    event_data: EventUpdate,
    db: Session
):
    
    event = get_event(event_id, db)

    # Ensure the event belongs to this club
    if event.club_id != club_id:
        raise HTTPException(
            status_code=404,
            detail="Event not found in this club"
        )

    if event.status in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=409,
            detail="Cannot update a completed or cancelled event"
        )


    update_data = event_data.model_dump(
        exclude_unset=True
    )

    # Validate the complete date combination,
    # including fields not supplied in the PATCH request.
    new_start = update_data.get("start_time", event.start_time)
    new_end = update_data.get("end_time", event.end_time)
    new_deadline = update_data.get(
        "registration_deadline",
        event.registration_deadline
    )

    if new_end <= new_start:
        raise HTTPException(
            status_code=422,
            detail="End time must be after start time"
        )

    if new_deadline > new_start:
        raise HTTPException(
            status_code=422,
            detail="Registration deadline must be before event start"
        )

    # Apply only supplied fields
    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()

    db.refresh(event)

    return event




def delete_event(
    club_id: int,
    event_id: int,
    db: Session
):

   

    event = get_event(event_id, db)

    if event.club_id != club_id:
        raise HTTPException(
            status_code=404,
            detail="Event not found in this club"
        )

    if event.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Only draft events can be deleted"
        )

    db.delete(event)

    db.commit()

    return {"message": "Event deleted successfully"}





def update_event_status(
    club_id: int,
    event_id: int,
    new_status: str,
    db: Session
):
   
    event = get_event(event_id, db)

    if event.club_id != club_id:
        raise HTTPException(
            status_code=404,
            detail="Event not found in this club"
        )

    allowed_transitions = {
        "draft": ["published", "cancelled"],
        "published": ["cancelled", "completed"],
        "completed": [],
        "cancelled": []
    }

    if new_status not in allowed_transitions[event.status]:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot change event from {event.status} to {new_status}"
        )

    event.status = new_status

    db.commit()

    db.refresh(event)

    return event
