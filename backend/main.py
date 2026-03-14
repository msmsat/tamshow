from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from sqlalchemy.orm import selectinload

from database import engine, get_db
from models import Base, User, UserAsset
from google import genai
from pydantic import BaseModel

# 2. НОВАЯ НАСТРОЙКА КЛИЕНТА (Вставьте сюда ваш новый ключ!)
ai_client = genai.Client(api_key="AIzaSyCzexWCmyR4L6wvFE5nkj7TOmxfuolMHMM")


# 2. ФОРМА ПРИЕМА (Что мы ждем от React)
# Pydantic строго проверяет, чтобы React прислал именно JSON с полем "message"
class ChatMessage(BaseModel):
    message: str


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

@app.post("/api/ai-chat")
async def chat_with_oracle(request: ChatMessage):
    print("1")
    # Вытаскиваем текст, который написал пользователь в React
    user_text = request.message
    print(f"Получено сообщение от пользователя: {user_text}")
    
    # Создаем промпт: объясняем Gemini, как ей нужно себя вести
    system_prompt = f"""
    Ты - Nexus Oracle, виртуальный ИИ-ассистент киберпанк-магазина 'Nexus Store'.
    Ты должен отвечать на вопросы пользователя коротко, стильно и с долей киберпанк-сленга.
    Вопрос пользователя: {user_text}
    """
    
    try:
        # Отправляем вопрос в Google и ждем ответ
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=system_prompt,
        )
        
        # Возвращаем ответ обратно в React в формате JSON
        # Ключ "reply" должен совпадать с тем, что мы написали во фронтенде (data.reply)
        return {"reply": response.text}
        
    except Exception as e:
        # Если Google недоступен или лимит исчерпан
        print(f"Ошибка Gemini: {e}")
        return {"reply": "Системный сбой. Связь с Оракулом прервана. Попробуйте позже."}

@app.get("/api/wallet/status")
async def check_wallet_status(tg_id: str, db: AsyncSession = Depends(get_db)):
    if not tg_id:
        return {"is_connected": False, "wallet_address": None}

    try:
        # 1. Ищем юзера в таблице users по его Telegram ID
        query = select(User).where(User.telegram_id == tg_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        # 2. ТИХАЯ РЕГИСТРАЦИЯ: Если юзера нет, создаем его прямо сейчас!
        if not user:
            new_user = User(telegram_id=tg_id)
            db.add(new_user)
            await db.commit() # Сохраняем в базу данных
            
            print(f"✅ Создан новый пользователь с TG ID: {tg_id}")
            # Возвращаем False, так как кошелек он еще не привязал
            return {"is_connected": False, "wallet_address": None}

        # 3. Если юзер ЕСТЬ и у него заполнен wallet_address
        if user.wallet_address:
            return {
                "is_connected": True,
                "wallet_address": user.wallet_address
            }
            
        # 4. Если юзер есть, но кошелек еще не привязывал
        return {
            "is_connected": False,
            "wallet_address": None
        }

    except Exception as e:
        print(f"Ошибка БД при поиске/создании юзера: {e}")
        return {"is_connected": False, "wallet_address": None}