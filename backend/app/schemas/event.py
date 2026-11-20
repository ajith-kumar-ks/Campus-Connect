from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, model_validator

from typing import Literal


class EventBase(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description:str = Field(min_length=10)
    category:str = Field(min_length=3, max_length=50)
    venue:str = Field(min_length=3, max_length=255)
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    capacity:int|None = Field(default=None, gt=0)

    @model_validator(mode='after')
    def validate_event_dates(self):
        if self.end_time <= self.start_time:
            raise ValueError('End time must be after start time')

        if self.registration_deadline > self.start_time:
            raise ValueError(
                "Registration deadline must be before event start"
            )

        return self


class EventCreate(EventBase):
    pass



class EventUpdate(BaseModel):

    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        min_length=10
    )

    category: str | None = Field(
        default=None,
        min_length=3,
        max_length=50
    )

    venue: str | None = Field(
        default=None,
        min_length=3,
        max_length=255
    )

    start_time: datetime | None = None
    end_time: datetime | None = None
    registration_deadline: datetime | None = None

    capacity: int | None = Field(
        default=None,
        gt=0
    )

    @model_validator(mode="after")
    def validate_updated_dates(self):

        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError(
                "End time must be after start time"
            )

        if (
            self.registration_deadline is not None
            and self.start_time is not None
            and self.registration_deadline > self.start_time
        ):
            raise ValueError(
                "Registration deadline must be before event start"
            )

        return self



class EventResponse(EventBase):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    club_id: int
    created_by_id: int
    status: str

    created_at: datetime
    updated_at: datetime



class EventStatusUpdate(BaseModel):
    status: Literal[
        "published",
        "cancelled",
        "completed"
    ]



class EventListResponse(BaseModel):
    items : list[EventResponse]
    total : int
    skip : int
    limit : int
    
