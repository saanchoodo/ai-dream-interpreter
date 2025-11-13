from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.db.models import dream, user
# backend/app/main.py

# ... (импорты FastAPI, CORSMiddleware, api_router) ...
from app.db.session import engine, Base
from app.db.models import dream # Важно импортировать модели, чтобы Base их "увидел"

# Создаем таблицы при запуске (для хакатона это ок, в проде используют миграции)
Base.metadata.create_all(bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Dream Interpreter")

# --- Настройка CORS ---
# Это КРИТИЧЕСКИ ВАЖНО, чтобы ваш фронтенд (даже открытый как локальный файл)
# мог отправлять запросы на ваш бэкенд.
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://localhost:3000",
    "https://capable-griffin-842512.netlify.app/",
    "null"  # Для локальных файлов, открытых в браузере (file://)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- Конец настройки CORS ---

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok"}