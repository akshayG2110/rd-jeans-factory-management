from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserLogin(BaseModel):
    username: str = Field(..., description="Unique username of the user")
    password: str = Field(..., description="Password of the user")

class UserResponse(BaseModel):
    id: int
    username: str
    token: Optional[str] = None

    class Config:
        from_attributes = True

class LoginSuccessResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    user: UserResponse
