# backend/app/services/llm_service.py

import requests
import json
import re  # <--- 1. ИМПОРТИРУЕМ МОДУЛЬ ДЛЯ РЕГУЛЯРНЫХ ВЫРАЖЕНИЙ
from app.core.config import settings
from app.db.models.user import User
from app.db.models.dream import Dream

API_URL = "https://openrouter.ai/api/v1/chat/completions"


class LLMError(Exception):
    """Кастомная ошибка для проблем, связанных с LLM сервисом."""
    pass


# --- 2. НОВАЯ ФУНКЦИЯ ОЧИСТКИ ОТВЕТА ---
def clean_llm_response(text: str) -> str:
    """Очищает ответ LLM от технических токенов и тегов."""
    if not text:
        return ""

    # Шаг 1: Удаляем теги <s>, </s>, <OBSERVATION>, </OBSERVATION> (без учета регистра)
    cleaned_text = re.sub(r'</?s>|<OBSERVATION>|</OBSERVATION>', '', text, flags=re.IGNORECASE)

    # --- ШАГ 2 (НОВЫЙ): Удаляем маркеры типа [OUT], [IN], [INST] и т.д. ---
    # Это регулярное выражение найдет любые слова в квадратных скобках и удалит их.
    cleaned_text = re.sub(r'\[/?\w+\]', '', cleaned_text)

    # Шаг 3: Удаляем любые другие XML-подобные теги, например <THOUGHT>...</THOUGHT>
    cleaned_text = re.sub(r'<[^>]+>', '', cleaned_text)

    # Шаг 4: Убираем лишние пробелы и переносы строк в начале и в конце
    return cleaned_text.strip()


# --- КОНЕЦ НОВОЙ ФУНКЦИИ ---


def get_dream_interpretation(current_dream: str, user: User, past_dreams: list[Dream]) -> str:
    api_key = settings.OPENROUTER_API_KEY
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Dream Interpreter"
    }

    system_prompt = f"Ты — мудрый толкователь снов. К тебе обращается пользователь по имени {user.name}. Твои ответы должны быть глубокими и поэтичными. Учитывай предыдущие сны пользователя, чтобы найти связи и закономерности."

    context = ""
    if past_dreams:
        past_dreams.reverse()
        context += "Вот предыдущие сны этого пользователя и их толкования (от старых к новым):\n"
        for dream in past_dreams:
            context += f"- Сон: '{dream.request_text}'\n- Толкование: '{dream.response_text}'\n\n"
        context += "А теперь, учитывая этот контекст, растолкуй новый сон."
    else:
        context = "Это первый сон, который пользователь тебе рассказывает. Постарайся произвести хорошее впечатление."

    user_message = f"{context}\n\nНовый сон: {current_dream}"

    payload = {
        # Я вернул deepseek, раз вы с ним экспериментируете. Учтите, что разные модели
        # могут генерировать разный "мусор".
        "model": "mistralai/mistral-7b-instruct",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)

        if 400 <= response.status_code < 500:
            raise LLMError(f"Ошибка клиента от API: {response.status_code} - {response.text}")
        elif 500 <= response.status_code < 600:
            raise LLMError("Сервер, отвечающий за толкование снов, сейчас перегружен или недоступен.")

        response.raise_for_status()

        data = response.json()

        # --- 3. УЛУЧШЕННОЕ ИЗВЛЕЧЕНИЕ И ОЧИСТКА ОТВЕТА ---
        # Безопасно извлекаем текст ответа
        raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        # Очищаем текст от мусора
        cleaned_text = clean_llm_response(raw_text)

        # Проверяем, не пустой ли ответ ПОСЛЕ очистки
        if not cleaned_text:
            print("LLM вернула пустой или технический ответ.")
            raise LLMError("ИИ задумался и вернул пустой ответ. Пожалуйста, попробуйте отправить запрос еще раз.")

        return cleaned_text
        # --- КОНЕЦ ИЗМЕНЕНИЙ ---

    except requests.exceptions.Timeout:
        raise LLMError("Модель слишком долго думала и не ответила вовремя. Пожалуйста, попробуйте еще раз.")
    except requests.RequestException as e:
        raise LLMError("Произошла ошибка сети при попытке связаться с ИИ.")