from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# Базовый класс для всех моделей
class Base(DeclarativeBase):
    pass

# 1️⃣ Пользователи (users)
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    telegram_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    wallet_address: Mapped[Optional[str]] = mapped_column(String, index=True)
    deposit_address: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    # Статус адреса (по умолчанию делаем "deactive", раз мы решили следить за ними всегда)
    address_status: Mapped[str] = mapped_column(String, default="deactive")
    deposit_private_key: Mapped[Optional[str]] = mapped_column(String)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    internal_balance: Mapped[float] = mapped_column(Float, default=0.0)

    # Связи
    subscriptions: Mapped[List["Subscription"]] = relationship(back_populates="user")
    orders: Mapped[List["Order"]] = relationship(back_populates="user")
    chat_context: Mapped["ChatContext"] = relationship(back_populates="user")
    assets: Mapped[List["UserAsset"]] = relationship(back_populates="user")

# 2️⃣ Товары (products)
class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String)
    price: Mapped[float] = mapped_column(Float)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    shopify_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

# 3️⃣ Подписки (subscriptions)
class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String) # "premium analytics", "VIP NFT access"
    status: Mapped[str] = mapped_column(String) # ACTIVE, EXPIRED, PENDING
    payment_ref: Mapped[Optional[str]] = mapped_column(String)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="subscriptions")

# 4️⃣ Заказы (orders)
class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    total_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String, default="PENDING") # PENDING, PAID, CANCELLED
    payment_ref: Mapped[Optional[str]] = mapped_column(String, unique=True)
    blockchain_tx_hash: Mapped[Optional[str]] = mapped_column(String)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    price: Mapped[float] = mapped_column(Float)
    
    # 📦 НОВОЕ ПОЛЕ: Статус конкретного товара в заказе
    # Статусы: "PAID_NOT_DELIVERED" (оплачено, ждет выдачи), "DELIVERED" (выдано), "REFUNDED"
    status: Mapped[str] = mapped_column(String, default="PAID_NOT_DELIVERED")

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()

# 6️⃣ Транзакции (transactions)
class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    blockchain_tx_hash: Mapped[str] = mapped_column(String, unique=True, index=True)
    from_address: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Float)
    token: Mapped[str] = mapped_column(String) # USDT, ETH, TON...
    status: Mapped[str] = mapped_column(String, default="PENDING") # PENDING, CONFIRMED, FAILED
    confirmations_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship(back_populates="transactions")

# 7️⃣ AI-чат с пользователем (chat_contexts)
class ChatContext(Base):
    __tablename__ = "chat_contexts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    conversation_context: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="chat_context")

# 8️⃣ NFT/токены для скидок (user_assets)
class UserAsset(Base):
    __tablename__ = "user_assets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    asset_type: Mapped[str] = mapped_column(String) # NFT / TOKEN
    asset_contract: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Float, default=1.0)
    last_checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="assets")

# 9️⃣ Корзина (cart_items)
class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Привязываем просто по telegram_id (как строку), чтобы не делать сложных JOIN-ов при каждом клике
    telegram_id: Mapped[str] = mapped_column(String, index=True) 
    # Храним ID товара (в виде строки, так как у вас с фронта приходят строковые ID)
    product_id: Mapped[str] = mapped_column(String, index=True)
    # Количество
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
