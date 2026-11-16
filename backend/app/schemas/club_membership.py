from datetime import datetime

from pydantic import BaseModel, ConfigDict

class MembershipRequest(BaseModel):
    club_id: int

class MembershipResponse(BaseModel):

    id: int
    user_id: int
    club_id: int
    role: str
    status: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)
