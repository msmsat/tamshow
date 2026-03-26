from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Импортируем подключение к БД и наши модели
from database import get_db
from models import User, Order, OrderItem, Product

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
            "tracking": display_tracking
        })

    return {
        "success": True,
        "orders": active_orders
    }