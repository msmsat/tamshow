from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import engine, get_db
from models import Base

# Lifespan - это то, что выполняется при старте и выключении сервера
@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте: создаем все таблицы в базе данных
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ База данных готова!")
    yield
    # При выключении: закрываем соединения
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

# Настройка CORS для React-фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello {name}"}

# Тестовый эндпоинт для проверки связи с базой данных
@app.get("/test-db")
async def test_db(db: AsyncSession = Depends(get_db)):
    # Делаем простейший запрос к базе
    result = await db.execute(text("SELECT version();"))
    version = result.scalar()
    return {"message": "Успешное подключение к БД!", "postgres_version": version}