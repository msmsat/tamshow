from fastapi import APIRouter
from pydantic import BaseModel
from google import genai

# 1. СОЗДАЕМ РОУТЕР
router = APIRouter(
    prefix="/api",
    tags=["AI Oracle"]
)

# 2. НАСТРАЙКА КЛИЕНТА ИИ (Ваш ключ)
ai_client = genai.Client(api_key="AIzaSyCzexWCmyR4L6wvFE5nkj7TOmxfuolMHMM")

# 3. ФОРМА ПРИЕМА ДАННЫХ
class ChatMessage(BaseModel):
    message: str

# 4. САМ ЭНДПОИНТ (Путь будет /api/ai-chat)

@router.post("/ai-chat")
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
