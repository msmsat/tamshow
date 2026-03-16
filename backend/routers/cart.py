from fastapi import APIRouter
from pydantic import BaseModel

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

# 1. Получить корзину (GET /api/cart/{tg_id})
@router.get("/{tg_id}")
async def get_cart(tg_id: str):
    print(f"🛒 [GET] Запрос на получение корзины для юзера: {tg_id}")
    # Пока возвращаем пустой массив, чтобы React не выдавал ошибку map()
    return {"cart": []}

# 2. Добавить товар (POST /api/cart/add)
@router.post("/add")
async def add_to_cart(req: CartAddRequest):
    print(f"➕ [ADD] Юзер {req.tg_id} добавил товар {req.product_id} (Кол-во: {req.quantity})")
    return {"success": True, "message": "Условно добавлено"}

# 3. Обновить количество (POST /api/cart/update)
@router.post("/update")
async def update_cart_quantity(req: CartUpdateRequest):
    print(f"🔄 [UPDATE] Юзер {req.tg_id} поставил кол-во {req.quantity} для товара {req.product_id}")
    return {"success": True, "message": "Количество условно обновлено"}

# 4. Удалить товар (POST /api/cart/remove)
@router.post("/remove")
async def remove_from_cart(req: CartRemoveRequest):
    print(f"🗑️ [REMOVE] Юзер {req.tg_id} полностью удалил товар {req.product_id}")
    return {"success": True, "message": "Условно удалено"}