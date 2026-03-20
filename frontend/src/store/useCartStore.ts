import { create } from 'zustand';
import type { Product, CartItem } from './types';

interface CartState {
  cart: CartItem[];
  // Добавили async параметры
  addToCart: (product: Product, tgId?: string) => Promise<void>;
  removeFromCart: (productId: string, tgId?: string) => Promise<void>;
  isInCart: (productId: string) => boolean;
  updateQuantity: (productId: string, quantity: number, tgId?: string) => Promise<void>;
  // Наша новая функция загрузки из БД
  fetchCart: (tgId: string, allProducts: Product[]) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: async (product: Product, tgId: string = "620994031") => {
    const { cart } = get();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      set({ cart: cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1 }] });
    }
    
    // 2. ДОБАВЛЯЕМ ВОТ ЭТОТ БЛОК В САМЫЙ КОНЕЦ ФУНКЦИИ:
    try {
      await fetch('http://127.0.0.1:8000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_id: tgId,            // ID пользователя
          product_id: product.id, // ID товара
          quantity: 1             // Сколько добавили за клик
        })
      });
      console.log("Улетело в Питон!");
    } catch (error) {
      console.error("Ошибка БД:", error);
    }
  },
  fetchCart: async (tgId: string, allProducts: Product[]) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/cart/${tgId}`);
      if (response.ok) {
        const data = await response.json(); // Приходит: { cart: [{id: "1", quantity: 2}] }
        
        // "Склеиваем" ID из БД с реальными товарами (картинками, ценами)
        const fullCartItems = data.cart.map((dbItem: any) => {
          // Ищем товар по ID среди всех товаров магазина
          const product = allProducts.find(p => p.id === dbItem.id);
          if (product) {
            return { ...product, quantity: dbItem.quantity };
          }
          return null;
        }).filter(Boolean); // Убираем пустые, если товар вдруг удалили из магазина

        // Записываем готовую корзину в стейт
        set({ cart: fullCartItems });
      }
    } catch (error) {
      console.error("❌ Ошибка при загрузке корзины:", error);
    }
  },

  removeFromCart: async (productId: string, tgId: string = "620994031") => {
    // 1. Мгновенно убираем из интерфейса (оптимистичное обновление)
    set(state => ({
      cart: state.cart.filter(item => item.id !== productId)
    }));

    // 2. Отправляем запрос Питону на полное удаление
    try {
      await fetch('http://127.0.0.1:8000/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_id: tgId,
          product_id: productId
        })
      });
      console.log("🗑️ Товар полностью удален из БД!");
    } catch (error) {
      console.error("❌ Ошибка при удалении из БД:", error);
    }
  },

  isInCart: (productId: string) => {
    const { cart } = get();
    return cart.some(item => item.id === productId);
  },

  updateQuantity: async (productId: string, quantity: number, tgId: string = "620994031") => {
    // 1. Мгновенно обновляем цифру на экране (UI)
    set(state => ({
      cart: state.cart.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      ).filter(item => item.quantity > 0)
    }));

    // 2. Отправляем новое точное количество в Питон
    try {
      await fetch('http://127.0.0.1:8000/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_id: tgId,
          product_id: productId,
          quantity: quantity // Отправляем итоговую цифру
        })
      });
      console.log("🔄 Количество успешно обновлено в БД!");
    } catch (error) {
      console.error("❌ Ошибка при обновлении количества:", error);
    }
  },
}));
