from fastapi import APIRouter, Request, Header
import json

router = APIRouter(tags=["Alchemy Webhook"])

@router.post("/alchemy")
async def alchemy_webhook(request: Request):
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

            print("=" * 40)
            print(f"💰 ОБНАРУЖЕН ПЕРЕВОД: {value} {asset}")
            print(f"⬅️ Отправитель: {from_addr}")
            print(f"➡️ Получатель (твой юзер): {to_addr}")
            print(f"🔗 Хеш транзакции: {tx_hash}")
            print("=" * 40)

        return {"status": "success"}

    except Exception as e:
        print(f"❌ Ошибка при обработке вебхука: {e}")
        return {"status": "error", "message": str(e)}