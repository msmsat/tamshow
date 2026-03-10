// Общие типы для всех stores

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  category: 'merch' | 'subscription';
}

export interface CartItem extends Product {
  quantity: number;
}
