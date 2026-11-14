from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from backend.app.schemas.club import ClubCreate
from backend.app.models.club import Club


def create_club(club_data:ClubCreate, db:Session):
    existing_club = db.scalar(
        select(Club).where(Club.name == club_data.name)
    )

    if existing_club:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Club name already exists!!'
        )

    new_club = Club(
        name=club_data.name,
        description = club_data.description,
        category = club_data.category
    )
    try:
        db.add(new_club)
        db.commit()
        db.refresh(new_club)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Club already exists"
        )

    return new_club


def get_all_clubs(db: Session):

    statement = select(Club).where(
        Club.is_active == True
    )

    clubs = db.scalars(statement).all()

    return clubs


def get_club_by_id(
    club_id: int,
    db: Session
):

    club = db.scalar(
        select(Club).where(
            Club.id == club_id,
            Club.is_active == True
        )
    )

    if club is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )

    return club
