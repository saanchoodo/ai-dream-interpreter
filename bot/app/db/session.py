# backend/app/db/session.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings

# Проверьте, что эта строка правильная
engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Проверьте, что эта строка есть. declarative_base() с круглыми скобками!
Base = declarative_base()

# --- САМАЯ ВАЖНАЯ ЧАСТЬ ---
# Убедитесь, что эта функция существует, и у нее нет опечаток в названии.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()