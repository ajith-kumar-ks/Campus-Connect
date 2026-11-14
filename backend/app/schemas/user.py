from pydantic import BaseModel, EmailStr, Field, ConfigDict

#incoming registration data
class UserCreate(BaseModel):
    full_name : str = Field(
        min_length=2,
        max_length=100
    )
    email : EmailStr
    password : str = Field(
        min_length=8,
        max_length=128
    )


# Data returned to the client
class UserResponse(BaseModel):
    id : int
    full_name : str
    email : EmailStr
    role : str
    is_active : bool

    model_config = ConfigDict(from_attributes=True)



class UserUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    

class UserPartialUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )
    



class ChangePasswordRequest(BaseModel):

    current_password: str = Field(
        min_length=8,
        max_length=128
    )

    new_password: str = Field(
        min_length=8,
        max_length=128
    )

