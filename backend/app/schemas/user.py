# backend/app/schemas/user.py
from pydantic import BaseModel
from datetime import date

class UserBase(BaseModel):
    first_name: str
    last_name: str | None = None
    dob: date
    phone: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        from_attributes = True