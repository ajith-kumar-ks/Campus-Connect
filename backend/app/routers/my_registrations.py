from fastapi import APIRouter, Depends, Query
from typing import Literal
from sqlalchemy.orm import Session

from backend.app.db.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.registration import MyRegistrationListResponse

from backend.app.services.registration_service import get_my_registrations



router = APIRouter(
    prefix='/users',
    tags=['My Registrations']
)


@router.get('/me/registrations', response_model=MyRegistrationListResponse)
def list_my_registrations(
    registration_status: Literal['registered', 'cancelled'] | None = Query(default=None, alias='status'),
    skip: int = Query(default=0, ge=0),
    limit:int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db:Session = Depends(get_db)
):
    return get_my_registrations(current_user,db, registration_status, skip, limit)