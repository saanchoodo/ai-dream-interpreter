# backend/app/db/models/dream.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Dream(Base):
    __tablename__ = "dreams"

    id = Column(Integer, primary_key=True, index=True)
    request_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(Integer, ForeignKey("users.id"))
    # Обратная связь с моделью User
    owner = relationship("User", back_populates="dreams")