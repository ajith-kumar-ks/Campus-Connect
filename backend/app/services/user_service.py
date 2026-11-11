from sqlalchemy.orm  import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from backend.app.schemas.user import UserCreate
from backend.app.models.user import User
from backend.app.core.security import hash_password



def register_user(user_data:UserCreate, db:Session):
    email = str(user_data.email).lower()

    existing_user = db.scalar(select(User).where(User.email==email))

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='This email is already registered'
        )
    hashed_password = hash_password(user_data.password)

    new_user = User(
        full_name = user_data.full_name,
        email = user_data.email,
        password_hash = hashed_password
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Email is already registered"
        )
    return new_user
    