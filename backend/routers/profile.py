from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, desc, asc
from pydantic import BaseModel # 🔥 Добавили это

# Импортируем подключение к БД и наши модели
from database import get_db
from models import User, Order, OrderItem, Product

# Модель для получения данных от React
class OrderViewedRequest(BaseModel):
    tg_id: str
    is_viewed: bool

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)

@router.get("/orders/{tg_id}")
async def get_active_orders(tg_id: str, db: AsyncSession = Depends(get_db)):
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
            "name": product.name, # Название худи/товара
            "date": order.created_at.strftime("%Y-%m-%d"), # Красивая дата (например, 2024-03-26)
            "status": display_status,
            "tracking": display_tracking,
            "is_viewed": order.is_viewed, # 🔥 ВОТ НАШ НОВЫЙ ФЛАЖОК
            "product_id": product.shopify_id
        })

    return {
        "success": True,
        "orders": active_orders
    }

# 3. НОВЫЙ ЭНДПОИНТ: Принудительно меняем статус is_viewed (True / False)
@router.post("/orders/set-viewed")
async def set_orders_viewed_status(req: OrderViewedRequest, db: AsyncSession = Depends(get_db)):
    # 1. Ищем юзера по tg_id
    user_query = select(User).where(User.telegram_id == req.tg_id)
    user = (await db.execute(user_query)).scalar_one_or_none()

    if not user:
        return {"success": False, "error": "Пользователь не найден"}

    # 2. Обновляем флажок is_viewed у ВСЕХ заказов этого юзера 
    # на то значение, которое прислал React (req.is_viewed)
    update_query = (
        update(Order)
        .where(Order.user_id == user.id)
        .values(is_viewed=req.is_viewed)
    )
    
    await db.execute(update_query)
    await db.commit()

    return {
        "success": True, 
        "message": f"Статус всех заказов изменен на is_viewed={req.is_viewed}"
    }

@router.get("/orders/unseen/{tg_id}")
async def check_unseen_items(tg_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Находим юзера
    user_query = select(User).where(User.telegram_id == tg_id)
    user = (await db.execute(user_query)).scalar_one_or_none()

    if not user:
        return {"success": False, "has_unseen": False}

    # 2. Ищем в БД то, на что юзер еще НЕ обратил внимание (is_viewed == False)
    query = select(Order).where(
        Order.user_id == user.id, 
        Order.is_viewed == False
    )
    print(f"Проверяем наличие непросмотренных заказов для пользователя {tg_id} (user_id={user.id})...")
    result = await db.execute(query)
    
    # 3. Если нашлась хоть одна такая запись — возвращаем True
    has_unseen = result.first() is not None 
    print(f"Результат проверки непросмотренных заказов для {tg_id}: {has_unseen}")

    return {
        "success": True, 
        "has_unseen": has_unseen # Вернет True (если есть непросмотренное) или False
    }