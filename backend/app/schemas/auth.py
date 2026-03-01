from pydantic import BaseModel
from typing import Optional


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class LoginEmail(BaseModel):
    email: str
    password: str


class LoginDNI(BaseModel):
    dni: str
