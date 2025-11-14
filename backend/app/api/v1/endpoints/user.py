# backend/app/api/v1/endpoints/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import User, UserCreate
from app.db.session import get_db
from app.db.models.user import User as UserModel
from app.schemas.dream import ChatHistoryMessage
from app.db.models.dream import Dream as DreamModel
from typing import List

router = APIRouter()


@router.post("/", response_model=User, status_code=201)  # Используем 201 Created для новых
def create_user_if_not_exists(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Создает нового пользователя, если номера телефона еще нет в базе.
    Если номер уже существует, возвращает ошибку 409 Conflict.
    """
    # 1. Ищем пользователя по УНИКАЛЬНОМУ номеру телефона
    existing_user = db.query(UserModel).filter(UserModel.phone == user_data.phone).first()

    # 2. Если пользователь с таким телефоном уже есть - возвращаем ошибку
    if existing_user:
        # 409 Conflict - стандартный код для таких ситуаций
        raise HTTPException(
            status_code=409,
            detail="Пользователь с таким номером телефона уже зарегистрирован."
        )

    # 3. Если все хорошо - создаем нового пользователя
    new_user = UserModel(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        dob=user_data.dob,
        phone=user_data.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{user_id}/history", response_model=List[ChatHistoryMessage])
def get_user_chat_history(user_id: int, db: Session = Depends(get_db)):
    """
    Возвращает историю чата для указанного пользователя.
    """
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Получаем все сны пользователя, отсортированные по дате (старые вверху)
    dreams = db.query(DreamModel).filter(DreamModel.user_id == user_id).order_by(DreamModel.created_at.asc()).all()

    # Превращаем список снов в плоский список сообщений
    history: List[ChatHistoryMessage] = []
    for dream in dreams:
        # Добавляем сообщение пользователя
        history.append(
            ChatHistoryMessage(role='user', text=dream.request_text, created_at=dream.created_at)
        )
        # Добавляем ответ бота, если он есть
        if dream.response_text:
            history.append(
                ChatHistoryMessage(role='bot', text=dream.response_text, created_at=dream.created_at)
            )

    return history