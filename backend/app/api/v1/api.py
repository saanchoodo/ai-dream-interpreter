# backend/app/api/v1/api.py
from fastapi import APIRouter
from app.api.v1.endpoints import chat  # Импортируем модуль chat
from app.api.v1.endpoints import user
from app.api.v1.endpoints import payment # Импортируем модуль user

api_router = APIRouter()

# Используем импортированные модули
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(user.router, prefix="/users", tags=["users"])
api_router.include_router(payment.router, prefix="/payment", tags=["payment"])