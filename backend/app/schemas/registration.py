from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    status: str
    registered_at: datetime
    cancelled_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


