from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict

class ClubCreate(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=60
    )
    description: str = Field(
        min_length=10,
        max_length=2000
    )
    category: str = Field(
        min_length=3,
        max_length=50
    )


class ClubResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)




class ClubUpdate(BaseModel):

    name: str = Field(
        min_length=3,
        max_length=60
    )

    description: str = Field(
        min_length=10,
        max_length=2000
    )

    category: str = Field(
        min_length=3,
        max_length=50
    )

class ClubPartialUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=3,
        max_length=60
    )

    description: str | None = Field(
        default=None,
        min_length=10,
        max_length=2000
    )

    category: str | None = Field(
        default=None,
        min_length=3,
        max_length=50
    )