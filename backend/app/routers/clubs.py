from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.db.dependencies import (
    get_db,
    get_current_user,
    get_current_admin,
    get_current_club_organizer
)

from backend.app.models.user import User

from backend.app.schemas.club import (
    ClubCreate,
    ClubResponse,
    ClubUpdate,
    ClubPartialUpdate
)

from backend.app.services.club_service import (
    create_club,
    get_all_clubs,
    get_club_by_id,
    update_club,
    partial_update_club,
    deactivate_club
)


from backend.app.schemas.club_membership import MembershipRequest, MembershipResponse

from backend.app.services.membership_service import request_to_join_club, approve_membership_request, reject_membership_request, get_pending_membership_requests, get_active_club_members, remove_club_member




router = APIRouter(
    prefix='/clubs',
    tags=['Clubs']
)

@router.post('/', response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
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


@router.put('/{club_id}', response_model=ClubResponse)
def update_existing_club(club_id:int, club_data:ClubUpdate, current_user:User=Depends(get_current_admin), db:Session=Depends(get_db)):
    return update_club(club_id, club_data, db)


@router.patch('/{club_id}', response_model=ClubResponse)
def partially_update_existing_club(club_id:int, club_data:ClubPartialUpdate, current_user=Depends(get_current_admin), db:Session=Depends(get_db)):
    return partial_update_club(club_id, club_data, db)


# Deactivate a club
@router.delete(
    "/{club_id}"
)
def delete_existing_club(
    club_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):

    return deactivate_club(
        club_id,
        db
    )


@router.post('/{club_id}/join', response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def join_club(club_id:int, current_user:User=Depends(get_current_user), db:Session=Depends(get_db)):
    return request_to_join_club(club_id, current_user, db)


@router.get('/{club_id}/membership-requests', response_model=list[MembershipResponse])
def list_membership_requests(club_id:int, current_organizer:User=Depends(get_current_club_organizer), db:Session=Depends(get_db)):
    return get_pending_membership_requests(club_id, db)


@router.patch('/{club_id}/membership-requests/{membership_id}/approve', response_model=MembershipResponse)
def approve_request(club_id:int, membership_id:int, current_organizer:User=Depends(get_current_club_organizer), db:Session=Depends(get_db)):
    return approve_membership_request(club_id, membership_id, db)



@router.patch('/{club_id}/membership-requests/{membership_id}/reject', response_model=MembershipResponse)
def reject_request(club_id:int, membership_id:int, current_organizer:User=Depends(get_current_club_organizer), db:Session=Depends(get_db)):
    return reject_membership_request(club_id, membership_id, db)



@router.get(
    "/{club_id}/members",
    response_model=list[MembershipResponse]
)
def list_club_members(
    club_id: int,
    current_organizer: User = Depends(get_current_club_organizer),
    db: Session = Depends(get_db)
):
    return get_active_club_members(club_id, db)


@router.delete('/{club_id}/members/{membership_id}', response_model=MembershipResponse)
def remove_member(club_id:int, membership_id:int, current_organizer:User=Depends(get_current_club_organizer), db:Session=Depends(get_db)):
    return remove_club_member(club_id, membership_id, db)
