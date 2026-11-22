from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func
from datetime import datetime

from backend.app.schemas.dashboard import DashboardEventSummary, RecentRegistrationActivity
from backend.app.models.user import User
from backend.app.models.club_membership import ClubMembership
from backend.app.models.registration import Registration
from backend.app.models.event import Event



def get_student_dashboard(current_user:User, db:Session):
    now = datetime.now()
    total_joined_clubs = db.scalar(
        select(func.count())
        .select_from(ClubMembership).where(ClubMembership.user_id == current_user.id), ClubMembership.status=='active'
    ) or 0

    total_active_registrations = db.scalar(select(func.count()).select_from(Registration).where(Registration.status=='registered', Registration.user_id==current_user.id)) or 0

    upcoming_statement = (
        select(Event)
        .join(
            Registration,
            Registration.event_id == Event.id
        )
        .where(
            Registration.user_id == current_user.id,
            Registration.status == "registered",
            Event.status == "published",
            Event.start_time >= now
        )
        .order_by(Event.start_time.asc())
        .limit(5)
    )

    upcoming_events = db.scalars(
        upcoming_statement
    ).all()

    activity_statement = (
        select(Registration)
        .where(
            Registration.user_id == current_user.id
        )
        .options(
            selectinload(Registration.event)
        )
        .order_by(
            func.coalesce(
                Registration.cancelled_at,
                Registration.registered_at
            ).desc()
        )
        .limit(5)
    )

    recent_activity = db.scalars(
        activity_statement
    ).all()

    return {
        "total_joined_clubs": total_joined_clubs,
        "total_active_registrations": total_active_registrations,
        "upcoming_events": upcoming_events,
        "recent_activity": recent_activity
    }