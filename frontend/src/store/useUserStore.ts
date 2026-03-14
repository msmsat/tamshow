import { create } from 'zustand';

interface UserState {
  // Web3 состояние
  walletAddress: string | null;
  isVip: boolean;

  // Действия
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  checkVipOnBackend: () => Promise<void>;
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

  checkVipOnBackend: async () => {
    console.log("checkVipOnBackend")
    try {
      // Стучимся на бэкенд и передаем ему адрес кошелька
      // Заглушка для теста: жестко передаем id = "123456789". 
      // Потом заменим на реальный ID из Телеграма!
      const tgId = "620994031"; 
      const response = await fetch(`http://127.0.0.1:8000/api/wallet/status?tg_id=${tgId}`);
      if (!response.ok) throw new Error("Ошибка бэкенда");
      const data = await response.json();
      
      // Питон ответил! Записываем то, что он сказал (true или false)
      set({ walletAddress: data.wallet_address });
      
    } catch (error) {
      console.error("Бэкенд недоступен, статус VIP отклонен", error);
      // Если Питон упал или хакер обрезал интернет - строго даем false
      set({ walletAddress: null }); 
    }
  }
}))