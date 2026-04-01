from fastapi import APIRouter, Depends # 🔥 Добавили Depends
from sqlalchemy.ext.asyncio import AsyncSession # 🔥 Добавили AsyncSession
from sqlalchemy.future import select # 🔥 Добавили select
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
import os
from typing import List, Dict, Any # 🔥 Добавь этот импорт
from database import get_db
from models import Product


# Load environment variables from .env file
load_dotenv()


# 1. СОЗДАЕМ РОУТЕР
router = APIRouter(
    prefix="/api",
    tags=["AI Oracle"]
)

# 2. НАСТРАЙКА КЛИЕНТА ИИ (Ваш ключ)
ai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# 3. ФОРМА ПРИЕМА ДАННЫХ
class ChatMessage(BaseModel):
    message: List[Dict[str, Any]]

# 4. САМ ЭНДПОИНТ (Путь будет /api/ai-chat)

@router.post("/ai-chat")
async def chat_with_oracle(request: ChatMessage, db: AsyncSession = Depends(get_db)):
    print("1")
    # Вытаскиваем текст, который написал пользователь в React
    chat = request.message
    user_text = chat[-1]['content']
    print(f"Получено сообщение от пользователя: {user_text}")

    # 🔥 ШАГ 1: ДОСТАЕМ КАТАЛОГ ИЗ БАЗЫ ДАННЫХ
    query = select(Product)
    result = await db.execute(query)
    products = result.scalars().all()

    # Формируем красивый текст со всеми товарами, чтобы ИИ смог их прочитать
    catalog_text = "Текущий ассортимент магазина 'Nexus Store':\n"
    if not products:
        catalog_text += "К сожалению, сейчас все товары распроданы.\n"
    else:
        for p in products:
            catalog_text += f"- Название: {p.title} | Цена: ${p.price} | Описание: {p.description}\n"
    
    # Создаем промпт: объясняем Gemini, как ей нужно себя вести
    # 🔥 ШАГ 2: ВШИВАЕМ КАТАЛОГ В МОЗГИ ИИ
    system_prompt = f"""
    Ты - Nexus Oracle, виртуальный ИИ-ассистент киберпанк-магазина 'Nexus Store'.
    Ты должен отвечать на вопросы пользователя коротко, как продовец от бога.
    Пиши в стиле markdown, чтобы на фронтенде было красиво. Не придумывай ничего сверх того, 
    что есть в каталоге. Если тебя спрашивают про товары, говори интересно и роскажи о каждом товаре.
    
    
    {catalog_text}
    
    Если пользователь спрашивает про товары, предлагай ТОЛЬКО то, что есть в списке ассортимента выше. Не выдумывай цены.
    
    Контекст для ответа - это история чата: {chat}.
    Вопрос пользователя: {user_text}.
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
