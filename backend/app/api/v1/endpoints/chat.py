# backend/app/api/v1/endpoints/chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.dream import DreamRequest, DreamResponse
from app.db.session import get_db
from app.db.models.dream import Dream
from app.db.models.user import User  # <-- Импортируем User
from app.services.llm_service import get_dream_interpretation, LLMError

router = APIRouter()


@router.post("/interpret", response_model=DreamResponse)
def interpret_dream(request: DreamRequest, db: Session = Depends(get_db)):
    # 1. Находим пользователя в БД
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Находим 3 последних сна этого пользователя для контекста
    past_dreams = db.query(Dream).filter(Dream.user_id == user.id).order_by(Dream.created_at.desc()).limit(3).all()

    try:
        interpretation_text = get_dream_interpretation(
            current_dream=request.text,
            user=user,
            past_dreams=past_dreams
        )
    except LLMError as e:
        # Перехватываем ошибку из сервиса и возвращаем ее фронтенду
        raise HTTPException(status_code=503, detail=str(e))

    # 3. Получаем толкование от LLM с учетом контекста
    interpretation_text = get_dream_interpretation(
        current_dream=request.text,
        user=user,
        past_dreams=past_dreams
    )

    # 4. Сохраняем новый сон в БД, привязав его к пользователю
    db_dream = Dream(
        request_text=request.text,
        response_text=interpretation_text,
        user_id=user.id  # <-- Привязываем сон к пользователю
    )
    db.add(db_dream)
    db.commit()
    db.refresh(db_dream)

    return DreamResponse(interpretation=interpretation_text)