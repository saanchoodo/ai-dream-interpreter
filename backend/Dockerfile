# backend/Dockerfile

# 1. Используем официальный образ Python
FROM python:3.10-slim

# 2. Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# 3. Копируем сначала только файл с зависимостями
# Это трюк для кэширования: пока requirements.txt не меняется, Docker не будет переустанавливать пакеты
COPY requirements.txt .

# 4. Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# 5. Копируем весь остальной код приложения
COPY ./app /app/app

# 6. Указываем команду, которая запустится при старте контейнера
# 0.0.0.0 — важно, чтобы сервер был доступен извне контейнера
CMD /bin/sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"