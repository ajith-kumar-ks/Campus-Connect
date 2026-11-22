from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from backend.app.models.event import Event
from backend.app.models.registration import Registration
from backend.app.models.user import User


def register_for_event(event_id:int, current_user:User, db:Session):
    event = db.scalar(select(Event). where(Event.id == event_id))

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Event Not Found'
        )

    if (event.status != 'published'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Registrations are not open for this event'
        )

    now = datetime.now()

    deadline = event.registration_deadline

    
    if event.registration_deadline and now > event.registration_deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline has passed"
        )

    existing_registration = db.scalar(select(Registration). where(Registration.event_id==event_id, Registration.user_id==current_user.id))

    if existing_registration and existing_registration.status=='registered':
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='You are already registered for this event'
        )

    if event.capacity is not None:
        registered_count = db.scalar(
            select(func.count())
            .select_from(Registration)
            .where(
                Registration.event_id == event_id,
                Registration.status == "registered"
            )
        )

        if registered_count >= event.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is already full"
            )

    if existing_registration:
        existing_registration.status = "registered"
        existing_registration.cancelled_at = None
        existing_registration.registered_at = now

        db.commit()
        db.refresh(existing_registration)

        return existing_registration

    # Create a new registration
    registration = Registration(
        event_id=event_id,
        user_id=current_user.id,
        status="registered"
    )

    db.add(registration)
    db.commit()
    db.refresh(registration)

    return registration





def cancel_registration(
    event_id: int,
    current_user: User,
    db: Session
):
    registration = db.scalar(
        select(Registration).where(
            Registration.event_id == event_id,
            Registration.user_id == current_user.id
        )
    )

    if registration is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )

    if registration.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration is already cancelled"
        )

    registration.status = "cancelled"
    registration.cancelled_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(registration)

    return registration




def get_event_participants(
    club_id: int,
    event_id: int,
    db: Session,
    skip: int = 0,
    limit: int = 20
):
    # Step 1: Verify that the event belongs to this club
    event = db.scalar(
        select(Event).where(
            Event.id == event_id,
            Event.club_id == club_id
        )
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found in this club"
        )

    # Step 2: Count active registrations
    total = db.scalar(
        select(func.count())
        .select_from(Registration)
        .where(
            Registration.event_id == event_id,
            Registration.status == "registered"
        )
    )

    # Step 3: Fetch the requested page
    statement = (
        select(Registration)
        .where(
            Registration.event_id == event_id,
            Registration.status == "registered"
        )
        .order_by(Registration.registered_at.desc())
        .offset(skip)
        .limit(limit)
    )

    participants = db.scalars(statement).all()

    return {
        "items": participants,
        "total": total,
        "skip": skip,
        "limit": limit
    }




def get_my_registrations(current_user:User, db:Session, registration_status:str=None, skip:int=0, limit:int=20):

    statement = select(Registration).where(Registration.user_id==current_user.id)

    if registration_status is not None:
        statement = statement.where(Registration.status==registration_status)

    count_statement = (
        select(func.count())
        .select_from(Registration)
        .where(Registration.user_id == current_user.id)
    )

    if registration_status is not None:
        count_statement = count_statement.where(
            Registration.status == registration_status
        )

    total = db.scalar(count_statement)
        #Load associated Event objects
    statement = (
        statement
        .options(selectinload(Registration.event))
        .order_by(Registration.registered_at.desc())
        .offset(skip)
        .limit(limit)
    )

    registrations = db.scalars(statement).all()

    return {
        "items": registrations,
        "total": total,
        "skip": skip,
        "limit": limit
    }




def get_event_participants_for_export(
    club_id: int,
    event_id: int,
    db: Session
):
    # 1. Verify that the event belongs to this club
    event = db.scalar(
        select(Event).where(
            Event.id == event_id,
            Event.club_id == club_id
        )
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found in this club"
        )

    # 2. Fetch all active registrations with student details
    statement = (
        select(
            Registration.id.label("registration_id"),
            User.id.label("student_id"),
            User.full_name,
            User.email,
            Registration.status,
            Registration.registered_at
        )
        .join(
            User,
            User.id == Registration.user_id
        )
        .where(
            Registration.event_id == event_id,
            Registration.status == "registered"
        )
        .order_by(Registration.registered_at.asc())
    )

    participants = db.execute(statement).all()

    return event, participants
