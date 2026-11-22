
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse

import csv
import io

from backend.app.db.dependencies import (
    get_db,
    get_current_club_organizer
)

from backend.app.models.user import User

from backend.app.schemas.registration import (
    RegistrationListResponse
)

from backend.app.services.registration_service import (
    get_event_participants, get_event_participants_for_export
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




@router.get(
    "/clubs/{club_id}/events/{event_id}/participants/export"
)
def export_event_participants(
    club_id: int,
    event_id: int,
    current_user: User = Depends(get_current_club_organizer),
    db: Session = Depends(get_db)
):
    # 1. Get the event and its active participants
    event, participants = get_event_participants_for_export(
        club_id=club_id,
        event_id=event_id,
        db=db
    )

    # 2. Create an in-memory CSV file
    output = io.StringIO()

    writer = csv.writer(output)

    # 3. Write CSV column headings
    writer.writerow([
        "Registration ID",
        "Student ID",
        "Student Name",
        "Email",
        "Registration Status",
        "Registered At"
    ])

    # 4. Write participant details
    for participant in participants:
        writer.writerow([
            participant.registration_id,
            participant.student_id,
            participant.full_name,
            participant.email,
            participant.status,
            participant.registered_at.isoformat()
            if participant.registered_at else ""
        ])

    # 5. Prepare the file for download
    output.seek(0)

    filename = f"event_{event.id}_participants.csv"

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers=headers
    )
