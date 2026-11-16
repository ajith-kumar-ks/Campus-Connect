from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.schemas.user import UserResponse, UserUpdate, UserPartialUpdate, ChangePasswordRequest
from backend.app.models.user import User
from backend.app.db.dependencies import get_current_user, get_db
from backend.app.services.user_service import update_user_profile, partial_update_user_profile, change_user_password, deactivate_user
from backend.app.schemas.club_membership import MembershipResponse
from backend.app.services.membership_service import get_my_memberships


router = APIRouter(
    prefix='/users',
    tags=['Users']
)


@router.get('/me', response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put('/me', response_model=UserResponse)
def update_profile(user_data:UserUpdate,current_user:User = Depends(get_current_user), db:Session=Depends(get_db)):
    return update_user_profile(user_data, current_user, db)


@router.patch('/me', response_model=UserResponse)
def partial_update_profile(user_data:UserPartialUpdate, current_user:User=Depends(get_current_user), db:Session=Depends(get_db)):
    return partial_update_user_profile(
        user_data,
        current_user,
        db
    )


@router.post(
    "/me/change-password",
    status_code=status.HTTP_200_OK
)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return change_user_password(
        password_data,
        current_user,
        db
    )


@router.post(
    "/me/deactivate",
    status_code=status.HTTP_200_OK
)
def deactivate_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return deactivate_user(current_user, db)


@router.get('/me/club-memberships', response_model=list[MembershipResponse])
def list_my_club_memberships(current_user:User=Depends(get_current_user), db:Session=Depends(get_db)):
    return get_my_memberships(current_user, db)