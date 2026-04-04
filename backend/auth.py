import hashlib
import hmac
import json
import os
from urllib.parse import parse_qsl
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Говорим FastAPI искать заголовок с названием "Authorization"
header_scheme = APIKeyHeader(name="Authorization", auto_error=False)

async def get_current_user(auth_header: str = Security(header_scheme)) -> str:
    """
    Эта функция - наш охранник. Она проверяет подпись ТГ и возвращает tg_id.
    """
    if not auth_header:
        raise HTTPException(status_code=401, detail="Где паспорт? (Отсутствует заголовок Authorization)")

    # Ожидаем, что React пришлет заголовок в формате: "tma <длинная_строка_initData>"
    try:
        scheme, init_data = auth_header.split(' ', 1)
        if scheme.lower() != 'tma':
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=401, detail="Неверный формат заголовка")

    try:
        # 1. Разбиваем строку на части
        parsed_data = dict(parse_qsl(init_data))

        # 2. Достаем подпись (hash), которую прислал Телеграм
        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            raise HTTPException(status_code=401, detail="В данных нет подписи!")

        # 3. Сортируем данные по алфавиту (как требует документация ТГ)
        data_check_string = '\n'.join(f"{k}={v}" for k, v in sorted(parsed_data.items()))

        # 4. Генерируем секретный ключ из токена бота
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()

        # 5. Вычисляем НАШУ подпись
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        # 6. СВЕРЯЕМ ПОДПИСИ! (Используем безопасное сравнение)
        if not hmac.compare_digest(calculated_hash, received_hash):
            print("🚨 АТАКА: Подпись не совпала!")
            raise HTTPException(status_code=401, detail="Подпись подделана!")

        # 7. Защита пройдена! Достаем ID пользователя
        user_data = json.loads(parsed_data.get('user', '{}'))
        tg_id = str(user_data.get('id'))

        if not tg_id or tg_id == "None":
            raise HTTPException(status_code=401, detail="ID пользователя не найден")

        # Возвращаем 100% честный ID
        return tg_id

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Ошибка авторизации: {str(e)}")