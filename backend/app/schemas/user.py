# backend/app/schemas/user.py
from pydantic import BaseModel
from datetime import date

class UserBase(BaseModel):
    name: str
    dob: date | None = None # Дата рождения - необязательное поле

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        from_attributes = True # Раньше называлось orm_mode