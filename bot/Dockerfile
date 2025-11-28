# bot/Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
# Копируем всю папку app с кодом БД и LLM
COPY ./app /app/app
COPY bot.py .
# --- КОНЕЦ ИЗМЕНЕНИЙ ---

CMD ["python", "bot.py"]