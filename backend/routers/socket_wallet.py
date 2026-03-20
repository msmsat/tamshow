from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from typing import Dict
import asyncio

router = APIRouter(tags=["Realtime & Webhooks"])

# ==========================================
# 🧠 1. МЕНЕДЖЕР СОЕДИНЕНИЙ (Мозг системы)
# ==========================================
class ConnectionManager:
    def __init__(self):
        # Храним сокеты по АДРЕСУ КОШЕЛЬКА (deposit_address), а не по tg_id.
        # Почему? Потому что Alchemy в вебхуке пришлет нам именно адрес, на который упали деньги!
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, deposit_address: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[deposit_address] = websocket
        print(f"🟢 Сокет привязан к ожиданию оплаты на адрес: {deposit_address}")

    def disconnect(self, deposit_address: str):
        if deposit_address in self.active_connections:
            del self.active_connections[deposit_address]
            print(f"🔴 Сокет отвязан от адреса: {deposit_address}")

    async def notify_payment_success(self, deposit_address: str, amount: float, tx_hash: str):
        """Эта функция вызывается вебхуком, чтобы пнуть React"""
        if deposit_address in self.active_connections:
            ws = self.active_connections[deposit_address]
            await ws.send_json({
                "status": "PAID",
                "amount": amount,
                "tx_hash": tx_hash,
                "message": "Transaction Confirmed!"
            })
            print(f"⚡️ УВЕДОМЛЕНИЕ ОТПРАВЛЕНО ВО ФРОНТЕНД ДЛЯ: {deposit_address}")
        else:
            print(f"⚠️ Оплата пришла, но юзер оффлайн. (Он увидит статус при следующем входе)")

manager = ConnectionManager()

# ==========================================
# 🔌 2. WEBSOCKET (Для React)
# ==========================================
# Обрати внимание: теперь мы подключаемся по deposit_address
@router.websocket("/ws/payment/{deposit_address}")
async def payment_websocket(websocket: WebSocket, deposit_address: str):
    await manager.connect(deposit_address, websocket)
    try:
        # Здесь в будущем будет запрос к БД: "А не оплачен ли уже этот заказ?"
        await websocket.send_json({"status": "WAITING", "message": "Ожидание транзакции в сети Polygon..."})
        
        while True:
            # Просто держим соединение открытым
            data = await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(deposit_address)


# ==========================================
# 🪝 3. WEBHOOK ENDPOINT (Для Alchemy)
# ==========================================
@router.post("/api/webhook/alchemy")
async def alchemy_webhook(request: Request):
    """
    Сюда стучится Alchemy, когда видит движение средств.
    """
    try:
        # Получаем JSON от Alchemy
        payload = await request.json()
        print("\n🔔 [WEBHOOK] ALCHEMY ПРИСЛАЛ ДАННЫЕ!")
        
        # Разбираем структуру Alchemy (Address Activity Webhook)
        # В реальной жизни тут нужно добавить проверку подписи (HMAC) для безопасности!
        event = payload.get("event", {})
        activities = event.get("activity", [])

        for tx in activities:
            category = tx.get("category")
            asset = tx.get("asset")
            to_address = tx.get("toAddress")
            value = tx.get("value") # Сумма
            tx_hash = tx.get("hash")
            
            # Проверяем, что это именно перевод токена (ERC20) и именно USDC
            if category == "token" and asset == "USDC":
                print(f"💵 ПОЙМАН ПЕРЕВОД USDC!")
                print(f"📥 Куда: {to_address}")
                print(f"💰 Сумма: {value} USDC")
                print(f"🔗 Хэш: {tx_hash}")

                # === ТУТ ДОЛЖНА БЫТЬ ЛОГИКА БД ===
                # 1. Найти заказ по to_address
                # 2. Проверить, что value >= сумме заказа
                # 3. Пометить заказ как "ОПЛАЧЕН"
                # =================================

                # 🚀 ПИНГУЕМ REACT ЧЕРЕЗ СОКЕТ (Менеджер сам найдет нужный сокет по адресу)
                await manager.notify_payment_success(
                    deposit_address=to_address, 
                    amount=float(value), 
                    tx_hash=tx_hash
                )

        return {"status": "success"}

    except Exception as e:
        print(f"❌ Ошибка обработки вебхука: {e}")
        return {"status": "error", "message": str(e)}