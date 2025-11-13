# backend/app/db/models/user.py
from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    dob = Column(Date, nullable=True) # dob = Date of Birth
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Эта строка создает "виртуальную" колонку, которая будет
    # содержать все сны, связанные с этим пользователем.
    dreams = relationship("Dream", back_populates="owner")