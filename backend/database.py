from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from models import Base
import os

# Строка подключения к PostgreSQL (обрати внимание на +asyncpg)
# Формат: postgresql+asyncpg://пользователь:пароль@хост:порт/имя_базы
<<<<<<< Updated upstream
DATABASE_URL = os.getenv("DATABASE_URL")
=======
DATABASE_URL = "postgresql+asyncpg://postgres:Matviko@localhost:5342/tamshow_db"
>>>>>>> Stashed changes

# Создаем асинхронный движок (echo=True будет выводить все SQL-запросы в терминал, удобно для дебага)
engine = create_async_engine(DATABASE_URL, echo=True)

# Фабрика для создания сессий БД
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Функция-зависимость для получения сессии в эндпоинтах FastAPI
async def get_db():
    async with async_session_maker() as session:
        yield session