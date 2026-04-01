import asyncio
from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import Message, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from dotenv import load_dotenv
import os

load_dotenv()

# 1. Вставь сюда токен от BotFather
TOKEN = os.getenv("BOT_TOKEN")

# 2. Вставь сюда ссылку, которую выдал localtunnel (например, https://bright-cats-jump.loca.lt)
WEB_APP_URL = os.getenv("WEB_APP_URL")

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def command_start_handler(message: Message):
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🚀 Open Nexus Store",
        web_app=WebAppInfo(url=WEB_APP_URL) # Телеграм откроет твой React!
    )
    
    await message.answer(
        "Добро пожаловать в киберпанк-магазин! Нажми кнопку ниже.",
        reply_markup=builder.as_markup()
    )

async def main():
    print("🤖 Бот запущен! Жду команду /start...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())