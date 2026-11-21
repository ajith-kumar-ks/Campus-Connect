
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.db.dependencies import get_db, get_current_user
from backend.app.models.user import User

from backend.app.schemas.club import MyClubListResponse

from backend.app.services.club_service import get_my_clubs


router = APIRouter(
    prefix="/users",
    tags=["My Clubs"]
)


@router.get(
    "/me/clubs",
    response_model=MyClubListResponse
)
def list_my_clubs(
    membership_status: Literal[
        "active", "pending", "rejected"
    ] | None = Query(
        default=None,
        alias="status"
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_my_clubs(
        current_user=current_user,
        db=db,
        membership_status=membership_status,
        skip=skip,
        limit=limit
    )
