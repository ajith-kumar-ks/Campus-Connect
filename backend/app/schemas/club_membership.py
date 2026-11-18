from datetime import datetime

from pydantic import BaseModel, ConfigDict

class MembershipRequest(BaseModel):
    club_id: int


class MembershipUserResponse(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class MembershipResponse(BaseModel):

    id: int
    user_id: int
    club_id: int
    role: str
    status: str
    joined_at: datetime
    user: MembershipUserResponse

    model_config = ConfigDict(from_attributes=True)
