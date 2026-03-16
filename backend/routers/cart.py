from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Импортируем вашу функцию для БД и новую модель
from database import get_db
from models import CartItem

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