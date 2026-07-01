from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
import uuid
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str
    full_name: str = Field(alias="fullName")
    phone: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    id_token: str


class RefreshRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    refresh_token: str = Field(alias="refreshToken")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    fullName: str = Field(validation_alias="full_name")
    phone: Optional[str] = None
    role: str
    avatarUrl: Optional[str] = Field(None, validation_alias="avatar_url")
    emailVerified: bool = Field(validation_alias="email_verified")
    createdAt: datetime = Field(validation_alias="created_at")


class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"
    expiresIn: int
    user: UserOut
