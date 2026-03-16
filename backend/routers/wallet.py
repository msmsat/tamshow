from fastapi import APIRouter, Depends
from pydantic import BaseModel
from web3 import Web3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Импортируем нашу базу данных и модель юзера
from database import get_db
from models import User


# Ваш роутер! Мы сразу говорим, что все пути тут начинаются с /api/wallet
router = APIRouter(
    prefix="/api/wallet",
    tags=["Wallet"]
)

# ==========================================
# 🌐 НАСТРОЙКИ БЛОКЧЕЙНА (Web3)
# ==========================================
RPC_URL = "https://polygon-mainnet.g.alchemy.com/v2/jgw2lV_0VEtHRbO0ZoRpe" 
w3 = Web3(Web3.HTTPProvider(RPC_URL))
# 1. Тот самый минимальный словарь, чтобы Питон знал слово "balanceOf"
MINIMAL_ABI = [{"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}]

# 2. Контракт вашей NFT
NFT_CONTRACT_ADDRESS = w3.to_checksum_address("0x2953399124F0cBB46d2CbAcD8A89cF0599974963")
nft_contract = w3.eth.contract(address=NFT_CONTRACT_ADDRESS, abi=MINIMAL_ABI)

# 3. ДОБАВЛЯЕМ КОНТРАКТ USDC (Это адрес для сети Polygon, если у вас Ethereum - адрес будет другой)
USDC_CONTRACT_ADDRESS = w3.to_checksum_address("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174")
usdc_contract = w3.eth.contract(address=USDC_CONTRACT_ADDRESS, abi=MINIMAL_ABI)
# ==========================================


# ==========================================
# 🛠 ЭНДПОИНТЫ
# ==========================================
# 1. ПРОВЕРКА СТАТУСА (Тихая регистрация)
# Обратите внимание: путь просто "/status", в итоге получится "/api/wallet/status"
@router.get("/status")
async def check_wallet_status(tg_id: str, db: AsyncSession = Depends(get_db)):
    print(f"🔍 Проверяем статус кошелька для TG ID: {tg_id}")
    if not tg_id:
        return {"is_connected": False, "wallet_address": None}

    try:
        query = select(User).where(User.telegram_id == tg_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            new_user = User(telegram_id=tg_id)
            db.add(new_user)
            await db.commit() 
            print(f"✅ Создан новый пользователь с TG ID: {tg_id}")
            return {"is_connected": False, "wallet_address": None}

        if user.wallet_address:
            print(f"✅ Пользователь {tg_id} уже привязал кошелек: {user.wallet_address}")
            return {"is_connected": True, "wallet_address": user.wallet_address}
            
        print(f"⚠️ Пользователь {tg_id} найден, но кошелек не привязан.")
        return {"is_connected": False, "wallet_address": None}

    except Exception as e:
        print(f"❌ Ошибка БД при поиске/создании юзера: {e}")
        return {"is_connected": False, "wallet_address": None}


# 2. ПРИВЯЗКА НОВОГО КОШЕЛЬКА
class WalletConnectRequest(BaseModel):
    tg_id: str
    wallet_address: str

# Обратите внимание: путь просто "/connect", потому что префикс "/api/wallet" добавится сам!
@router.post("/connect")
async def connect_wallet(req: WalletConnectRequest, db: AsyncSession = Depends(get_db)):
    print("=" * 40)
    print("🔗 ПРОВЕРКА USDC ПЕРЕД ПРИВЯЗКОЙ")
    print(f"👤 TG ID : {req.tg_id}")
    print(f"👛 Адрес : {req.wallet_address}")
    
    try:
        if w3.is_address(req.wallet_address):
            checksum_address = w3.to_checksum_address(req.wallet_address)
            
            # 1. Читаем сырой баланс из смарт-контракта
            raw_usdc = usdc_contract.functions.balanceOf(checksum_address).call()
            
            # 2. У USDC 6 нулей после запятой, поэтому делим на миллион
            real_usdc_balance = raw_usdc / 1_000_000
            print(f"💵 Баланс USDC : {real_usdc_balance}$")
            
            # 3. ГЛАВНАЯ ПРОВЕРКА: Если меньше 1 бакса
            if real_usdc_balance < 0.0:
                print("❌ Отказ: Недостаточно средств на балансе!")
                return {
                    "success": False, 
                    "error": f"На балансе кошелька должно быть минимум 1 USDC. Сейчас: {real_usdc_balance}$"
                }

            # 4. Если всё супер (денег хватает):
            print("✅ Проверка пройдена! Сохраняем в базу...")
            
            # --- НАЧАЛО БЛОКА БАЗЫ ДАННЫХ ---
            # Ищем юзера по его Telegram ID
            query = select(User).where(User.telegram_id == req.tg_id)
            result = await db.execute(query)
            user = result.scalar_one_or_none()

            if user:
                # Если юзер уже есть в БД — просто обновляем ему кошелек
                user.wallet_address = req.wallet_address
            else:
                # Если юзера почему-то не было (например, не сработала тихая регистрация) — создаем!
                new_user = User(telegram_id=req.tg_id, wallet_address=req.wallet_address)
                db.add(new_user)

            # Сохраняем (коммитим) изменения в PostgreSQL!
            await db.commit()
            print(f"💾 Успех! Кошелек {req.wallet_address} навсегда привязан к {req.tg_id}")
            # --- КОНЕЦ БЛОКА БАЗЫ ДАННЫХ ---

            return {
                "success": True, 
                "wallet_address": req.wallet_address,
                "usdc_balance": real_usdc_balance
            }
            
        else:
            return {"success": False, "error": "Неверный формат адреса кошелька"}
            
    except Exception as e:
        print(f"⚠️ Ошибка связи с блокчейном: {e}")
        return {"success": False, "error": "Ошибка при проверке баланса в блокчейне"}


# Форма приема для отключения (нам нужен только ID)
class WalletDisconnectRequest(BaseModel):
    tg_id: str

@router.post("/disconnect")
async def disconnect_wallet(req: WalletDisconnectRequest, db: AsyncSession = Depends(get_db)):
    print(f"🔌 Поступил запрос на отключение кошелька от TG ID: {req.tg_id}")
    
    try:
        # Ищем юзера
        query = select(User).where(User.telegram_id == req.tg_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            # Если юзер найден — СТИРАЕМ АДРЕС! (Присваиваем None)
            user.wallet_address = None
            print(f"✅ Кошелек успешно удален из БД для юзера {req.tg_id}")
        else:
            # Если юзера вдруг не оказалось в базе — создаем его (только по tg_id)
            new_user = User(telegram_id=req.tg_id)
            db.add(new_user)
            print(f"🆕 Пользователь {req.tg_id} не найден. Создали нового (без кошелька)!")

        # Вызываем commit() один раз для обоих случаев, чтобы сохранить изменения
        await db.commit()
            
        return {"success": True}
        
    except Exception as e:
        print(f"❌ Ошибка БД при удалении кошелька: {e}")
        return {"success": False, "error": str(e)}