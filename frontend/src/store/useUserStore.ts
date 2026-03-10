import { create } from 'zustand';

interface UserState {
  // Web3 состояние
  walletAddress: string | null;
  isVip: boolean;

  // Действия
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  setVip: (status: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  walletAddress: null,
  isVip: false,

  connectWallet: (address: string) => {
    set({ walletAddress: address, isVip: true });
  },

  disconnectWallet: () => {
    set({ walletAddress: null, isVip: false });
  },

  setVip: (status: boolean) => {
    set({ isVip: status });
  }
}));
