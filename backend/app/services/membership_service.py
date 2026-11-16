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
