import { create } from 'zustand';

interface UserState {
  // Web3 состояние
  walletAddress: string | null;
  isVip: boolean;

  // Действия
  connectWallet: (tgId: string, address: string) => Promise<void>;
  disconnectWallet: () => void;
  checkVipOnBackend: (tgId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  walletAddress: null,
  isVip: false,

 connectWallet: async (tgId: string, address: string) => {
    try {
      // 1. Стучимся к Питону и отдаем ему новенький адрес из MetaMask
      const response = await fetch('http://127.0.0.1:8000/api/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tg_id: tgId, wallet_address: address })
      });

      if (response.ok) {
        // 2. Питон ответил ОК (сохранил в БД)! Только теперь рисуем адрес на сайте
        set({ walletAddress: address });
      } else {
        console.error("Бэкенд отказался сохранять кошелек");
      }
      
    } catch (error) {
      console.error("Ошибка при отправке кошелька на бэкенд", error);
    }
  },

  disconnectWallet: () => {
    set({ walletAddress: null, isVip: false });
  },

  checkVipOnBackend: async (tgId: string) => {
    console.log("checkVipOnBackend")
    try {
      // Стучимся на бэкенд и передаем ему адрес кошелька
      // Заглушка для теста: жестко передаем id = "123456789". 
      // Потом заменим на реальный ID из Телеграма!
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