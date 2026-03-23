from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.routers import webhook_wallet
from database import engine, get_db
from models import Base

# 1. ИМПОРТИРУЕМ НАШИ РОУТЕРЫ ИЗ ПАПКИ
from routers import wallet, ai_chat
from routers.cart import router as cart_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте: создаем таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ База данных готова!")
    yield
    # При выключении: закрываем соединения
    await engine.dispose()

# Инициализация FastAPI
app = FastAPI(lifespan=lifespan, title="Nexus Store API")

# Настройка CORS для React-фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🔌 ПОДКЛЮЧЕНИЕ МОДУЛЕЙ (РОУТЕРОВ)
# ==========================================
app.include_router(wallet.router)
app.include_router(ai_chat.router)
app.include_router(cart_router)  # Подключаем роутер корзины
app.include_router(webhook_wallet.router) # <-- Подключили сокеты
# ==========================================
# 🛠 БАЗОВЫЕ ТЕСТОВЫЕ ЭНДПОИНТЫ
# ==========================================
@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello {name}"}

@app.get("/test-db")
async def test_db(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT version();"))
    version = result.scalar()
    return {"message": "Успешное подключение к БД!", "postgres_version": version}
