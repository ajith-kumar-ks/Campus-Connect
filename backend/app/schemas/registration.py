from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Literal


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    status: str
    registered_at: datetime
    cancelled_at: datetime | None

    model_config = ConfigDict(from_attributes=True)



class RegistrationListResponse(BaseModel):
    items: list[RegistrationResponse]
    total: int
    skip: int
    limit: int



class RegisteredEventSummary(BaseModel):
    id: int
    title: str
    category: str
    venue: str
    start_time: datetime
    end_time: datetime

    model_config = ConfigDict(from_attributes=True)


class MyRegistrationResponse(BaseModel):
    id: int
    status: str
    registered_at: datetime
    cancelled_at: datetime | None
    event: RegisteredEventSummary

    model_config = ConfigDict(from_attributes=True)



class MyRegistrationListResponse(BaseModel):
    items: list[MyRegistrationResponse]
    total: int
    skip: int
    limit: int