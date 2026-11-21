from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from backend.app.schemas.club import ClubCreate, ClubPartialUpdate, ClubUpdate
from backend.app.models.club import Club
from backend.app.models.club_membership import ClubMembership
from backend.app.models.user import User



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



def update_club(club_id:int, club_data:ClubUpdate, db:Session):
    club = get_club_by_id(club_id, db)

    # Check whether another club already uses this name
    existing_club = db.scalar(
        select(Club).where(
            Club.name == club_data.name,
            Club.id != club_id
        )
    )

    if existing_club:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another club already uses this name"
        )

    club.name = club_data.name
    club.description = club_data.description
    club.category = club_data.category

    try:
        db.commit()
        db.refresh(club)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Another club already uses this name'
        )

    return club


def partial_update_club(
    club_id: int,
    club_data: ClubPartialUpdate,
    db: Session
):

    club = get_club_by_id(club_id, db)

    update_data = club_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update"
        )

    # Reject explicitly supplied null values
    if any(value is None for value in update_data.values()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Club fields cannot be null"
        )

    if "name" in update_data:
        existing_club = db.scalar(
            select(Club).where(
                Club.name == update_data["name"],
                Club.id != club_id
            )
        )

        if existing_club:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another club already uses this name"
            )

    for field, value in update_data.items():
        setattr(club, field, value)

    try:
        db.commit()
        db.refresh(club)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not update club due to a database conflict"
        )

    return club

def deactivate_club(
    club_id: int,
    db: Session
):

    club = get_club_by_id(club_id, db)

    club.is_active = False

    db.commit()

    return {"message": "Club deactivated successfully"}



def get_my_clubs(current_user:User, db:Session, membership_status:str|None=None, skip:int=0, limit:int=20):
    # Step 1: Base query
    statement = select(ClubMembership).where(
        ClubMembership.user_id == current_user.id
    )

    # Step 2: Apply membership status filter
    if membership_status is not None:
        statement = statement.where(
            ClubMembership.status == membership_status
        )

    # Step 3: Count matching memberships
    count_statement = (
        select(func.count())
        .select_from(ClubMembership)
        .where(ClubMembership.user_id == current_user.id)
    )

    if membership_status is not None:
        count_statement = count_statement.where(
            ClubMembership.status == membership_status
        )

    total = db.scalar(count_statement)

    # Step 4: Load associated clubs
    statement = (
        statement
        .options(selectinload(ClubMembership.club))
        .order_by(ClubMembership.joined_at.desc())
        .offset(skip)
        .limit(limit)
    )

    memberships = db.scalars(statement).all()

    return {
        "items": memberships,
        "total": total,
        "skip": skip,
        "limit": limit
    }
