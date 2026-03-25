from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Импортируем вашу функцию для БД и новую модель
from database import get_db
from models import CartItem, User, Product

# Создаем роутер с префиксом, чтобы не писать /api/cart каждый раз
router = APIRouter(
    prefix="/api/cart",
    tags=["Cart"]
)

# ================= МОДЕЛИ ДАННЫХ =================

class CartAddRequest(BaseModel):
    tg_id: str
    product_id: str
    quantity: int = 1

class CartUpdateRequest(BaseModel):
    tg_id: str
    product_id: str
    quantity: int

class CartRemoveRequest(BaseModel):
    tg_id: str
    product_id: str

class CheckoutPayRequest(BaseModel):
    tg_id: str
    total_amount: float

# ================= ЭНДПОИНТЫ =================

# 1. ПОЛУЧИТЬ КОРЗИНУ ЮЗЕРА
@router.get("/{tg_id}")
async def get_cart(tg_id: str, db: AsyncSession = Depends(get_db)):
    # Ищем все товары этого юзера
    query = select(CartItem).where(CartItem.telegram_id == tg_id)
    result = await db.execute(query)
    items = result.scalars().all()

    # Собираем их в список для Реакта
    # ВАЖНО: Мы пока отдаем только ID и количество. 
    # В идеале React сам подтянет картинки и цены по этим ID из своего списка товаров,
    # либо вам нужно будет делать JOIN с таблицей Products.
    cart_data = [
        {
            "id": item.product_id, 
            "quantity": item.quantity
            # Сюда можно добавить title, price, image, если сохранять их в БД корзины
        } for item in items
    ]
    
    return {"cart": cart_data}

# 2. ДОБАВИТЬ ТОВАР (или увеличить количество)
@router.post("/add")
async def add_to_cart(req: CartAddRequest, db: AsyncSession = Depends(get_db)):
    # Проверяем, есть ли уже этот товар у юзера
    query = select(CartItem).where(
        CartItem.telegram_id == req.tg_id,
        CartItem.product_id == req.product_id
    )
    result = await db.execute(query)
    existing_item = result.scalar_one_or_none()

    if existing_item:
        # Увеличиваем количество
        existing_item.quantity += req.quantity
    else:
        # Создаем новую запись
        new_item = CartItem(
            telegram_id=req.tg_id,
            product_id=req.product_id,
            quantity=req.quantity
        )
        db.add(new_item)

    await db.commit()
    return {"success": True}

# 3. ОБНОВИТЬ ТОЧНОЕ КОЛИЧЕСТВО (+ / -)
@router.post("/update")
async def update_cart_quantity(req: CartUpdateRequest, db: AsyncSession = Depends(get_db)):
    query = select(CartItem).where(
        CartItem.telegram_id == req.tg_id,
        CartItem.product_id == req.product_id
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if item:
        item.quantity = req.quantity
        await db.commit()
        return {"success": True}
        
    return {"success": False, "error": "Item not found"}

# 4. УДАЛИТЬ ТОВАР СОВСЕМ
@router.post("/remove")
async def remove_from_cart(req: CartRemoveRequest, db: AsyncSession = Depends(get_db)):
    query = select(CartItem).where(
        CartItem.telegram_id == req.tg_id,
        CartItem.product_id == req.product_id
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if item:
        await db.delete(item)
        await db.commit()
        return {"success": True}

    return {"success": False, "error": "Item not found"}

# =======================================================
# 5. ПРЕДПРОСМОТР БАЛАНСА ПЕРЕД ОПЛАТОЙ
# =======================================================
@router.get("/checkout-preview/{tg_id}")
async def checkout_preview(tg_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Ищем или создаем юзера
    query = select(User).where(User.telegram_id == tg_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(telegram_id=tg_id, internal_balance=0.0)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 2. ДОСТАЕМ КОРЗИНУ И СЧИТАЕМ СУММУ САМИ
    cart_query = select(CartItem, Product).join(
        Product, CartItem.product_id == Product.shopify_id
    ).where(CartItem.telegram_id == tg_id)
    
    cart_result = await db.execute(cart_query)
    items_with_products = cart_result.all()

    # 🛑 ЖЕСТКАЯ ПРОВЕРКА НА ПУСТУЮ КОРЗИНУ 🛑
    if not items_with_products:
        return {
            "can_pay": False, # Запрещаем оплату
            "internal_balance": user.internal_balance,
            "deposit_address": user.deposit_address or "",
            "calculated_total": 0.0,
            "message": "Ошибка: Корзина пуста или товары не найдены в базе данных!"
        }

    # Считаем "грязную" сумму
    subtotal = 0.0
    for cart_item, product in items_with_products:
        subtotal += product.price * cart_item.quantity

    # Применяем скидки и комиссии
    discount = round(subtotal * 0.2) if user.wallet_address else 0
    network_fee = round(subtotal * 0.05)
    total_calculated = subtotal - discount + network_fee

    # 3. Проверяем, хватает ли денег
    can_pay = user.internal_balance >= total_calculated

    return {
        "can_pay": can_pay, 
        "internal_balance": user.internal_balance,
        "deposit_address": user.deposit_address or "",
        "calculated_total": total_calculated, # Отдаем фронту то, что насчитали
        "message": "Успешный подсчет" 
    }

# =======================================================
# 6. ФИНАЛЬНАЯ ОПЛАТА С БАЛАНСА
# =======================================================
@router.post("/pay")
async def process_payment(req: CheckoutPayRequest, db: AsyncSession = Depends(get_db)):
    # 1. Ищем юзера
    query = select(User).where(User.telegram_id == req.tg_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        return {"success": False, "error": "Пользователь не найден"}

    # 2. ДОСТАЕМ КОРЗИНУ И СЧИТАЕМ СУММУ САМИ (Защита от хакеров)
    cart_query = select(CartItem, Product).join(
        Product, CartItem.product_id == Product.shopify_id
    ).where(CartItem.telegram_id == req.tg_id)
    
    cart_result = await db.execute(cart_query)
    items_with_products = cart_result.all()

    if not items_with_products:
        return {"success": False, "error": "Корзина пуста!"}

    # Считаем реальную сумму на основе базы данных
    subtotal = 0.0
    for cart_item, product in items_with_products:
        subtotal += product.price * cart_item.quantity

    # Применяем скидки и комиссии точно так же, как в превью
    discount = round(subtotal * 0.2) if user.wallet_address else 0
    network_fee = round(subtotal * 0.05)
    total_calculated = subtotal - discount + network_fee

    # 3. Проверяем, хватает ли денег
    if user.internal_balance < total_calculated:
        return {
            "success": False, 
            "error": f"Недостаточно средств. Нужно: ${total_calculated}, Баланс: ${user.internal_balance}"
        }

    # 4. Списываем ИСТИННУЮ сумму (игнорируем ту, что прислал React)
    user.internal_balance -= total_calculated

    # 5. Очищаем корзину 
    # Так как мы уже достали cart_item в шаге 2, мы можем сразу их удалить
    for cart_item, _ in items_with_products:
        await db.delete(cart_item)

    # 6. Сохраняем изменения
    await db.commit()
    
    return {
        "success": True, 
        "new_balance": user.internal_balance, 
        "paid_amount": total_calculated
    }