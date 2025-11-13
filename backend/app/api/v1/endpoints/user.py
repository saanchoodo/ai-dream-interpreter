# backend/app/api/v1/endpoints/user.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user import User, UserCreate
from app.db.session import get_db
from app.db.models.user import User as UserModel
from app.schemas.dream import ChatHistoryMessage
from app.db.models.dream import Dream as DreamModel
from typing import List

router = APIRouter()

@router.post("/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(
        UserModel.name == user.name,
        UserModel.dob == user.dob
    ).first()

    # 2. Если пользователь найден - возвращаем его
    if db_user:
        print(f"Пользователь '{user.name}' найден. Выполняется вход.")
        return db_user

    # 3. Если пользователь не найден - создаем нового
    print(f"Пользователь '{user.name}' не найден. Создается новая запись.")
    new_user = UserModel(name=user.name, dob=user.dob)
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