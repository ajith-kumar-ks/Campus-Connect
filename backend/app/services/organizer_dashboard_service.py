
from datetime import datetime

from fastapi import HTTPException, status

from sqlalchemy import select, func, and_, distinct
from sqlalchemy.orm import Session

from backend.app.models.user import User
from backend.app.models.club import Club
from backend.app.models.club_membership import ClubMembership
from backend.app.models.event import Event
from backend.app.models.registration import Registration




def get_organizer_dashboard(
    current_user: User,
    db: Session
):
    now = datetime.now()

    # Common organizer membership conditions
    organizer_conditions = (
        ClubMembership.user_id == current_user.id,
        ClubMembership.role == "organizer",
        ClubMembership.status == "active",
        Club.is_active.is_(True)
    )

    # 1. Get managed clubs with their statistics
    clubs_statement = (
        select(
            Club.id,
            Club.name,
            Club.description,
            func.count(distinct(Event.id)).label("total_events"),
            func.count(Registration.id).label(
                "total_active_participants"
            )
        )
        .join(
            ClubMembership,
            ClubMembership.club_id == Club.id
        )
        .outerjoin(
            Event,
            Event.club_id == Club.id
        )
        .outerjoin(
            Registration,
            and_(
                Registration.event_id == Event.id,
                Registration.status == "registered"
            )
        )
        .where(*organizer_conditions)
        .group_by(
            Club.id,
            Club.name,
            Club.description
        )
        .order_by(Club.name)
    )

    club_rows = db.execute(clubs_statement).all()

    # 2. Ensure the user manages at least one active club
    if not club_rows:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active organizer of any club"
        )

    clubs = [
        {
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "total_events": row.total_events,
            "total_active_participants": row.total_active_participants
        }
        for row in club_rows
    ]

    # 3. Calculate dashboard totals from club statistics
    total_managed_clubs = len(clubs)

    total_events = sum(
        club["total_events"] for club in clubs
    )

    total_active_participants = sum(
        club["total_active_participants"] for club in clubs
    )

    # 4. Count all upcoming published events
    upcoming_count_statement = (
        select(func.count(distinct(Event.id)))
        .join(Club, Club.id == Event.club_id)
        .join(
            ClubMembership,
            ClubMembership.club_id == Club.id
        )
        .where(
            *organizer_conditions,
            Event.status == "published",
            Event.start_time >= now
        )
    )

    total_upcoming_events = db.scalar(
        upcoming_count_statement
    ) or 0

    # 5. Fetch the next five upcoming events
    upcoming_statement = (
        select(
            Event.id,
            Event.title,
            Event.venue,
            Event.start_time,
            Event.end_time,
            Club.id.label("club_id"),
            Club.name.label("club_name"),
            func.count(Registration.id).label(
                "total_registrations"
            )
        )
        .join(Club, Club.id == Event.club_id)
        .join(
            ClubMembership,
            ClubMembership.club_id == Club.id
        )
        .outerjoin(
            Registration,
            and_(
                Registration.event_id == Event.id,
                Registration.status == "registered"
            )
        )
        .where(
            *organizer_conditions,
            Event.status == "published",
            Event.start_time >= now
        )
        .group_by(
            Event.id,
            Club.id,
            Club.name
        )
        .order_by(Event.start_time.asc())
        .limit(5)
    )

    upcoming_rows = db.execute(upcoming_statement).all()

    upcoming_events = [
        {
            "id": row.id,
            "title": row.title,
            "venue": row.venue,
            "start_time": row.start_time,
            "end_time": row.end_time,
            "club_id": row.club_id,
            "club_name": row.club_name,
            "total_registrations": row.total_registrations
        }
        for row in upcoming_rows
    ]

    return {
        "total_managed_clubs": total_managed_clubs,
        "total_events": total_events,
        "total_active_participants": total_active_participants,
        "total_upcoming_events": total_upcoming_events,
        "clubs": clubs,
        "upcoming_events": upcoming_events
    }
