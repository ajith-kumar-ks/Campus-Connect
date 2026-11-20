from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.registration import RegistrationResponse
from backend.app.services.registration_service import register_for_event, cancel_registration


router = APIRouter(
    prefix='/events',
    tags=['Event Registrations']
)


@router.post('/{event_id}/register', response_model=RegistrationResponse)
def register(event_id:int, current_user:User=Depends(get_current_user), db:Session=Depends(get_db)):
    return register_for_event(event_id, current_user, db)


@router.delete('/{event_id}/cancel', response_model=RegistrationResponse)
def cancel(event_id:int, current_user:User=Depends(get_current_user), db:Session=Depends(get_db)):
    return cancel_registration(event_id, current_user, db)


