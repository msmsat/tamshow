from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, desc, asc
from pydantic import BaseModel # 🔥 Добавили это

# Импортируем подключение к БД и наши модели
from auth import get_current_user
from database import get_db
from models import User, Order, OrderItem, Product

# Модель для получения данных от React
class OrderViewedRequest(BaseModel):
    tg_id: str
    is_viewed: bool

class MarkViewedRequest(BaseModel):
    item_id: int

class CancelOrderRequest(BaseModel):
    item_id: int

class UpdateAddressRequest(BaseModel):
    address: str
    lat: float | None = None
    lon: float | None = None

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)

@router.get("/orders")
async def get_active_orders(db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    # 1. Сначала находим самого юзера по его Telegram ID
    user_query = select(User).where(User.telegram_id == tg_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()

    # Если юзера нет в базе, возвращаем пустой список
    if not user:
        return {"success": False, "orders": []}

    # 2. ДЕЛАЕМ УМНЫЙ ЗАПРОС С JOIN'АМИ
    # Мы просим БД достать сразу 3 таблицы: OrderItem, Order и Product
    query = (
        select(OrderItem, Order, Product)
        .join(Order, OrderItem.order_id == Order.id) # Приклеиваем чек
        .join(Product, OrderItem.product_id == Product.id) # Приклеиваем сам товар
        .where(Order.user_id == user.id) # Только заказы этого юзера
        .where(OrderItem.status == "PAID_NOT_DELIVERED") # Только те, что еще не доставлены
        .order_by(Order.created_at.desc()) # 🔥 ДОБАВЬ ЭТУ СТРОЧКУ
    )

    result = await db.execute(query)
    items_data = result.all() # Получаем список кортежей (OrderItem, Order, Product)

    # 3. ФОРМАТИРУЕМ ДАННЫЕ ДЛЯ REACT (OrdersModal)
    active_orders = []
    
    for order_item, order, product in items_data:
        # Если трек-номер уже вписан, статус "Shipped", иначе "Processing"
        display_status = "Shipped" if order.tracking_number else "Processing"
        display_tracking = order.tracking_number if order.tracking_number else "Awaiting dispatch..."

        active_orders.append({
            "id": order_item.id, # Уникальный ID позиции в заказе
            "name": product.title, # Название худи/товара
            "date": order.created_at.strftime("%Y-%m-%d"), # Красивая дата (например, 2024-03-26)
            "status": display_status,
            "tracking": display_tracking,
            "is_viewed": order.is_viewed, # 🔥 ВОТ НАШ НОВЫЙ ФЛАЖОК
            "product_id": product.shopify_id,
        })

    return {
        "success": True,
        "orders": active_orders
    }

@router.get("/orders/unseen")
async def check_unseen_items(db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    # 1. Находим юзера
    user_query = select(User).where(User.telegram_id == tg_id)
    user = (await db.execute(user_query)).scalar_one_or_none()

    if not user:
        return {"success": False, "has_unseen": False}

    # 2. 🔥 УМНЫЙ ЗАПРОС: Ищем непросмотренные чеки, НО ТОЛЬКО если в них есть "PAID_NOT_DELIVERED" товары
    query = (
        select(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == user.id, 
            Order.is_viewed == False,
            OrderItem.status == "PAID_NOT_DELIVERED" # <- ВОТ ЭТА СТРОЧКА РЕШАЕТ ПРОБЛЕМУ
        )
    )
    
    print(f"Проверяем наличие непросмотренных заказов для пользователя {tg_id} (user_id={user.id})...")
    result = await db.execute(query)
    
    # 3. Если нашлась хоть одна такая запись — возвращаем True
    has_unseen = result.first() is not None 
    print(f"Результат проверки непросмотренных заказов для {tg_id}: {has_unseen}")

    return {
        "success": True, 
        "has_unseen": has_unseen
    }

# ЭНДПОИНТ: Меняем статус конкретного заказа на просмотренный
@router.post("/orders/mark-viewed")
async def mark_order_viewed(req: MarkViewedRequest, db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    # 1. Ищем позицию в заказе
    query = select(OrderItem).where(OrderItem.id == req.item_id, User.telegram_id == tg_id)
    item = (await db.execute(query)).scalar_one_or_none()
    
    if item:
        # 2. Ищем сам главный чек (Order) и ставим ему is_viewed = True
        order_query = select(Order).where(Order.id == item.order_id)
        order = (await db.execute(order_query)).scalar_one_or_none()
        
        if order:
            order.is_viewed = True
            await db.commit()
            return {"success": True}
            
    return {"success": False, "error": "Заказ не найден"}

# ЭНДПОИНТ: Отмена заказа и возврат средств
@router.post("/orders/cancel")
async def cancel_order(req: CancelOrderRequest, db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    # 1. Ищем юзера по TG ID
    user_query = select(User).where(User.telegram_id == tg_id)
    user = (await db.execute(user_query)).scalar_one_or_none()

    if not user:
        return {"success": False, "error": "Пользователь не найден"}

    # 2. Ищем конкретную позицию заказа (OrderItem) по ID
    item_query = select(OrderItem).where(OrderItem.id == req.item_id)
    order_item = (await db.execute(item_query)).scalar_one_or_none()

    if not order_item:
        return {"success": False, "error": "Заказ не найден"}

    # 3. Проверяем, можно ли отменить этот заказ
    if order_item.status != "PAID_NOT_DELIVERED":
        return {"success": False, "error": "Этот заказ уже отправлен или отменен"}

    # 4. 💰 ВОЗВРАЩАЕМ ДЕНЬГИ НА БАЛАНС ЮЗЕРА
    user.internal_balance += order_item.price

    # 5. Меняем статус товара на "CANCELLED" 
    # (лучше менять статус, а не удалять строку, чтобы оставалась история отмен)
    order_item.status = "CANCELLED"
    
    # 6. Сохраняем изменения в базу данных
    await db.commit()

    return {
        "success": True, 
        "message": f"Заказ отменен. ${order_item.price} возвращено на баланс."
    }

@router.post("/update-address")
async def update_user_address(req: UpdateAddressRequest, db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    # Ищем пользователя
    query = select(User).where(User.telegram_id == tg_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        return {"success": False, "error": "Пользователь не найден"}

    # Сохраняем адрес и координаты
    user.usr_adress = req.address
    user.usr_lat = req.lat
    user.usr_lon = req.lon
    await db.commit()

    return {"success": True, "message": "Address and coordinates updated successfully"}

@router.get("/address")
async def get_address(db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    query = select(User).where(User.telegram_id == tg_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        return {"success": False, "address": None, "lat": None, "lon": None}
    return {
        "success": True,
        "address": user.usr_adress,
        "lat": user.usr_lat,
        "lon": user.usr_lon
    }

@router.get("/info")
async def get_user_info(db: AsyncSession = Depends(get_db), tg_id: str = Depends(get_current_user)):
    query = select(User).where(User.telegram_id == tg_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        return {"success": False, "error": "User not found"}

    return {
        "success": True,
        "data": {
            "tg_id": user.telegram_id,
            "wallet": user.wallet_address,
            "address": user.usr_adress,
            "balance": user.internal_balance
        }
    }