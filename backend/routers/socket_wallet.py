from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict
import asyncio

# Импортируем нашу базу и модель юзера
from database import get_db
from models import User

router = APIRouter(tags=["Realtime & Webhooks"])

# Тестовый эндпоинт, чтобы просто посмотреть, кого мы нашли
@router.get("/api/webhook/test-sync")
async def test_find_deactive_addresses(db: AsyncSession = Depends(get_db)):
    print("🔍 Ищем кандидатов на синхронизацию...")
    
    try:
        # 1. Строим умный запрос к базе
        query = select(User).where(
            User.address_status == "deactive",    # Ищем только deactive
            User.deposit_address.is_not(None),    # Отсекаем тех, у кого вообще нет кошелька (NULL)
            User.deposit_address.like("0x%")      # Защита от мусора: адрес должен начинаться с '0x'
        )

        query1 = select(User).where(
            User.address_status == "deactive"    # Защита от мусора: адрес должен начинаться с '0x'
        )
        print("🔍 Вот что будет в запросе к БД:")
        print(query1)
        
        # 2. Выполняем запрос
        result = await db.execute(query)
        users_to_sync = result.scalars().all()
        
        # 3. Смотрим результаты
        if not users_to_sync:
            print("🤷‍♂️ Никого не нашли. Все адреса либо уже active, либо пустые.")
            return {"status": "empty", "message": "Нет юзеров для синхронизации"}
            
        print(f"📦 Нашли {len(users_to_sync)} юзеров для отправки в Alchemy:")
        print("-" * 40)
        
        # 4. Принтуем каждого найденного юзера (как ты и просил)
        for u in users_to_sync:
            print(f" 👤 Юзер (TG: {u.telegram_id}) | 👛 Адрес: {u.deposit_address}")
            
        print("-" * 40)
        
        return {
            "status": "success", 
            "found_count": len(users_to_sync),
            "message": "Чекни терминал Питона!"
        }
        
    except Exception as e:
        print(f"❌ Ошибка при поиске в БД: {e}")
        return {"status": "error", "message": str(e)}