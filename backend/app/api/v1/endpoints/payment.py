# backend/app/api/v1/endpoints/payment.py
import hashlib
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


class InvoiceRequest(BaseModel):
    user_id: int
    amount: float = 100.0
    description: str = "Расширенное толкование сна"


@router.post("/create_invoice", response_model=dict)
def create_payment_link(request: InvoiceRequest):
    """
    Генерирует ссылку для перенаправления пользователя на страницу оплаты Робокассы.
    Используются тестовые значения, реальный платеж не пройдет.
    """
    merchant_login = settings.ROBOKASSA_MERCHANT_LOGIN
    password_1 = settings.ROBOKASSA_PASSWORD_1

    # Уникальный номер счета в вашей системе. Для заглушки используем timestamp.
    import time
    invoice_id = int(time.time())

    amount = request.amount
    description = request.description

    # Формируем подпись по алгоритму MD5
    signature_string = f"{merchant_login}:{amount}:{invoice_id}:{password_1}"
    signature_hash = hashlib.md5(signature_string.encode('utf-8')).hexdigest()

    # Формируем URL. is_test=1 - важный параметр для тестового режима.
    payment_url = (
        f"https://auth.robokassa.ru/Merchant/Index.aspx?"
        f"MerchantLogin={merchant_login}&"
        f"OutSum={amount}&"
        f"InvoiceID={invoice_id}&"
        f"Description={description}&"
        f"SignatureValue={signature_hash}&"
        f"IsTest=1"  # <--- Указываем, что это тестовый платеж
    )

    print(f"Сгенерирована ссылка на оплату для пользователя {request.user_id}: {payment_url}")

    return {"payment_url": payment_url}