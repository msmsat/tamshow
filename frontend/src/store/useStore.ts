import { create } from 'zustand';

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

interface StoreState {
  // Web3 состояние
  walletAddress: string | null;
  isVip: boolean;
  
  // Корзина
  cart: CartItem[];
  
  // Навигация
  selectedProductId: string | null;
  
  // Действия
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  setVip: (status: boolean) => void;
  
  // Корзина
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  isInCart: (productId: string) => boolean;

  // Навигация
  selectProduct: (productId: string | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Начальное состояние
  walletAddress: null,
  isVip: false,
  cart: [],
  selectedProductId: null,

  // Методы
  connectWallet: (address: string) => {
    set({ walletAddress: address, isVip: true });
  },

  disconnectWallet: () => {
    set({ walletAddress: null, isVip: false });
  },

  setVip: (status: boolean) => {
    set({ isVip: status });
  },

  addToCart: (product: Product) => {
    const { cart } = get();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      set({
        cart: cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      set({
        cart: [...cart, { ...product, quantity: 1 }]
      });
    }
  },

  removeFromCart: (productId: string) => {
    set(state => ({
      cart: state.cart.filter(item => item.id !== productId)
    }));
  },

  isInCart: (productId: string) => {
    const { cart } = get();
    return cart.some(item => item.id === productId);
  },

  selectProduct: (productId: string | null) => {
    set({ selectedProductId: productId });
  }
}));
