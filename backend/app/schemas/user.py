# backend/app/schemas/user.py
from pydantic import BaseModel
from datetime import date
from typing import List, Optional


class GuestMessage(BaseModel):
    request_text: str
    response_text: str

class UserBase(BaseModel):
    first_name: str
    last_name: str | None = None
    dob: date
    phone: str

class UserCreate(UserBase):
    guest_messages: Optional[List[GuestMessage]] = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True