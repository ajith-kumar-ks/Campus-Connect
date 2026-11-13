from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.schemas.user import UserResponse, UserCreate
from backend.app.schemas.token import Token
from backend.app.db.dependencies import get_db
from backend.app.services.user_service import register_user
from backend.app.services.auth_service import authenticate_user 



router = APIRouter(
    prefix='/auth',
    tags=['Authentication']
)



@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data:UserCreate, db:Session=Depends(get_db)):
    new_user = register_user(user_data, db)

    return new_user


@router.post('/login', response_model=Token)
def login(form_data:OAuth2PasswordRequestForm=Depends(), db:Session=Depends(get_db)):
    return authenticate_user(form_data.username, form_data.password, db)
