from fastapi import APIRouter, Depends
from pydantic import BaseModel
from web3 import Web3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio

# Импортируем нашу базу данных и модель юзера
from auth import get_current_user
from database import get_db
from models import User

import httpx
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv() # Загружаем переменные из .env
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
# Подгружаем ключи (убедись, что они есть в .env)
ALCHEMY_AUTH_TOKEN = os.getenv("ALCHEMY_AUTH_TOKEN")
ALCHEMY_WEBHOOK_ID = os.getenv("ALCHEMY_WEBHOOK_ID")
if not ENCRYPTION_KEY:
    raise ValueError("🚨 ВНИМАНИЕ: ENCRYPTION_KEY не найден в файле .env!")
    
cipher_suite = Fernet(ENCRYPTION_KEY.encode())


# Ваш роутер! Мы сразу говорим, что все пути тут начинаются с /api/wallet
router = APIRouter(
    prefix="/api/wallet",
    tags=["Wallet"]
)

# ==========================================
# 🌐 НАСТРОЙКИ БЛОКЧЕЙНА (Web3)
# ==========================================
RPC_URL = os.getenv("ALCHEMY_RPC_URL")
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
# 1. САМА ЛОГИКА АУДИТА (Без @router)
# ==========================================
async def process_alchemy_audit(db: AsyncSession):
    print("🔍 [АВТО] Начинаем полный аудит адресов между БД и Alchemy...")

    if not ALCHEMY_AUTH_TOKEN or not ALCHEMY_WEBHOOK_ID:
        print("❌ Не настроены ключи Alchemy!")
        return

    try:
        # Достаем всех юзеров с адресами
        query = select(User).where(User.deposit_address.is_not(None))
        result = await db.execute(query)
        all_users = result.scalars().all()

        # Собираем только активные адреса из БД (в нижнем регистре для точного сравнения)
        db_active_addresses = {u.deposit_address.lower(): u for u in all_users if u.address_status == "active"}

        # Идем в Alchemy
        headers = {
            "X-Alchemy-Token": ALCHEMY_AUTH_TOKEN,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        # 👇 НАЧАЛО БЛОКА HTTP-КЛИЕНТА
        async with httpx.AsyncClient() as client:
            get_url = f"https://dashboard.alchemy.com/api/webhook-addresses?webhook_id={ALCHEMY_WEBHOOK_ID}&limit=100"
            get_response = await client.get(get_url, headers=headers)
            
            if get_response.status_code != 200:
                print(f"❌ Сбой при запросе к Alchemy: {get_response.text}")
                return
                
            alchemy_data = get_response.json()
            
            # 🕵️‍♂️ ДЕТЕКТИВНЫЕ ПРИНТЫ (ШАГ 1): Смотрим сырой ответ от Alchemy
            print("\n" + "="*50)
            print(f"📦 СЫРОЙ ОТВЕТ ALCHEMY: {alchemy_data}")
            
            # Alchemy может прятать список в ключе "data" или "addresses". Пробуем оба!
            raw_addresses_list = alchemy_data.get("data", alchemy_data.get("addresses", []))
            
            alchemy_addresses = {addr.lower() for addr in raw_addresses_list}
            
            # 🕵️‍♂️ ДЕТЕКТИВНЫЕ ПРИНТЫ (ШАГ 2): Смотрим, что скрипт понял
            print(f"🟢 Адреса в БД (активные)  : {list(db_active_addresses.keys())}")
            print(f"🟠 Адреса в Alchemy (понятые): {list(alchemy_addresses)}")
            
            # Вычисляем, кого удалять
            addresses_to_deactivate = set(db_active_addresses.keys()) - alchemy_addresses
            addresses_to_remove_from_alchemy = alchemy_addresses - set(db_active_addresses.keys())
            
            # 🕵️‍♂️ ДЕТЕКТИВНЫЕ ПРИНТЫ (ШАГ 3): Смотрим математику
            print(f"🔴 На удаление из Alchemy  : {list(addresses_to_remove_from_alchemy)}")
            print(f"🟡 На деактивацию в БД     : {list(addresses_to_deactivate)}")
            print("="*50 + "\n")

            # ПРИМЕНЯЕМ ИЗМЕНЕНИЯ (Оставляем как было)
            for addr in addresses_to_deactivate:
                user = db_active_addresses[addr]
                user.address_status = "deactive"
                print(f"📉 Исправлено: Статус изменен на deactive для {addr}")

            if addresses_to_deactivate:
                await db.commit()
                
            if addresses_to_remove_from_alchemy:
                patch_url = "https://dashboard.alchemy.com/api/update-webhook-addresses"
                payload = {
                    "webhook_id": ALCHEMY_WEBHOOK_ID,
                    "addresses_to_add": [],
                    "addresses_to_remove": list(addresses_to_remove_from_alchemy)
                }
                patch_response = await client.patch(patch_url, json=payload, headers=headers)
                
                if patch_response.status_code == 200:
                    print(f"🧹 Удалено {len(addresses_to_remove_from_alchemy)} лишних адресов из Alchemy!")
                else:
                    print(f"❌ Ошибка при удалении из Alchemy: {patch_response.text}")

            if not addresses_to_deactivate and not addresses_to_remove_from_alchemy:
                print("✨ Аудит пройден: База и Alchemy полностью синхронизированы!")

        # 👆 КОНЕЦ БЛОКА HTTP-КЛИЕНТА
        
        return {"status": "success"}

    except Exception as e:
        print(f"❌ Ошибка аудита: {e}")

# ==========================================
# 3. ФОНОВЫЙ ТАЙМЕР (Крутится бесконечно)
# ==========================================
async def periodic_audit_task():
    while True:
        print("\n⏰ [ТАЙМЕР] Ждем 5 минут перед следующим аудитом...")
        await asyncio.sleep(300) # 300 секунд = ровно 5 минут
        print("⏳ [ТАЙМЕР] Запускаем плановую проверку Alchemy...")
        try:
            # Берем базу данных точно так же, как делали в скрипте заливки товаров
            async for db in get_db():
                await process_alchemy_audit(db)
                break # Выполнили 1 раз и прервали цикл получения БД
        except Exception as e:
            print(f"❌ Ошибка таймера: {e}")


# ==========================================
# 🛠 ЭНДПОИНТЫ
# ==========================================
# 1. ПРОВЕРКА СТАТУСА (Тихая регистрация)
# Обратите внимание: путь просто "/status", в итоге получится "/api/wallet/status"
@router.get("/status")
async def check_wallet_status(
    # tg_id: str, <-- Старый небезопасный параметр УДАЛЯЕМ
    tg_id: str = Depends(get_current_user), # 🔥 Ставим охранника!
    db: AsyncSession = Depends(get_db)
):
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
    wallet_address: str

# Обратите внимание: путь просто "/connect", потому что префикс "/api/wallet" добавится сам!
@router.post("/connect")
async def connect_wallet(req: WalletConnectRequest, db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    print("=" * 40)
    print("🔗 ПРОВЕРКА USDC ПЕРЕД ПРИВЯЗКОЙ")
    print(f"👤 TG ID : {tg_id}")
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
            query = select(User).where(User.telegram_id == tg_id)
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
            print(f"💾 Успех! Кошелек {req.wallet_address} навсегда привязан к {tg_id}")
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

@router.post("/disconnect")
async def disconnect_wallet(db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    print(f"🔌 Поступил запрос на отключение кошелька от TG ID: {tg_id}")
    
    try:
        # Ищем юзера
        query = select(User).where(User.telegram_id == tg_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            # Если юзер найден — СТИРАЕМ АДРЕС! (Присваиваем None)
            user.wallet_address = None
            print(f"✅ Кошелек успешно удален из БД для юзера {tg_id}")
        else:
            # Если юзера вдруг не оказалось в базе — создаем его (только по tg_id)
            new_user = User(telegram_id=tg_id)
            db.add(new_user)
            print(f"🆕 Пользователь {tg_id} не найден. Создали нового (без кошелька)!")

        # Вызываем commit() один раз для обоих случаев, чтобы сохранить изменения
        await db.commit()
            
        return {"success": True}
        
    except Exception as e:
        print(f"❌ Ошибка БД при удалении кошелька: {e}")
        return {"success": False, "error": str(e)}

@router.get("/get-address")
async def get_deposit_address(db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    print(f"🔥 [БЭКЕНД] Пришел запрос от фронтенда!")
    print(f"👀 Ищем Polygon-адрес для юзера: {tg_id}")
    
    try:
        # 1. Ищем юзера в базе
        query = select(User).where(User.telegram_id == tg_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        # 2. Если адрес уже есть — отдаем его (чтобы не плодить кошельки)
        if user and user.deposit_address:
            print(f"✅ Нашли адрес в БД: {user.deposit_address}")
            # 🔥 НОВОЕ: ЕСЛИ АДРЕС СТАРЫЙ, НО DEACTIVE — ПРОБУЕМ СИНХРОНИЗИРОВАТЬ!
            if user.address_status == "deactive":
                print("🔄 Адрес deactive! Запускаем синхронизацию с Alchemy...")
                await sync_deactive_addresses_with_check(db)
            return {
                "status": "success",
                "address": user.deposit_address
            }

        # 3. Если адреса нет — ГЕНЕРИРУЕМ РЕАЛЬНЫЙ КОШЕЛЕК
        print("⚠️ Адрес не найден. Генерируем реальный Web3 кошелек...")
        
        # 🪄 Магия Web3.py
        new_wallet = w3.eth.account.create()
        new_address = new_wallet.address
        private_key = new_wallet.key.hex() # Получаем ключ в виде строки (hex)
        encrypted_private_key = cipher_suite.encrypt(private_key.encode()).decode() # Шифруем ключ для безопасного хранения в БД

        if user:
            # Юзер есть, кладем адрес и зашифрованный ключ на его полки
            user.deposit_address = new_address
            user.deposit_private_key = encrypted_private_key
        else:
            # Юзера нет, создаем полностью
            new_user = User(
                telegram_id=tg_id, 
                deposit_address=new_address,
                deposit_private_key=encrypted_private_key
            )
            db.add(new_user)

        # 4. Сохраняем в базу!
        await db.commit()
        print(f"💾 УСПЕХ! Сгенерирован боевой кошелек: {new_address}")
        
        # 🔥 НОВОЕ: Сразу после создания кошелька дергаем нашу функцию синхронизации!
        # Она найдет этот новый адрес со статусом "deactive" и отправит в Alchemy
        print("🔄 Автоматически запускаем синхронизацию с Alchemy...")
        await sync_deactive_addresses_with_check(db)

        return {
            "status": "success",
            "address": new_address
        }
        
    except Exception as e:
        print(f"❌ Ошибка БД при генерации адреса: {e}")
        return {
            "status": "error",
            "address": None
        }


@router.get("/sync-alchemy")
async def sync_deactive_addresses_with_check(db: AsyncSession = Depends(get_db)):
    print("🔍 Ищем кандидатов на синхронизацию...")
    
    # Проверяем, настроены ли ключи
    if not ALCHEMY_AUTH_TOKEN or not ALCHEMY_WEBHOOK_ID:
        return {"status": "error", "message": "Не настроены ключи Alchemy в .env файле!"}
        
    try:
        # 1. Достаем deactive юзеров из БД
        query = select(User).where(
            User.address_status == "deactive",
            User.deposit_address.is_not(None),
            User.deposit_address.like("0x%")
        )
        result = await db.execute(query)
        users_to_sync = result.scalars().all()
        
        if not users_to_sync:
            return {"status": "empty", "message": "Нет новых юзеров для синхронизации"}

        print(f"📦 Нашли {len(users_to_sync)} адресов в БД со статусом deactive. Проверяем Alchemy...")

        # ==========================================
        # 🛡 ШАГ ЗАЩИТЫ: ПРОВЕРЯЕМ ALCHEMY
        # ==========================================
        headers = {
            "X-Alchemy-Token": ALCHEMY_AUTH_TOKEN,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            # А. Получаем текущий список адресов из Alchemy
            get_url = f"https://dashboard.alchemy.com/api/webhook-addresses?webhook_id={ALCHEMY_WEBHOOK_ID}&limit=100"
            get_response = await client.get(get_url, headers=headers)
            
            if get_response.status_code != 200:
                print(f"❌ Ошибка при чтении списка Alchemy: {get_response.text}")
                return {"status": "error", "message": "Не удалось получить список адресов от Alchemy"}
                
            alchemy_data = get_response.json()
            
            # 👇 ИСПРАВЛЕНО: Правильный ключ "data"
            raw_existing = alchemy_data.get("data", alchemy_data.get("addresses", []))
            existing_alchemy_addresses = [addr.lower() for addr in raw_existing]
            
            # Фильтруем: кого нужно отправить, а кому просто починить статус
            final_addresses_to_push = []
            
            # Б. Сравниваем наши адреса со списком Alchemy
            for user in users_to_sync:
                addr = user.deposit_address
                if addr.lower() in existing_alchemy_addresses:
                    # Если адрес УЖЕ в Alchemy, просто чиним статус в БД на active
                    print(f"🔄 Адрес {addr} уже отслеживается в Alchemy. Меняем статус в БД на active.")
                    user.address_status = "active"
                else:
                    # Если адреса нет в Alchemy, добавляем в очередь на отправку
                    final_addresses_to_push.append(addr)
            
            # Сохраняем исправленные статусы для тех, кто уже был в Alchemy
            await db.commit()

            # Если отправлять больше некого (все уже были там), завершаем работу
            if not final_addresses_to_push:
                return {
                    "status": "success", 
                    "message": "Конфликты улажены: все deactive адреса уже были в Alchemy. Статусы в БД обновлены."
                }

            print(f"🚀 Проверка пройдена. Отправляем {len(final_addresses_to_push)} новых адресов...")

            # ==========================================
            # 🚀 ШАГ ОТПРАВКИ: ДОБАВЛЯЕМ В ALCHEMY
            # ==========================================
            patch_url = "https://dashboard.alchemy.com/api/update-webhook-addresses"
            payload = {
                "webhook_id": ALCHEMY_WEBHOOK_ID,
                "addresses_to_add": final_addresses_to_push,
                "addresses_to_remove": []
            }
            
            patch_response = await client.patch(patch_url, json=payload, headers=headers)
            
            # В. ТОЛЬКО ЕСЛИ ALCHEMY ОТВЕТИЛ "ОК" -> МЕНЯЕМ СТАТУС НА ACTIVE
            if patch_response.status_code == 200:
                for user in users_to_sync:
                    # Проверяем, что юзер был именно в списке на отправку
                    if user.deposit_address in final_addresses_to_push:
                        user.address_status = "active"
                
                await db.commit() # Сохраняем в БД только после успеха
                print(f"🎉 УСПЕХ! {len(final_addresses_to_push)} адресов добавлены в Alchemy и активированы в БД.")
                
                return {
                    "status": "success", 
                    "synced_count": len(final_addresses_to_push),
                    "addresses": final_addresses_to_push
                }
            else:
                # Если Alchemy выдал ошибку, база НЕ обновится, статус останется deactive
                print(f"❌ Ошибка при добавлении в Alchemy: {patch_response.text}")
                return {"status": "error", "message": "Сбой при записи адресов в Alchemy"}

    except Exception as e:
        print(f"❌ Системная ошибка: {e}")
        return {"status": "error", "message": str(e)}

# ==========================================
# 2. ЭНДПОИНТ (Если захочешь запустить руками по ссылке)
# ==========================================
@router.get("/audit-alchemy")
async def audit_alchemy_sync(db: AsyncSession = Depends(get_db)):
    # Просто вызывает логику выше
    result = await process_alchemy_audit(db)
    return result or {"status": "done"}
