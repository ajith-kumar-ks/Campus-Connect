from sqlalchemy.orm  import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status, Depends

from backend.app.schemas.user import UserCreate, UserPartialUpdate, UserUpdate, ChangePasswordRequest 
from backend.app.models.user import User
from backend.app.core.security import hash_password, verify_password




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



def update_user_profile(user_data:UserUpdate, current_user:User, db:Session):
    current_user.full_name = user_data.full_name
    db.commit()
    db.refresh(current_user)

    return current_user

def partial_update_user_profile(user_data:UserPartialUpdate, current_user:User, db:Session):
    update_data = user_data.model_dump(exclude_unset=True)

    if "full_name" in update_data:
        if update_data["full_name"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Full name cannot be null"
            )

        current_user.full_name = update_data["full_name"]
    
    db.commit()
    db.refresh(current_user)

    return current_user



def change_user_password(password_data:ChangePasswordRequest, current_user:User, db:Session):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Prevent setting the same password again
    if verify_password(
        password_data.new_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different"
        )

    # Hash new password
    current_user.password_hash = hash_password(
        password_data.new_password
    )

    db.commit()

    return {"message": "Password changed successfully"}   


def deactivate_user(current_user:User, db:Session):
    current_user.is_active = False

    db.commit()

    return {"message": "Account deactivated successfully"}