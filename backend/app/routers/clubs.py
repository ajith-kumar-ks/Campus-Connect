from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.db.dependencies import (
    get_db,
    get_current_user,
    get_current_admin
)

from backend.app.models.user import User

from backend.app.schemas.club import (
    ClubCreate,
    ClubResponse
)

from backend.app.services.club_service import (
    create_club,
    get_all_clubs,
    get_club_by_id
)


router = APIRouter(
    prefix='/clubs',
    tags=['Clubs']
)

@router.post('/', response_model=ClubCreate, status_code=status.HTTP_201_CREATED)
def create_new_club(club_data:ClubCreate, current_user:User=Depends(get_current_admin), db:Session=Depends(get_db)):
    return create_club(club_data, db)


# Get all active clubs (authenticated users)
@router.get(
    "/",
    response_model=list[ClubResponse]
)
def list_clubs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return get_all_clubs(db)


# Get one club by ID (authenticated users)
@router.get(
    "/{club_id}",
    response_model=ClubResponse
)
def retrieve_club(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return get_club_by_id(club_id, db)
