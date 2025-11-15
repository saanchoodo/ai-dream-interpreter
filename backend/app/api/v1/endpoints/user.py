from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import User, UserCreate
from app.db.session import get_db
from app.db.models.user import User as UserModel
from app.schemas.dream import ChatHistoryMessage
from app.db.models.dream import Dream as DreamModel

router = APIRouter()


@router.post("/", response_model=User)
def smart_login_or_create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Ищет пользователя по номеру телефона.
    - Если не найден: создает нового.
    - Если найден: проверяет остальные данные. Если они совпадают - логинит.
    - Если найден, но данные не совпадают - возвращает ошибку.
    """
    existing_user = db.query(UserModel).filter(UserModel.phone == user_data.phone).first()

    # Сценарий А: Пользователь НЕ найден -> Создаем нового
    if not existing_user:
        print(f"Пользователь с тел. {user_data.phone} не найден. Создаем нового.")

        # --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем именованные аргументы ---
        new_user = UserModel(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            dob=user_data.dob,
            phone=user_data.phone
        )
        # --- КОНЕЦ ИСПРАВЛЕНИЙ ---

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    # Сценарий Б: Пользователь НАЙДЕН -> Проверяем данные
    else:
        is_first_name_match = existing_user.first_name.lower() == user_data.first_name.lower()
        is_last_name_match = (existing_user.last_name or "").lower() == (user_data.last_name or "").lower()
        is_dob_match = str(existing_user.dob) == str(user_data.dob)

        if is_first_name_match and is_last_name_match and is_dob_match:
            print(f"Пользователь с тел. {user_data.phone} найден, данные совпадают. Логин успешен.")
            return existing_user
        else:
            print(f"Пользователь с тел. {user_data.phone} найден, но данные НЕ совпадают. Отказ.")
            raise HTTPException(
                status_code=409,
                detail="Пользователь с этим номером телефона уже существует, но с другими данными. Проверьте правильность введенных данных."
            )


@router.get("/{user_id}/history", response_model=List[ChatHistoryMessage])
def get_user_chat_history(user_id: int, db: Session = Depends(get_db)):
    """
    Возвращает историю чата для указанного пользователя.
    """
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    dreams = db.query(DreamModel).filter(DreamModel.user_id == user_id).order_by(DreamModel.created_at.asc()).all()

    history: List[ChatHistoryMessage] = []
    for dream in dreams:
        history.append(
            ChatHistoryMessage(role='user', text=dream.request_text, created_at=dream.created_at)
        )
        if dream.response_text:
            history.append(
                ChatHistoryMessage(role='bot', text=dream.response_text, created_at=dream.created_at)
            )

    return history