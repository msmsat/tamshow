from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, desc, asc
from pydantic import BaseModel
from typing import List, Optional

# Импортируем подключение к БД и наши модели
from auth import get_current_user
from database import get_db
from models import User, Order, OrderItem, Product, Subscription

router = APIRouter(
    prefix="/api/shop",
    tags=["Shop"]
)

class ProductResponse(BaseModel):
    id: int
    title: str       # 🔥 Было name, стало title
    description: Optional[str]
    price: float
    image: str       # 🔥 Добавили картинку
    category: str
    shopify_id: Optional[str]
    is_bought: bool

# 🔥 НАШ ТЕСТОВЫЙ ПУТЬ
@router.get("/ping")
async def ping_test():
    print("🟢 🟢 🟢 ПИНГ ПРОШЕЛ! Бэкенд УВИДЕЛ запрос от фронтенда! 🟢 🟢 🟢")
    return {"status": "success", "message": "Бэкенд на связи!"}

@router.get("/products", response_model=dict)
async def get_shop_products(
    limit: Optional[int] = Query(default=None, description="Сколько товаров вернуть (оставь пустым, чтобы вернуть все)"), 
    db: AsyncSession = Depends(get_db),
    telegram_id: str = Depends(get_current_user)
):
    print(f"⚠️ ⚠️ Получаем товары для пользователя с Telegram ID: {telegram_id} (limit={limit})")
    
    # 1. Ищем пользователя в БД
    user_query = select(User).where(User.telegram_id == telegram_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # 2. Ищем ID купленного мерча (чтобы знать, что помечать флажком)
    bought_products_query = (
        select(OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.user_id == user.id,
            Order.status == "PAID" 
        )
    )
    result = await db.execute(bought_products_query)
    bought_product_ids = set(result.scalars().all())

    # 3. Ищем активные подписки пользователя по их названиям
    subs_query = select(Subscription.type).where(
        Subscription.user_id == user.id,
        Subscription.status == "ACTIVE"
    )
    result = await db.execute(subs_query)
    active_sub_titles = list(result.scalars().all()) # 🔥 Превращаем в список

    # 4. Формируем запрос на получение товаров
    products_query = select(Product)
    
    # 🔥 МАГИЯ ЗДЕСЬ: Фильтруем прямо на уровне SQL-запроса!
    if active_sub_titles:
        # Логика: "Верни товар, ЕСЛИ он НЕ подписка ИЛИ ЕСЛИ его названия НЕТ в списке купленных"
        products_query = products_query.where(
            (Product.category != "subscription") | (~Product.title.in_(active_sub_titles))
        )
    
    # И только после фильтрации применяем лимит (теперь он будет работать честно!)
    if limit is not None:
        products_query = products_query.limit(limit)
        
    result = await db.execute(products_query)
    products = result.scalars().all()

    # 5. Формируем финальный ответ
    response_data = []
    for product in products:
        
        # Поскольку мы уже отсеяли купленные подписки в запросе к БД, 
        # is_bought для подписок всегда будет False. Оставляем только для мерча.
        is_already_bought = product.id in bought_product_ids if product.category == "merch" else False
        
        response_data.append({
            "id": product.id,
            "title": product.title,
            "description": product.description,
            "price": product.price,
            "image": product.image,
            "category": product.category,
            "shopify_id": product.shopify_id,
            "is_bought": is_already_bought
        })

    return {
        "status": "success",
        "data": response_data
    }

@router.get("/subscriptions", response_model=dict)
async def get_active_subscriptions(db: AsyncSession = Depends(get_db), telegram_id: str = Depends(get_current_user)):
    """
    Возвращает список всех активных подписок пользователя.
    """
    # 1. Ищем пользователя
    user_query = select(User).where(User.telegram_id == telegram_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()

    # Если пользователя нет в БД, значит и подписок у него нет
    if not user:
        return {"status": "success", "data": []}

    # 2. Ищем подписки этого пользователя со статусом ACTIVE
    subs_query = select(Subscription).where(
        Subscription.user_id == user.id,
        Subscription.status == "ACTIVE"
    )
    result = await db.execute(subs_query)
    subscriptions = result.scalars().all()

    # 3. Формируем красивый ответ для фронтенда
    response_data = []
    for sub in subscriptions:
        response_data.append({
            "id": sub.id,
            "type": sub.type,
            "status": sub.status,
            # Конвертируем дату в строку, чтобы JSON не ругался (если даты есть)
            "start_date": sub.start_date.strftime("%d %b %Y") if sub.start_date else None,
            "end_date": sub.end_date.strftime("%d %b %Y") if sub.end_date else None
        })

    return {
        "status": "success",
        "data": response_data
    }