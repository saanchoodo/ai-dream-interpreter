# backend/app/db/models/user.py
from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False) # Имя
    last_name = Column(String(100), nullable=True)  # Фамилия (необязательно)
    dob = Column(Date, nullable=False) # Дата рождения
    phone = Column(String(20), nullable=False, unique=True, index=True) # Телефон (уникальный!)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    telegram_id = Column(Integer, unique=True, index=True, nullable=True)

    dreams = relationship("Dream", back_populates="owner")