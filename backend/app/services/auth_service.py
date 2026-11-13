from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from backend.app.models.user import User
from backend.app.core.security import (
    verify_password,
    create_access_token
)



def authenticate_user(email:str, password:str, db:Session):
    email = email.lower()
    user = db.scalar(select(User).where(email == User.email))

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = 'Incorrect email or password!!!'
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Account is inactive!!!'
        )

    access_token = create_access_token(
        data={'sub' : str(user.id)}
    )

    return {
        'access_token' : access_token,
        'token_type' : 'bearer'
    }







    