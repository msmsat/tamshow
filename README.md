# 🌌 Nexus Store | Web3 Telegram Mini App

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Polygon](https://img.shields.io/badge/Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)

**Nexus Store** — это полноценный интернет-магазин в формате Telegram Mini App (TMA). Проект объединяет в себе стильный киберпанк-интерфейс, оплату в реальной криптовалюте (USDC в сети Polygon) и встроенного ИИ-ассистента на базе Google Gemini.

---

## ✨ Ключевые возможности

* 🔐 **Telegram Auth & Security:** Бесшовная авторизация через `initData` Телеграма. Бэкенд криптографически проверяет подписи, обеспечивая 100% защиту от подмены ID.
* 💳 **Web3 Payments (Polygon):** * Привязка криптокошельков (через WalletConnect / Web3Modal).
  * Генерация уникальных депозитных адресов для каждого пользователя.
  * Автоматическое отслеживание транзакций USDC через вебхуки **Alchemy**.
* 🤖 **AI Oracle (Gemini 2.5):** Встроенный ИИ-продавец, который знает актуальный ассортимент из базы данных и консультирует покупателей.
* 🛒 **Умная корзина и заказы:** Управление состоянием через Zustand, расчет скидок, история заказов со статусами доставки.
* 👑 **VIP Подписки:** Покупка цифровых VIP-пассов, дающих постоянную скидку 20% на весь ассортимент мерча.
* 🗺️ **Интерактивная карта:** Выбор точки доставки с помощью Leaflet.js.

---

## 🛠 Технологический стек

### Frontend
* **React + TypeScript** (сборщик Vite)
* **Zustand** — стейт-менеджмент
* **Framer Motion** — плавные анимации интерфейса
* **Web3Modal / Ethers.js** — взаимодействие с блокчейном
* **React Leaflet** — работа с картами
* **Lucide React** — иконки

### Backend
* **FastAPI** — асинхронный и сверхбыстрый API
* **PostgreSQL + SQLAlchemy** — база данных
* **Pydantic** — валидация данных
* **Web3.py** — генерация кошельков и проверка смарт-контрактов
* **Google GenAI** — интеграция с ИИ

---

## 🚀 Как запустить проект (Локально)

### 1. Настройка Базы Данных (Backend)
1. Перейдите в папку бэкенда: `cd backend`
2. Создайте виртуальное окружение: `python -m venv venv`
3. Активируйте его: `venv\Scripts\activate` (для Windows)
4. Установите зависимости: `pip install -r requirements.txt` *(убедись, что у тебя есть этот файл)*
5. Создайте файл `.env` и добавьте туда ключи:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
   BOT_TOKEN=твой_токен_от_botfather
   GOOGLE_API_KEY=твой_ключ_gemini
   ENCRYPTION_KEY=твой_ключ_для_шифрования_приватников
   ALCHEMY_AUTH_TOKEN=токен_alchemy
   ALCHEMY_WEBHOOK_ID=id_вебхука
   ALCHEMY_SIGNING_KEY=ключ_подписи_вебхука