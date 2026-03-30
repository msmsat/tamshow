// Общие типы для всех stores

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: 'merch' | 'subscription'; // или просто string
  image: string;
  is_bought?: boolean; // 🔥 ВОТ ЭТА СТРОЧКА СПАСЕТ СИТУАЦИЮ
}

export interface CartItem extends Product {
  quantity: number;
}
