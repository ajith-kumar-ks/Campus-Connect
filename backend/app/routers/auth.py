from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.schemas.user import UserResponse, UserCreate
from backend.app.db.dependencies import get_db
from backend.app.services.user_service import register_user



router = APIRouter(
    prefix='/auth',
    tags=['Authentication']
)



@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data:UserCreate, db:Session=Depends(get_db)):
    new_user = register_user(user_data, db)

    return new_user