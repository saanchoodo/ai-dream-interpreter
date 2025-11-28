from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import User, UserCreate
from app.db.session import get_db
from app.db.models.user import User as UserModel
from app.schemas.dream import ChatHistoryMessage
from app.db.models.dream import Dream as DreamModel

router = APIRouter()


@router.post("/", response_model=User, status_code=200)  # Меняем статус на 200 OK, т.к. может быть и логин
def smart_login_or_create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Ищет пользователя по номеру телефона.
    - Если не найден: создает нового и сохраняет его гостевую историю (если есть).
    - Если найден: проверяет остальные данные. Если они совпадают - логинит.
    - Если найден, но данные не совпадают - возвращает ошибку.
    """
    existing_user = db.query(UserModel).filter(UserModel.phone == user_data.phone).first()

    # Сценарий А: Пользователь НЕ найден -> Создаем нового
    if not existing_user:
        print(f"Пользователь с тел. {user_data.phone} не найден. Создаем нового.")

        new_user = UserModel(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            dob=user_data.dob,
            phone=user_data.phone
        )
        db.add(new_user)

        # --- ИНТЕГРАЦИЯ НОВОЙ ЛОГИКИ ЗДЕСЬ ---
        # Проверяем, передал ли фронтенд гостевые сообщения
        if user_data.guest_messages:
            db.flush()  # Получаем ID для new_user, не завершая транзакцию
            print(
                f"Сохранение {len(user_data.guest_messages)} гостевых сообщений для нового пользователя ID: {new_user.id}")

            for msg_pair in user_data.guest_messages:
                db_dream = DreamModel(
                    request_text=msg_pair.request_text,
                    response_text=msg_pair.response_text,
                    user_id=new_user.id
                )
                db.add(db_dream)
        # --- КОНЕЦ ИНТЕГРАЦИИ ---

        db.commit()
        db.refresh(new_user)
        # Устанавливаем статус 201 Created только при создании
        # Для этого нужно будет немного переделать ответ FastAPI, но для хакатона это не критично
        return new_user

    # Сценарий Б: Пользователь НАЙДЕН -> Проверяем данные
    else:
        is_first_name_match = existing_user.first_name.lower() == user_data.first_name.lower()
        is_last_name_match = (existing_user.last_name or "").lower() == (user_data.last_name or "").lower()
        is_dob_match = str(existing_user.dob) == str(user_data.dob)

        if is_first_name_match and is_last_name_match and is_dob_match:
            print(f"Пользователь с тел. {user_data.phone} найден, данные совпадают. Логин успешен.")
            # Важно: При логине гостевая история НЕ сохраняется, т.к. у пользователя уже есть своя.
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