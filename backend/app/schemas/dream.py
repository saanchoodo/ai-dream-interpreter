from pydantic import BaseModel, Field
from datetime import datetime

class DreamRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Текст сна пользователя")
    user_id: int

class DreamResponse(BaseModel):
    interpretation: str

class ChatHistoryMessage(BaseModel):
    role: str # 'user' или 'bot'
    text: str
    created_at: datetime

    class Config:
        from_attributes = True