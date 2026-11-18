from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.user import User
from backend.app.models.club import Club
from backend.app.models.user import User
from backend.app.models.club_membership import ClubMembership


def request_to_join_club(club_id:int, current_user:User, db:Session):
    #check whether the club exists and active
    club = db.scalar(select(Club).where(Club.id == club_id, Club.is_active==True))

    if club is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Club not found'
        )

    # Check whether a membership already exists
    membership = db.scalar(select(ClubMembership).where(current_user.id == ClubMembership.user_id, club_id==ClubMembership.club_id))

    if membership:
        if membership.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Join request is already pending"
            )

        if membership.status == "active":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already a member of this club"
            )

    # Allow a rejected student to request again
        if membership.status == "rejected":
            membership.status = "pending"
            db.commit()
            db.refresh(membership)

            return membership    

    # Create a new membership request
    new_membership = ClubMembership(
        user_id=current_user.id,
        club_id=club_id,
        role="member",
        status="pending"
    )

    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)

    return new_membership


def get_my_memberships(
    current_user: User,
    db: Session
):

    statement = select(ClubMembership).where(
        ClubMembership.user_id == current_user.id
    )

    return db.scalars(statement).all()


def get_pending_membership_requests(club_id:int, db:Session):
    statement = select(ClubMembership).where(
        ClubMembership.club_id == club_id,
        ClubMembership.status == 'pending'
    )

    return db.scalars(statement).all()


def approve_membership_request(club_id:int, membership_id:int, db:Session):
    membership = db.scalar(select(ClubMembership).where(ClubMembership.id == membership_id, ClubMembership.club_id==club_id))

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership request not found"
        )

    if membership.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This membership request has already been processed"
        )

    membership.status = 'active'

    db.commit()
    db.refresh(membership)

    return membership


def reject_membership_request(
    club_id: int,
    membership_id: int,
    db: Session
):
    membership = db.scalar(
        select(ClubMembership).where(
            ClubMembership.id == membership_id,
            ClubMembership.club_id == club_id
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership request not found"
        )

    if membership.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This membership request has already been processed"
        )

    membership.status = "rejected"

    db.commit()
    db.refresh(membership)

    return membership


def get_active_club_members(club_id:int, db:Session):
    statement = select(ClubMembership).where(ClubMembership.club_id == club_id, ClubMembership.status=='active')

    return db.scalars(statement).all()



def remove_club_member(club_id:int, membership_id:int, db:Session):
    membership = db.scalar(
        select(ClubMembership).where(
            ClubMembership.id == membership_id,
            ClubMembership.club_id == club_id
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Membership not found"
        )

    if membership.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Only active members can be removed"
        )

    if membership.role == "organizer":
        raise HTTPException(
            status_code=403,
            detail="Organizers cannot be removed through this endpoint"
        )

    membership.status = "rejected"

    db.commit()

    return membership


def promote_to_organizer(club_id:int, membership_id:int, db:Session):
    membership = db.scalar(select(ClubMembership).where(ClubMembership.id == membership_id, ClubMembership.club_id == club_id))

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail='Membership Not Found!!'
        )

    if membership.status != 'active':
        raise HTTPException(
            status_code=409,
            detail="Only active members can become organizers"
        )

    if membership.role == 'organizer':
        raise HTTPException(status_code=409, detail='This user is already an organizer')

    membership.role = 'organizer'

    db.commit()
    db.refresh(membership)

    return membership


def demote_organizer(club_id:int, membership_id:int, db:Session):
    membership = db.scalar(select(ClubMembership).where(ClubMembership.id == membership_id, ClubMembership.club_id == club_id))

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail='Membership Not found'
        )

    if membership.role != "organizer":
        raise HTTPException(
            status_code=409,
            detail="This user is not an organizer"
        )

    if membership.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Only active organizers can be demoted"
        )

     # Count all active organizers before demotion.
    organizers = db.scalars(
        select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.role == "organizer",
            ClubMembership.status == "active"
        )
    ).all()

    if len(organizers) <= 1:
        raise HTTPException(
            status_code=409,
            detail="A club must have at least one active organizer"
        )

    membership.role = "member"

    db.commit()
    db.refresh(membership)

    return membership
