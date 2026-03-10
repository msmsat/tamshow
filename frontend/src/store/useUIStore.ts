import { create } from 'zustand';

interface UIState {
  // Навигация и модалки
  selectedProductId: string | null;

  // Действия
  selectProduct: (productId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedProductId: null,

  selectProduct: (productId: string | null) => {
    set({ selectedProductId: productId });
  }
}));
