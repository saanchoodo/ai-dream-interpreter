# bot/bot.py
import asyncio
import logging
import os
from datetime import datetime
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.user import User
from app.db.models.dream import Dream
from app.services.llm_service import get_dream_interpretation, LLMError

load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not TOKEN: raise ValueError("Не найден TELEGRAM_BOT_TOKEN")

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

bot = Bot(token=TOKEN)
dp = Dispatcher()


# --- 1. ОПРЕДЕЛЯЕМ СОСТОЯНИЯ ДЛЯ РЕГИСТРАЦИИ ---
class Registration(StatesGroup):
    waiting_for_first_name = State()
    waiting_for_dob = State()
    waiting_for_phone = State()


# --- ХЭНДЛЕР КОМАНДЫ /start ---
@dp.message(CommandStart())
async def handle_start(message: Message, state: FSMContext):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == message.from_user.id).first()
        if user:
            await message.answer(f"С возвращением, {user.first_name}! Жду ваш новый сон.")
            await state.clear()  # Сбрасываем состояние, если оно было
        else:
            # Начинаем диалог регистрации
            await message.answer("Добро пожаловать в ИИ Сонник! Давайте познакомимся. Как вас зовут? (только имя)")
            await state.set_state(Registration.waiting_for_first_name)
    finally:
        db.close()


# --- ХЭНДЛЕРЫ ДИАЛОГА РЕГИСТРАЦИИ ---
@dp.message(Registration.waiting_for_first_name)
async def process_first_name(message: Message, state: FSMContext):
    await state.update_data(first_name=message.text)
    await message.answer("Отлично! Теперь введите вашу дату рождения в формате ДД.ММ.ГГГГ (например, 25.08.1995)")
    await state.set_state(Registration.waiting_for_dob)


@dp.message(Registration.waiting_for_dob)
async def process_dob(message: Message, state: FSMContext):
    try:
        # Проверяем формат даты
        dob = datetime.strptime(message.text, "%d.%m.%Y").date()
        await state.update_data(dob=dob)
        await message.answer(
            "Спасибо! И последний шаг: ваш номер телефона. Я буду использовать его для входа на сайте.")
        await state.set_state(Registration.waiting_for_phone)
    except ValueError:
        await message.answer("Неверный формат даты. Пожалуйста, введите в формате ДД.ММ.ГГГГ")


@dp.message(Registration.waiting_for_phone)
async def process_phone(message: Message, state: FSMContext):
    phone = message.text
    user_data = await state.get_data()
    db = SessionLocal()
    try:
        # Проверяем, нет ли уже пользователя с таким телефоном
        existing_user = db.query(User).filter(User.phone == phone).first()
        if existing_user:
            await message.answer(
                "Пользователь с таким номером телефона уже зарегистрирован. Попробуйте другой номер или отправьте /start, чтобы начать заново.")
            return

        # Создаем нового пользователя
        new_user = User(
            first_name=user_data['first_name'],
            dob=user_data['dob'],
            phone=phone,
            telegram_id=message.from_user.id
        )
        db.add(new_user)
        db.commit()
        await message.answer(
            f"Регистрация завершена! Рад знакомству, {new_user.first_name}. Теперь вы можете присылать мне свои сны.")
        await state.clear()  # Завершаем регистрацию
    finally:
        db.close()


# --- ОСНОВНОЙ ХЭНДЛЕР СНОВ ---
@dp.message(F.text)
async def handle_text_message(message: Message, state: FSMContext):
    # Убедимся, что пользователь не в процессе регистрации
    current_state = await state.get_state()
    if current_state is not None:
        await message.answer("Пожалуйста, сначала завершите регистрацию.")
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == message.from_user.id).first()
        if not user:
            await message.answer("Кажется, мы еще не знакомы. Пожалуйста, отправьте команду /start")
            return

        await bot.send_chat_action(chat_id=message.chat.id, action="typing")
        past_dreams = db.query(Dream).filter(Dream.user_id == user.id).order_by(Dream.created_at.desc()).limit(3).all()

        try:
            interpretation_text = get_dream_interpretation(current_dream=message.text, user=user,
                                                           past_dreams=past_dreams)
        except LLMError as e:
            await message.reply(f"Произошла ошибка при толковании: {e}")
            return

        new_dream = Dream(request_text=message.text, response_text=interpretation_text, user_id=user.id)
        db.add(new_dream)
        db.commit()
        await message.reply(interpretation_text)
    finally:
        db.close()


async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен.")