import asyncio
from sqlalchemy.future import select
from database import get_db
from models import Product

PRODUCTS_DATA = [
    {"shopify_id": "1", "name": "Nexus Hoodie", "price": 4999.0, "description": "Limited edition cyberpunk merch", "stock": 100},
    {"shopify_id": "2", "name": "VIP Pass", "price": 9999.0, "description": "12-month exclusive access", "stock": 100},
    {"shopify_id": "3", "name": "Purple Cap", "price": 2999.0, "description": "Classic snapback with logo", "stock": 100},
    {"shopify_id": "4", "name": "NFT Blueprint", "price": 14999.0, "description": "Exclusive digital asset", "stock": 100},
    {"shopify_id": "5", "name": "Cyber Sneakers", "price": 7999.0, "description": "High-tech footwear edition", "stock": 100},
    {"shopify_id": "6", "name": "Nexus Jacket", "price": 5999.0, "description": "Premium urban collection", "stock": 100},
]

async def seed_db():
    print("🚀 Начинаем загрузку товаров в базу данных...")
    
    # Берем сессию БД прямо из твоей функции get_db!
    async for db in get_db():
        for item in PRODUCTS_DATA:
            query = select(Product).where(Product.shopify_id == item["shopify_id"])
            result = await db.execute(query)
            existing_product = result.scalar_one_or_none()

            if not existing_product:
                new_product = Product(**item)
                db.add(new_product)
                print(f"✅ Добавлен товар: {item['name']} за ${item['price']}")
            else:
                print(f"⚠️ Товар уже существует: {item['name']}")

        await db.commit()
        print("🎉 Готово! Все товары успешно загружены в БД.")
        break # Выходим, так как нам нужна была только одна сессия

if __name__ == "__main__":
    asyncio.run(seed_db())