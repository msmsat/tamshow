from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

# Импортируем базу данных и модель юзера
from database import get_db
from models import User

router = APIRouter(tags=["Alchemy Webhook"])

# Стало (добавили prefix):
router = APIRouter(
    prefix="/api/webhook",
    tags=["Alchemy Webhook"]
)

@router.post("/alchemy")
async def alchemy_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Принимает уведомления от Alchemy о транзакциях в блокчейне.
    """
    try:
        # 1. Получаем сырые данные от Alchemy
        payload = await request.json()
        
        print("\n🔔 [WEBHOOK] ПОЛУЧЕНО УВЕДОМЛЕНИЕ ОТ ALCHEMY!")
        
        # 2. Извлекаем самое важное: список активностей (транзакций)
        # Alchemy может прислать несколько транзакций в одном пакете
        event = payload.get("event", {})
        activities = event.get("activity", [])

        if not activities:
            print("ℹ️ Пакет пустой (это может быть тестовая проверка от Alchemy)")
            return {"status": "ok"}

        for activity in activities:
            from_addr = activity.get("fromAddress")
            to_addr = activity.get("toAddress")
            value = activity.get("value")
            asset = activity.get("asset") # Например, 'USDC' или 'MATIC'
            tx_hash = activity.get("hash")

            print("\n" + "=" * 50)
            print(f"🔔 НОВАЯ ТРАНЗАКЦИЯ: {value} {asset}")

            # ==========================================
            # 1. ПРАВИЛО №1: НЕПРАВИЛЬНАЯ ВАЛЮТА СГОРАЕТ
            # ==========================================
            if asset != "USDC":
                print(f"🔥 ВАЛЮТА СГОРЕЛА: Юзер прислал {asset} вместо USDC.")
                print(f"🔗 Транзакция: {tx_hash}")
                print("Действие: Игнорируем перевод. Товар не выдается.")
                print("=" * 50)
                continue # Забываем про этот перевод и идем дальше

            # ==========================================
            # 2. ПОПОЛНЕНИЕ БАЛАНСА В БАЗЕ ДАННЫХ
            # ==========================================
            # Ищем пользователя по deposit_address (игнорируем регистр через ilike)
            query = select(User).where(User.deposit_address.ilike(to_addr))
            result = await db.execute(query)
            user = result.scalar_one_or_none()

            if user:
                # Плюсуем пришедшую сумму на внутренний баланс
                user.internal_balance += value
                
                # Сохраняем изменения в базу
                await db.commit()
                
                print(f"✅ УСПЕХ: Пользователь {user.telegram_id} найден!")
                print(f"💰 Зачислено: {value} USDC")
                print(f"🏦 Новый баланс юзера: {user.internal_balance} USDC")
            else:
                print(f"⚠️ ОШИБКА: Пользователь с адресом {to_addr} не найден в БД!")
                print("Деньги зависли на кошельке, но никому не зачислены.")

            print("=" * 50)

        return {"status": "success"}

    except Exception as e:
        print(f"❌ Ошибка при обработке вебхука: {e}")
        return {"status": "error", "message": str(e)}